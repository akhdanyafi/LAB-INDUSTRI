'use server';

import { db } from '@/db';
import { governanceDocs, users } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { requirePermission } from '@/lib/auth';
import { deleteFile } from '@/lib/upload';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function getGovernanceDocs(type: string) {
    const docs = await db
        .select({
            id: governanceDocs.id,
            title: governanceDocs.title,
            filePath: governanceDocs.filePath,
            coverPath: governanceDocs.coverPath,
            type: governanceDocs.type,
            createdAt: governanceDocs.createdAt,
            uploaderName: users.fullName,
        })
        .from(governanceDocs)
        .leftJoin(users, eq(governanceDocs.adminId, users.identifier))
        .where(eq(governanceDocs.type, type as any))
        .orderBy(desc(governanceDocs.createdAt));

    return docs;
}

export async function getAllGovernanceDocsForDownload() {
    return await db
        .select({
            id: governanceDocs.id,
            title: governanceDocs.title,
            filePath: governanceDocs.filePath,
            coverPath: governanceDocs.coverPath,
            type: governanceDocs.type,
            createdAt: governanceDocs.createdAt,
            uploaderName: users.fullName,
        })
        .from(governanceDocs)
        .leftJoin(users, eq(governanceDocs.adminId, users.identifier))
        .where(inArray(governanceDocs.type, ['SOP', 'LPJ Bulanan', 'Template Surat', 'Template Berita Acara']))
        .orderBy(desc(governanceDocs.createdAt));
}

export async function uploadGovernanceDoc(formData: FormData) {
    try {
        await requirePermission('governance.manage');
        const file = formData.get('file') as File;
        const coverFile = formData.get('cover') as File | null;
        const title = formData.get('title') as string;
        const type = formData.get('type') as 'SOP' | 'LPJ Bulanan' | 'Template Surat' | 'Template Berita Acara';
        const adminId = formData.get('adminId') as string;

        if (!file || file.size === 0) {
            return { success: false, error: 'Tidak ada file yang diunggah' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: 'Ukuran file dokumen maksimal 2MB' };
        }

        if (coverFile && coverFile.size > MAX_FILE_SIZE) {
            return { success: false, error: 'Ukuran file cover maksimal 2MB' };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'governance');
        await mkdir(uploadDir, { recursive: true });

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Handle Cover Image
        let coverPath = null;
        if (coverFile && coverFile.size > 0) {
            const coverBytes = await coverFile.arrayBuffer();
            const coverBuffer = Buffer.from(coverBytes);
            const coverFilename = `cover-${uniqueSuffix}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const coverFilePath = join(uploadDir, coverFilename);
            await writeFile(coverFilePath, coverBuffer);
            coverPath = `/uploads/governance/${coverFilename}`;
        }

        await db.insert(governanceDocs).values({
            adminId,
            title,
            filePath: `/uploads/governance/${filename}`,
            coverPath,
            type,
        });

        revalidatePath('/admin/governance');
        revalidatePath('/student/manage/governance');
        revalidatePath('/lecturer/manage/governance');
        revalidatePath('/');
        await writeActivityLog({ module: 'governance', action: 'upload_document', entityType: 'governance_doc', description: 'Admin mengunggah dokumen tata kelola', metadata: { title, type, adminId, fileName: file.name, coverName: coverFile?.name } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'governance', action: 'upload_document', entityType: 'governance_doc', status: 'failed', description: 'Gagal mengunggah dokumen tata kelola', metadata: { formData, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal mengupload dokumen tata kelola' };
    }
}

export async function updateGovernanceDoc(id: number, formData: FormData) {
    try {
        await requirePermission('governance.manage');
        const file = formData.get('file') as File | null;
        const coverFile = formData.get('cover') as File | null;
        const title = formData.get('title') as string;
        const type = formData.get('type') as 'SOP' | 'LPJ Bulanan' | 'Template Surat' | 'Template Berita Acara' | 'Video Profil';

        // Fetch old record to delete old files when replaced
        const oldDoc = await db.select().from(governanceDocs).where(eq(governanceDocs.id, id)).limit(1);

        const updateData: any = {
            title,
            type,
        };

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'governance');
        await mkdir(uploadDir, { recursive: true });
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;

        if (file && file.size > 0) {
            if (file.size > MAX_FILE_SIZE) {
                return { success: false, error: 'Ukuran file dokumen maksimal 2MB' };
            }
            // Delete old file from disk
            if (oldDoc[0]?.filePath) {
                await deleteFile(oldDoc[0].filePath);
            }
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filePath = join(uploadDir, filename);
            await writeFile(filePath, buffer);
            updateData.filePath = `/uploads/governance/${filename}`;
        }

        if (coverFile && coverFile.size > 0) {
            if (coverFile.size > MAX_FILE_SIZE) {
                return { success: false, error: 'Ukuran file cover maksimal 2MB' };
            }
            // Delete old cover from disk
            if (oldDoc[0]?.coverPath) {
                await deleteFile(oldDoc[0].coverPath);
            }
            const coverBytes = await coverFile.arrayBuffer();
            const coverBuffer = Buffer.from(coverBytes);
            const coverFilename = `cover-${uniqueSuffix}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const coverFilePath = join(uploadDir, coverFilename);
            await writeFile(coverFilePath, coverBuffer);
            updateData.coverPath = `/uploads/governance/${coverFilename}`;
        }

        await db.update(governanceDocs)
            .set(updateData)
            .where(eq(governanceDocs.id, id));

        revalidatePath('/admin/governance');
        revalidatePath('/student/manage/governance');
        revalidatePath('/lecturer/manage/governance');
        revalidatePath('/');
        await writeActivityLog({ module: 'governance', action: 'update_document', entityType: 'governance_doc', entityId: id, description: 'Admin memperbarui dokumen tata kelola', metadata: { id, title, type, fileName: file?.name, coverName: coverFile?.name } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'governance', action: 'update_document', entityType: 'governance_doc', entityId: id, status: 'failed', description: 'Gagal memperbarui dokumen tata kelola', metadata: { formData, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal memperbarui dokumen tata kelola' };
    }
}

export async function deleteGovernanceDoc(id: number) {
    try {
        await requirePermission('governance.manage');

        // Fetch record to get file paths before deleting
        const doc = await db.select().from(governanceDocs).where(eq(governanceDocs.id, id)).limit(1);
        if (doc[0]?.filePath) {
            await deleteFile(doc[0].filePath);
        }
        if (doc[0]?.coverPath) {
            await deleteFile(doc[0].coverPath);
        }

        await db.delete(governanceDocs).where(eq(governanceDocs.id, id));
        revalidatePath('/admin/governance');
        revalidatePath('/student/manage/governance');
        revalidatePath('/lecturer/manage/governance');
        revalidatePath('/');
        await writeActivityLog({ module: 'governance', action: 'delete_document', entityType: 'governance_doc', entityId: id, description: 'Admin menghapus dokumen tata kelola', metadata: { doc: doc[0] } });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'governance', action: 'delete_document', entityType: 'governance_doc', entityId: id, status: 'failed', description: 'Gagal menghapus dokumen tata kelola', metadata: { error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menghapus dokumen' };
    }
}
