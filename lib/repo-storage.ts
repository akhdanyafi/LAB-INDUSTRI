import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import path from 'path';

/**
 * Penyimpanan file web lab ada di Repositori Lab (repository.fstuai.id), bukan di disk web ini.
 * Path file ("governance/123-x.pdf") dan semua data di database tetap sama; hanya isinya yang
 * disimpan/diambil lewat API internal Repositori.
 *
 * Bila Repositori tidak bisa dihubungi, unggahan disimpan sementara di public/uploads agar
 * pengguna tidak gagal, dan tetap bisa dibaca; menjalankan `npx tsx scripts/import-from-labs.ts --apply --delete-local` (di folder Repository-Lab) memindahkannya ke Repositori.
 */

const BASE = (process.env.REPO_URL || 'http://127.0.0.1:3004').replace(/\/$/, '');
const SECRET = process.env.REPO_INGEST_SECRET || '';
const DEFAULT_LAB = process.env.REPO_LAB_CODE || 'IF';
const LOCAL_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), 'public', 'uploads');

export interface RepoMeta {
    /** Role di web lab: Admin, Dosen, Mahasiswa, Asisten Praktikum, ... */
    role?: string;
    uploaderName?: string;
    uploaderId?: string;
    note?: string;
    /** Paksa folder tujuan di Repositori ("A/B"). */
    dir?: string;
}

/** Ambil identitas pengunggah dari session web lab (tanpa mengandalkan bentuk session tertentu). */
export function metaFromSession(session: any, extra: Partial<RepoMeta> = {}): RepoMeta {
    const u = session?.user;
    return {
        role: u?.role,
        uploaderName: u?.fullName,
        uploaderId: u?.identifier,
        ...extra,
    };
}

