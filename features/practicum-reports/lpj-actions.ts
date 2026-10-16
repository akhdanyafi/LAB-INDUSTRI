'use server';

import { metaFromSession, repoRemove, repoSave } from '@/lib/repo-storage';
import { db } from '@/db';
import { practicumLpjDocs } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { requireAnyPermission, getSession } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function getPracticumLpjDocs(scheduledPracticumId?: number) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const conditions = [];
    if (scheduledPracticumId) {
        conditions.push(eq(practicumLpjDocs.scheduledPracticumId, scheduledPracticumId));
    }

    return db
        .select({
            id: practicumLpjDocs.id,
            scheduledPracticumId: practicumLpjDocs.scheduledPracticumId,
            title: practicumLpjDocs.title,
            description: practicumLpjDocs.description,
            filePath: practicumLpjDocs.filePath,
            periodMonth: practicumLpjDocs.periodMonth,
            periodYear: practicumLpjDocs.periodYear,
            createdAt: practicumLpjDocs.createdAt,
            uploaderName: users.fullName,
            uploaderId: practicumLpjDocs.uploaderId,
        })
        .from(practicumLpjDocs)
        .leftJoin(users, eq(practicumLpjDocs.uploaderId, users.identifier))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(practicumLpjDocs.createdAt));
}

export async function uploadPracticumLpjDoc(formData: FormData) {
    try {
        const session = await requireAnyPermission(['practicum.manage', 'practicum.assist']);

        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const scheduledPracticumId = parseInt(formData.get('scheduledPracticumId') as string);
        const periodMonth = parseInt(formData.get('periodMonth') as string);
        const periodYear = parseInt(formData.get('periodYear') as string);

        if (!file || file.size === 0) return { success: false, error: 'Tidak ada file yang dipilih' };
        if (file.size > MAX_FILE_SIZE) return { success: false, error: 'Ukuran file maksimal 10MB' };
        if (!title?.trim()) return { success: false, error: 'Judul wajib diisi' };
        if (!scheduledPracticumId || !periodMonth || !periodYear) return { success: false, error: 'Data tidak lengkap' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const safeFilename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        await repoSave(`practicum-lpj/${safeFilename}`, buffer, { mime: file.type || undefined, meta: metaFromSession(session, { note: title.trim() }) });

        await db.insert(practicumLpjDocs).values({
            scheduledPracticumId,
            uploaderId: session.user.identifier,
            title: title.trim(),
            description: description?.trim() || null,
            filePath: `/uploads/practicum-lpj/${safeFilename}`,
            periodMonth,
            periodYear,
        });

        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/manage/scheduled-practicum');
        revalidatePath('/student/manage/scheduled-practicum');

        await writeActivityLog({ module: 'practicum_lpj', action: 'upload', entityType: 'practicum_lpj_doc', description: 'User mengunggah LPJ praktikum', metadata: { title, scheduledPracticumId, periodMonth, periodYear, fileName: file.name, fileSize: file.size } });
        return { success: true };
    } catch (error: any) {
        console.error('Error uploading LPJ:', error);
        await writeActivityLog({ module: 'practicum_lpj', action: 'upload', entityType: 'practicum_lpj_doc', status: 'failed', description: 'Gagal mengunggah LPJ praktikum', metadata: { formData, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal mengunggah LPJ' };
    }
}

export async function deletePracticumLpjDoc(id: number) {
    try {
        const session = await requireAnyPermission(['practicum.manage', 'practicum.assist']);

        const [doc] = await db
            .select({ uploaderId: practicumLpjDocs.uploaderId })
            .from(practicumLpjDocs)
            .where(eq(practicumLpjDocs.id, id));

        if (!doc) return { success: false, error: 'Dokumen tidak ditemukan' };

        const isAdmin = session.user.roleId === 1;
        const isOwner = doc.uploaderId === session.user.identifier;
        if (!isAdmin && !isOwner) return { success: false, error: 'Anda tidak berhak menghapus dokumen ini' };

        await db.delete(practicumLpjDocs).where(eq(practicumLpjDocs.id, id));

        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/manage/scheduled-practicum');
        revalidatePath('/student/manage/scheduled-practicum');

        await writeActivityLog({ module: 'practicum_lpj', action: 'delete', entityType: 'practicum_lpj_doc', entityId: id, description: 'User menghapus LPJ praktikum', metadata: { id, uploaderId: doc.uploaderId, isAdmin, isOwner } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'practicum_lpj', action: 'delete', entityType: 'practicum_lpj_doc', entityId: id, status: 'failed', description: 'Gagal menghapus LPJ praktikum', metadata: { error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menghapus LPJ' };
    }
}
