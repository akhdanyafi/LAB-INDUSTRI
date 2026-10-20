/**
 * Document Verifier — Hybrid PDF Verification
 * Validates uploaded documents (surat izin / surat permohonan) for auto-approve.
 * 
 * Level 1: File validation (PDF only, min size, magic bytes, page count)
 * Level 2: Text extraction (pdf-parse first, then Tesseract.js OCR fallback for scanned PDFs)
 * Level 3: Keyword matching against extracted text
 */

import { repoRead } from '@/lib/repo-storage';
import { readFile, access } from 'fs/promises';
import path from 'path';

// pdf-parse doesn't ship types, so require it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

// ─── Types ───────────────────────────────────────────────────

export type DocumentType = 'suratIzin' | 'suratPermohonan';

export interface FileValidationResult {
    valid: boolean;
    reason?: string;
}

export interface VerificationResult {
    valid: boolean;
    score: number; // 0-100 percentage
    matchedKeywords: string[];
    missingKeywords: string[];
    extractionMethod: 'text' | 'ocr' | 'hybrid';
    ocrUsed: boolean;
}

// ─── Keyword Configuration ──────────────────────────────────

/** Shared keywords for all document types */
const SHARED_KEYWORDS = [
    'UNIVERSITAS AL-AZHAR INDONESIA',
    'FAKULTAS SAINS DAN TEKNOLOGI',
    'Informatika',
    'Nomor',
    'Perihal',
    'Lampiran',
    'Menyetujui',
];

/** Keywords specific to each document type */
const TYPE_KEYWORDS: Record<DocumentType, string[][]> = {
    suratIzin: [
        ['peminjaman'],
        ['permohonan'],
        ['kegiatan'],
        ['Dekan', 'Wakil Dekan', 'Rektor'],          // any one matches
        ['Ketua Pelaksana', 'Ketua Himpunan'],        // any one matches
        ['ttd', 'tanda tangan', 'Tanda Tangan'],
    ],
    suratPermohonan: [
        ['peminjaman', 'penggunaan ruangan'],
        ['permohonan'],
        ['kegiatan'],
        ['Ketua Program Studi', 'Dekan', 'Wakil Dekan'],
        ['Ketua Pelaksana', 'Ketua Himpunan'],
        ['ttd', 'tanda tangan', 'Tanda Tangan'],
    ],
};

const MIN_FILE_SIZE = 5 * 1024; // 5KB minimum
const PDF_MAGIC_BYTES = Buffer.from('%PDF-');
const VALIDITY_THRESHOLD = 0.5; // 50% of keywords must match
const MIN_TEXT_LENGTH = 50; // Minimum characters to consider text extraction successful

// ─── OCR Helper ─────────────────────────────────────────────

const MAX_OCR_WIDTH = 1200; // Maximum width for OCR images — prevents worker crashes on large scans

/**
 * Downscale raw pixel data to a manageable size for OCR.
 * Uses nearest-neighbor sampling for speed (OCR doesn't need smooth interpolation).
 */
function downscalePixels(
    data: Uint8ClampedArray | Uint8Array,
    srcWidth: number,
    srcHeight: number,
    channels: number,
    maxWidth: number
): { data: Uint8ClampedArray; width: number; height: number } {
    if (srcWidth <= maxWidth) {
        return { data: new Uint8ClampedArray(data), width: srcWidth, height: srcHeight };
    }

    const scale = maxWidth / srcWidth;
    const dstWidth = Math.floor(srcWidth * scale);
    const dstHeight = Math.floor(srcHeight * scale);
    const dstData = new Uint8ClampedArray(dstWidth * dstHeight * channels);

    for (let dy = 0; dy < dstHeight; dy++) {
        const sy = Math.floor(dy / scale);
        for (let dx = 0; dx < dstWidth; dx++) {
            const sx = Math.floor(dx / scale);
            const srcIdx = (sy * srcWidth + sx) * channels;
            const dstIdx = (dy * dstWidth + dx) * channels;
            for (let c = 0; c < channels; c++) {
                dstData[dstIdx + c] = data[srcIdx + c] || 0;
            }
        }
    }

    return { data: dstData, width: dstWidth, height: dstHeight };
}

