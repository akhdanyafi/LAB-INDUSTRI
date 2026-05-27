import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { DocumentVerifier, type DocumentType } from '@/lib/documentVerifier';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Folders that require PDF-only uploads
const PDF_ONLY_FOLDERS = ['surat-izin', 'surat-permohonan'];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'general';

        // Check query params for verification
        const verify = request.nextUrl.searchParams.get('verify') === 'true';
        const docType = request.nextUrl.searchParams.get('type') as DocumentType | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 });
        }

        // For surat folders, enforce PDF-only
        if (PDF_ONLY_FOLDERS.includes(folder)) {
            if (file.type !== 'application/pdf') {
                return NextResponse.json(
                    { error: 'Surat harus dalam format PDF.' },
                    { status: 400 }
                );
            }
        } else {
            // General folders: allow PDF and images
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({ error: 'Invalid file type. Only PDF and images allowed.' }, { status: 400 });
            }
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${originalName}`;
        const filepath = path.join(uploadDir, filename);

        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return dynamic URL path
        const publicPath = `/api/file/${folder}/${filename}`;

        // Run document verification if requested
        if (verify && docType) {
            try {
                const result = await DocumentVerifier.verify(publicPath, docType);

                if (!result.fileValid) {
                    // File saved but not a valid document
                    await writeActivityLog({
                        module: 'uploads',
                        action: 'upload_file',
                        entityType: 'file',
                        entityId: publicPath,
                        description: 'User mengunggah file dengan hasil verifikasi dokumen tidak valid',
                        metadata: { folder, filename, fileType: file.type, fileSize: file.size, verify, docType, verification: result },
                    });
                    return NextResponse.json({
                        success: true,
                        path: publicPath,
                        filename,
                        verification: {
                            valid: false,
                            score: 0,
                            matchedKeywords: [],
                            missingKeywords: [],
                            reason: result.reason,
                            ocrUsed: false,
                            extractionMethod: 'text',
                        },
                    });
                }

                await writeActivityLog({
                    module: 'uploads',
                    action: 'upload_file',
                    entityType: 'file',
                    entityId: publicPath,
                    description: 'User mengunggah file',
                    metadata: { folder, filename, fileType: file.type, fileSize: file.size, verify, docType, verification: result.verification },
                });
                return NextResponse.json({
                    success: true,
                    path: publicPath,
                    filename,
                    verification: result.verification,
                });
            } catch (verifyError) {
                console.error('Verification error:', verifyError);
                // File saved, but verification failed — return without verification data
                await writeActivityLog({
                    module: 'uploads',
                    action: 'upload_file',
                    entityType: 'file',
                    entityId: publicPath,
                    description: 'User mengunggah file, tetapi proses verifikasi gagal',
                    metadata: { folder, filename, fileType: file.type, fileSize: file.size, verify, docType, error: getErrorMessage(verifyError) },
                });
                return NextResponse.json({
                    success: true,
                    path: publicPath,
                    filename,
                    verification: null,
                });
            }
        }

        await writeActivityLog({
            module: 'uploads',
            action: 'upload_file',
            entityType: 'file',
            entityId: publicPath,
            description: 'User mengunggah file',
            metadata: { folder, filename, fileType: file.type, fileSize: file.size },
        });
        return NextResponse.json({
            success: true,
            path: publicPath,
            filename,
        });

    } catch (error) {
        console.error('Upload error:', error);
        await writeActivityLog({
            module: 'uploads',
            action: 'upload_file',
            entityType: 'file',
            status: 'failed',
            description: 'Gagal mengunggah file',
            metadata: { error: getErrorMessage(error) },
        });
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