/** Normalisasi "/api/file/x/y", "/uploads/x/y", "x/y" → "x/y". */
export function relPath(input: string) {
    return input.replace(/^\/+/, '').replace(/^api\/file\//, '').replace(/^uploads\//, '');
}

/** Berkas privat (tanda tangan, nilai, jawaban evaluasi) tidak boleh pernah berada di folder publik. */
export function isPrivate(rel: string) {
    return relPath(rel).startsWith('private/');
}

function localFile(rel: string) {
    const root = isPrivate(rel) ? path.join(/* turbopackIgnore: true */ process.cwd(), 'storage') : LOCAL_ROOT;
    const abs = path.join(root, rel);
    if (!abs.startsWith(root + path.sep)) throw new Error('INVALID_PATH');
    return abs;
}

function url(rel: string, lab: string, extra = '') {
    return `${BASE}/api/ingest/file?lab=${encodeURIComponent(lab)}&path=${encodeURIComponent(rel)}${extra}`;
}

function auth(extra: Record<string, string> = {}) {
    return { 'x-ingest-secret': SECRET, ...extra };
}

export class RepoRejectedError extends Error {}

/**
 * Simpan file. Mengembalikan 'repo' bila masuk Repositori, 'local' bila terpaksa disimpan lokal
 * (Repositori sedang tidak bisa dihubungi). Penolakan "sungguhan" (kuota penuh, file tidak valid)
 * dilempar sebagai RepoRejectedError agar tampil ke pengguna.
 */
export async function repoSave(
    input: string,
    data: Buffer | Uint8Array,
    opts: { lab?: string; mime?: string; meta?: RepoMeta } = {},
): Promise<'repo' | 'local'> {
    const rel = relPath(input);
    const lab = opts.lab ?? DEFAULT_LAB;
    try {
        const res = await fetch(url(rel, lab, '&source=weblab'), {
            method: 'PUT',
            headers: auth({
                'content-type': opts.mime || 'application/octet-stream',
                'x-meta': encodeURIComponent(JSON.stringify(opts.meta ?? {})),
            }),
            body: new Uint8Array(data),
            signal: AbortSignal.timeout(120_000),
        });
        if (res.ok) return 'repo';
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
            const body = await res.json().catch(() => ({}));
            throw new RepoRejectedError((body as { error?: string }).error || 'Penyimpanan menolak file ini.');
        }
        console.error('[repo-storage] Repositori membalas', res.status, '— memakai penyimpanan lokal sementara');
    } catch (err) {
        if (err instanceof RepoRejectedError) throw err;
        console.error('[repo-storage] Repositori tidak terjangkau — memakai penyimpanan lokal sementara:', (err as Error).message);
    }
    const abs = localFile(rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    return 'local';
}

/** Seperti repoSave, tetapi mengalirkan dari file di disk (untuk video/berkas besar). */
export async function repoSaveFromFile(
    input: string,
    absPath: string,
    opts: { lab?: string; mime?: string; meta?: RepoMeta } = {},
): Promise<'repo' | 'local'> {
    const rel = relPath(input);
    const lab = opts.lab ?? DEFAULT_LAB;
    const { size } = await fs.stat(absPath);
    try {
        const res = await fetch(url(rel, lab, '&source=weblab'), {
            method: 'PUT',
            headers: auth({
                'content-type': opts.mime || 'application/octet-stream',
                'content-length': String(size),
                'x-meta': encodeURIComponent(JSON.stringify(opts.meta ?? {})),
            }),
            body: Readable.toWeb(createReadStream(absPath)) as unknown as BodyInit,
            // @ts-expect-error — properti khusus Node (undici) untuk body stream
            duplex: 'half',
            signal: AbortSignal.timeout(600_000),
        });
        if (res.ok) return 'repo';
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
            const body = await res.json().catch(() => ({}));
            throw new RepoRejectedError((body as { error?: string }).error || 'Penyimpanan menolak file ini.');
        }
        console.error('[repo-storage] Repositori membalas', res.status, '— memakai penyimpanan lokal sementara');
    } catch (err) {
        if (err instanceof RepoRejectedError) throw err;
        console.error('[repo-storage] Repositori tidak terjangkau — memakai penyimpanan lokal sementara:', (err as Error).message);
    }
    const abs = localFile(rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.copyFile(absPath, abs);
    return 'local';
}

/** Buka file untuk disajikan (mendukung Range). null bila tidak ada di Repositori. */
export async function repoOpen(input: string, opts: { lab?: string; range?: string | null; head?: boolean } = {}): Promise<Response | null> {
    const rel = relPath(input);
    try {
        const res = await fetch(url(rel, opts.lab ?? DEFAULT_LAB), {
            method: opts.head ? 'HEAD' : 'GET',
            headers: auth(opts.range ? { range: opts.range } : {}),
            signal: AbortSignal.timeout(30_000),
        });
        if (res.status === 404) return null;
        if (!res.ok && res.status !== 206) return null;
        return res;
    } catch {
        return null;
    }
}

/** Baca seluruh isi file (untuk pemrosesan di server, mis. verifikasi dokumen). null bila tidak ada. */
export async function repoRead(input: string, opts: { lab?: string } = {}): Promise<Buffer | null> {
    const rel = relPath(input);
    const res = await repoOpen(rel, opts);
    if (res) return Buffer.from(await res.arrayBuffer());
    try {
        return await fs.readFile(localFile(rel));
    } catch {
        return null;
    }
}

/** Hapus file di Repositori (dan sisa salinan lokal, bila ada). Tidak melempar error. */
export async function repoRemove(input: string, opts: { lab?: string } = {}) {
    const rel = relPath(input);
    try {
        await fetch(url(rel, opts.lab ?? DEFAULT_LAB), { method: 'DELETE', headers: auth(), signal: AbortSignal.timeout(30_000) });
    } catch (err) {
        console.error('[repo-storage] gagal menghapus di Repositori:', (err as Error).message);
    }
    await fs.rm(localFile(rel), { force: true }).catch(() => undefined);
}

export const CONTENT_TYPES: Record<string, string> = {
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
};

export function contentTypeFor(rel: string) {
    return CONTENT_TYPES[path.extname(rel).toLowerCase()] ?? 'application/octet-stream';
}

/** Apakah file ada (di Repositori atau, bila belum dipindah, di disk lokal). */
export async function repoExists(input: string, opts: { lab?: string } = {}): Promise<boolean> {
    const rel = relPath(input);
    if (await repoOpen(rel, { ...opts, head: true })) return true;
    try {
        return (await fs.stat(localFile(rel))).isFile();
    } catch {
        return false;
    }
}