/**
 * Convert raw RGB pixel data to an uncompressed BMP buffer.
 * Tesseract.js needs a proper image format — raw pixel arrays won't work.
 */
function rawPixelsToBmp(data: Uint8ClampedArray | Uint8Array, width: number, height: number, channels: number): Buffer {
    // BMP with 24-bit color (RGB)
    const rowSize = Math.ceil((width * 3) / 4) * 4; // Rows must be 4-byte aligned
    const pixelDataSize = rowSize * height;
    const fileSize = 54 + pixelDataSize; // 14 (file header) + 40 (info header) + pixel data

    const bmp = Buffer.alloc(fileSize);

    // ── File Header (14 bytes) ──
    bmp.write('BM', 0);                    // Signature
    bmp.writeUInt32LE(fileSize, 2);        // File size
    bmp.writeUInt32LE(0, 6);               // Reserved
    bmp.writeUInt32LE(54, 10);             // Pixel data offset

    // ── Info Header (40 bytes) ──
    bmp.writeUInt32LE(40, 14);             // Header size
    bmp.writeInt32LE(width, 18);           // Width
    bmp.writeInt32LE(-height, 22);         // Height (negative = top-down)
    bmp.writeUInt16LE(1, 26);              // Color planes
    bmp.writeUInt16LE(24, 28);             // Bits per pixel (24 = RGB)
    bmp.writeUInt32LE(0, 30);              // Compression (0 = none)
    bmp.writeUInt32LE(pixelDataSize, 34);  // Image size
    bmp.writeInt32LE(2835, 38);            // X pixels per meter (72 DPI)
    bmp.writeInt32LE(2835, 42);            // Y pixels per meter
    bmp.writeUInt32LE(0, 46);              // Colors used
    bmp.writeUInt32LE(0, 50);              // Important colors

    // ── Pixel Data ──
    // BMP stores pixels as BGR, top-down (because we used negative height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * channels;
            const dstIdx = 54 + y * rowSize + x * 3;

            const r = data[srcIdx] || 0;
            const g = data[srcIdx + 1] || 0;
            const b = data[srcIdx + 2] || 0;

            bmp[dstIdx] = b;     // Blue
            bmp[dstIdx + 1] = g; // Green
            bmp[dstIdx + 2] = r; // Red
        }
    }

    return bmp;
}

