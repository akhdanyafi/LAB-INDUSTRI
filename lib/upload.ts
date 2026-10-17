import { getSession } from '@/lib/auth';
import { metaFromSession, repoRemove, repoSave, type RepoMeta } from '@/lib/repo-storage';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Simpan file ke Repositori Lab. Mengembalikan URL dinamis "/api/file/<nama>" yang disimpan di database.
 * `folder` (opsional) menentukan awalan path; `meta.dir` memaksa folder tujuan di Repositori.
 */
export async function saveFile(file: File, opts: { folder?: string; meta?: RepoMeta } = {}): Promise<string> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Ukuran file maksimal 2MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const folder = (opts.folder ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
    const rel = folder ? `${folder}/${filename}` : filename;

    const session = await getSession().catch(() => null);
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
        await repoSave(rel, buffer, { mime: file.type || undefined, meta: { ...metaFromSession(session), ...opts.meta } });
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Gagal menyimpan file');
    }

    // Return dynamic API URL path instead of static /uploads pattern
    return `/api/file/${rel}`;
}

export async function deleteFile(filePath: string): Promise<void> {
    try {
        // filePath bisa berbentuk "/api/file/governance/file.pdf", "/uploads/governance/file.pdf", atau "/api/file/file.pdf"
        await repoRemove(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
        // Don't throw - file might already be deleted
    }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.includes(type));
}
