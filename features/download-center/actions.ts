'use server';

import { db } from '@/db';
import { governanceDocs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DOWNLOAD_CENTER_TYPE = 'Pusat Download' as const;

export async function getDownloadCenterDocs() {
    const docs = await db
        .select({
            id: governanceDocs.id,
            title: governanceDocs.title,
            filePath: governanceDocs.filePath,
            createdAt: governanceDocs.createdAt,
            uploaderName: users.fullName,
        })
        .from(governanceDocs)
        .leftJoin(users, eq(governanceDocs.adminId, users.identifier))
        .where(eq(governanceDocs.type, DOWNLOAD_CENTER_TYPE))
        .orderBy(desc(governanceDocs.createdAt));

    return docs;
}

export async function uploadDownloadCenterDoc(formData: FormData) {
    try {
        await requirePermission('download-center.manage');

        const file = formData.get('file') as File;
        const title = (formData.get('title') as string)?.trim();
        const adminId = formData.get('adminId') as string;

        if (!file || file.size === 0) {
            return { success: false, error: 'Tidak ada file yang diunggah' };
        }

        if (!title) {
            return { success: false, error: 'Judul dokumen wajib diisi' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: 'Ukuran file maksimal 10MB' };
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'download-center');
        await mkdir(uploadDir, { recursive: true });

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = join(uploadDir, filename);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        await db.insert(governanceDocs).values({
            adminId,
            title,
            filePath: `/uploads/download-center/${filename}`,
            type: DOWNLOAD_CENTER_TYPE,
            coverPath: null,
        });

        revalidatePath('/admin/download-center');
        revalidatePath('/lecturer/download-center');
        revalidatePath('/student/download-center');

        await writeActivityLog({ module: 'download_center', action: 'upload_document', entityType: 'download_center_doc', description: 'Admin mengunggah dokumen pusat download', metadata: { title, adminId, fileName: file.name, fileSize: file.size } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'download_center', action: 'upload_document', entityType: 'download_center_doc', status: 'failed', description: 'Gagal mengunggah dokumen pusat download', metadata: { formData, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal upload dokumen pusat download' };
    }
}

export async function deleteDownloadCenterDoc(id: number) {
    try {
        await requirePermission('download-center.manage');

        const existing = await db.select().from(governanceDocs).where(eq(governanceDocs.id, id)).limit(1);
        const doc = existing[0];

        if (doc?.filePath && doc.filePath.startsWith('/uploads/download-center/')) {
            const relativePath = doc.filePath.replace('/uploads/', '');
            const absolutePath = join(process.cwd(), 'public', relativePath);
            try {
                await unlink(absolutePath);
            } catch {
                // ignore if file already removed
            }
        }

        await db.delete(governanceDocs).where(eq(governanceDocs.id, id));

        revalidatePath('/admin/download-center');
        revalidatePath('/lecturer/download-center');
        revalidatePath('/student/download-center');

        await writeActivityLog({ module: 'download_center', action: 'delete_document', entityType: 'download_center_doc', entityId: id, description: 'Admin menghapus dokumen pusat download', metadata: { doc } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'download_center', action: 'delete_document', entityType: 'download_center_doc', entityId: id, status: 'failed', description: 'Gagal menghapus dokumen pusat download', metadata: { error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menghapus dokumen pusat download' };
    }
}