/**
 * Extract text from a scanned PDF using Tesseract.js OCR.
 * Extracts embedded images from PDF pages via pdfjs-dist, converts to BMP, then runs OCR.
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
    try {
        // Dynamic imports to avoid loading heavy modules unless needed
        const { createWorker } = await import('tesseract.js');
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Load PDF document
        const pdfData = new Uint8Array(buffer);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        // Only OCR the first 2 pages (enough for surat header + body)
        const pagesToProcess = Math.min(pdf.numPages, 2);
        const ocrTexts: string[] = [];

        // Create Tesseract worker with Indonesian + English
        const worker = await createWorker('ind+eng');

        for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            const page = await pdf.getPage(pageNum);

            // Step A: Try text content layer first (cheaper than OCR)
            try {
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: Record<string, unknown>) => (typeof item.str === 'string' ? item.str : ''))
                    .join(' ');

                if (pageText.trim().length > MIN_TEXT_LENGTH) {
                    ocrTexts.push(pageText);
                    continue; // Skip OCR for this page — text layer is sufficient
                }
            } catch {
                // Text extraction failed, proceed to image extraction
            }

            // Step B: Extract embedded images from the page and OCR them
            let pageOcrDone = false;
            try {
                const ops = await page.getOperatorList();
                const pdfjsOps = pdfjsLib.OPS;

                for (let i = 0; i < ops.fnArray.length; i++) {
                    if (pageOcrDone) break;

                    if (ops.fnArray[i] === pdfjsOps.paintImageXObject ||
                        ops.fnArray[i] === pdfjsOps.paintXObject) {
                        const imgName = ops.argsArray[i][0];
                        try {
                            const img = await page.objs.get(imgName);
                            if (img && img.data && img.width > 100 && img.height > 100) {
                                // Determine channels: kind 1 = Grayscale, kind 2 = RGB, kind 3 = RGBA
                                const channels = img.kind === 1 ? 1 : img.kind === 3 ? 4 : 3;

                                // For grayscale, expand to RGB
                                let rgbData: Uint8ClampedArray;
                                let effectiveChannels = channels === 1 ? 3 : channels;
                                if (channels === 1) {
                                    rgbData = new Uint8ClampedArray(img.width * img.height * 3);
                                    for (let j = 0; j < img.data.length; j++) {
                                        rgbData[j * 3] = img.data[j];
                                        rgbData[j * 3 + 1] = img.data[j];
                                        rgbData[j * 3 + 2] = img.data[j];
                                    }
                                } else {
                                    rgbData = img.data;
                                }

                                // Downscale large images to prevent worker crashes
                                const scaled = downscalePixels(rgbData, img.width, img.height, effectiveChannels, MAX_OCR_WIDTH);

                                // Convert to BMP for Tesseract
                                const bmpBuffer = rawPixelsToBmp(
                                    scaled.data,
                                    scaled.width,
                                    scaled.height,
                                    effectiveChannels
                                );

                                console.log(`[OCR] Processing image ${imgName}: ${img.width}x${img.height} -> ${scaled.width}x${scaled.height}, bmp=${bmpBuffer.length} bytes`);

                                const { data: ocrResult } = await worker.recognize(bmpBuffer);
                                if (ocrResult.text.trim().length > 10) {
                                    ocrTexts.push(ocrResult.text);
                                    pageOcrDone = true; // One large image per page is usually enough
                                    console.log(`[OCR] Got ${ocrResult.text.trim().length} chars from ${imgName}`);
                                }
                            }
                        } catch (imgErr) {
                            console.log(`[OCR] Failed to process image ${imgName}:`, imgErr);
                        }
                    }
                }
            } catch (opsErr) {
                console.log('[OCR] Operator list extraction failed:', opsErr);
            }
        }

        await worker.terminate();
        return ocrTexts.join('\n');

    } catch (error) {
        console.error('[OCR] extractTextWithOCR failed:', error);
        return '';
    }
}

// ─── Document Verifier ──────────────────────────────────────

export class DocumentVerifier {
    /**
     * Level 1: Validate file basics (exists, size, is valid PDF)
     */
    static async validateFile(filePath: string): Promise<FileValidationResult> {
        // File disimpan di Repositori Lab (dengan cadangan lokal bila Repositori sedang tidak terjangkau).
        const buffer = await repoRead(filePath);
        if (!buffer) {
            return { valid: false, reason: 'File tidak ditemukan' };
        }

        // Check minimum size
        if (buffer.length < MIN_FILE_SIZE) {
            return { valid: false, reason: 'File terlalu kecil (minimal 5KB)' };
        }

        // Check PDF magic bytes
        const header = buffer.subarray(0, 5);
        if (!header.equals(PDF_MAGIC_BYTES)) {
            return { valid: false, reason: 'File bukan PDF yang valid' };
        }

        // Try parsing PDF to check page count
        // Some scanned PDFs fail with pdf-parse, so we try pdfjs-dist as fallback
        let pdfValid = false;
        try {
            const pdf = await pdfParse(buffer);
            if (pdf.numpages && pdf.numpages >= 1) {
                pdfValid = true;
            }
        } catch {
            // pdf-parse failed — try pdfjs-dist as fallback
        }

        if (!pdfValid) {
            try {
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
                const pdfData = new Uint8Array(buffer);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                if (pdf.numPages >= 1) {
                    pdfValid = true;
                }
            } catch {
                // Both parsers failed
            }
        }

        if (!pdfValid) {
            return { valid: false, reason: 'PDF tidak dapat dibaca / rusak' };
        }

        return { valid: true };
    }

    /**
     * Level 2 & 3: Extract text from PDF (with OCR fallback) and check for required keywords
     */
    static async verifyDocument(
        filePath: string,
        type: DocumentType
    ): Promise<VerificationResult> {
        const buffer = await repoRead(filePath);
        if (!buffer) throw new Error('File tidak ditemukan');

        // ─── Step 1: Try pdf-parse text extraction ───
        let text = '';
        let extractionMethod: 'text' | 'ocr' | 'hybrid' = 'text';
        let ocrUsed = false;

        try {
            const pdf = await pdfParse(buffer);
            text = pdf.text || '';
        } catch {
            // pdf-parse failed entirely
            text = '';
        }

        // ─── Step 2: If text is too short, try OCR fallback ───
        const pdfParseText = text.trim();

        if (pdfParseText.length < MIN_TEXT_LENGTH) {
            console.log(`[DocumentVerifier] pdf-parse returned only ${pdfParseText.length} chars. Attempting OCR...`);
            try {
                const ocrText = await extractTextWithOCR(buffer);
                ocrUsed = true;

                if (ocrText.trim().length > 0) {
                    if (pdfParseText.length > 0) {
                        // Some text from pdf-parse + some from OCR = hybrid
                        text = pdfParseText + '\n' + ocrText;
                        extractionMethod = 'hybrid';
                    } else {
                        text = ocrText;
                        extractionMethod = 'ocr';
                    }
                    console.log(`[DocumentVerifier] OCR extracted ${ocrText.trim().length} chars. Method: ${extractionMethod}`);
                } else {
                    console.log('[DocumentVerifier] OCR returned empty text as well.');
                    // text remains whatever pdf-parse got (possibly empty)
                    extractionMethod = 'ocr'; // Mark as OCR attempted
                }
            } catch (ocrError) {
                console.error('[DocumentVerifier] OCR fallback failed:', ocrError);
                ocrUsed = true; // OCR was attempted but failed
                extractionMethod = 'ocr';
            }
        }

        // ─── Step 3: If still no text at all, return failed ───
        if (text.trim().length === 0) {
            return {
                valid: false,
                score: 0,
                matchedKeywords: [],
                missingKeywords: ['(tidak dapat membaca konten PDF — perlu validasi manual)'],
                extractionMethod,
                ocrUsed,
            };
        }

        // ─── Step 4: Keyword matching ───
        const textLower = text.toLowerCase();
        const matched: string[] = [];
        const missing: string[] = [];

        // Check shared keywords
        for (const keyword of SHARED_KEYWORDS) {
            if (textLower.includes(keyword.toLowerCase())) {
                matched.push(keyword);
            } else {
                missing.push(keyword);
            }
        }

        // Check type-specific keywords (each group = any one matches)
        const typeKeywordGroups = TYPE_KEYWORDS[type];
        for (const group of typeKeywordGroups) {
            const groupLabel = group.join('/');
            const found = group.some(kw => textLower.includes(kw.toLowerCase()));
            if (found) {
                matched.push(groupLabel);
            } else {
                missing.push(groupLabel);
            }
        }

        const total = matched.length + missing.length;
        const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;
        const valid = score >= VALIDITY_THRESHOLD * 100;

        return { valid, score, matchedKeywords: matched, missingKeywords: missing, extractionMethod, ocrUsed };
    }

    /**
     * Full verification pipeline: file validation + keyword matching (with OCR fallback)
     */
    static async verify(
        filePath: string,
        type: DocumentType
    ): Promise<{ fileValid: boolean; verification: VerificationResult | null; reason?: string }> {
        // Level 1: File validation
        const fileResult = await this.validateFile(filePath);
        if (!fileResult.valid) {
            return {
                fileValid: false,
                verification: null,
                reason: fileResult.reason,
            };
        }

        // Level 2 & 3: Text extraction (with OCR fallback) + keyword matching
        const verification = await this.verifyDocument(filePath, type);

        return {
            fileValid: true,
            verification,
        };
    }
}
