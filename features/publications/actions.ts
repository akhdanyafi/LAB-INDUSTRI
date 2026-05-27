'use server';

import { PublicationService, PublicationFilters } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireAnyPermission } from '@/lib/auth';
import { deleteFile } from '@/lib/upload';
import { auditAction, writeActivityLog } from '@/lib/audit';

// Admin/Dosen creates and publishes directly
export async function createPublication(data: {
    uploaderId: string;
    authorName: string;
    title: string;
    abstract?: string;
    keywords?: string;
    link?: string;
    filePath?: string;
    publishYear?: number;
    publishMonth?: number;
    publishDay?: number;
}) {
    return auditAction({
        module: 'publications',
        action: 'create',
        entityType: 'publication',
        description: 'User membuat publikasi',
        metadata: data,
    }, async () => {
        await requireAnyPermission(['publications.manage', 'dashboard.lecturer']);
        await PublicationService.create(data);
        revalidatePath('/publications');
        revalidatePath('/admin/publications');
        revalidatePath('/lecturer/publications');
    });
}

// Admin/Dosen updates a publication
export async function updatePublication(id: number, data: {
    title?: string;
    authorName?: string;
    abstract?: string;
    keywords?: string;
    link?: string;
    filePath?: string;
    publishYear?: number;
    publishMonth?: number | null;
    publishDay?: number | null;
}) {
    return auditAction({
        module: 'publications',
        action: 'update',
        entityType: 'publication',
        entityId: id,
        description: 'User memperbarui publikasi',
        metadata: data,
    }, async () => {
        await requireAnyPermission(['publications.manage', 'dashboard.lecturer']);

        // Delete old file if a new filePath is provided
        if (data.filePath) {
            const oldPub = await PublicationService.getById(id);
            if (oldPub?.filePath && oldPub.filePath !== data.filePath) {
                await deleteFile(oldPub.filePath);
            }
        }

        await PublicationService.update(id, data);
        revalidatePath('/publications');
        revalidatePath('/admin/publications');
        revalidatePath('/lecturer/publications');
    });
}

// Get publications for public view (with pagination)
export async function getPublicPublications(filters?: PublicationFilters) {
    return PublicationService.getPublished(filters);
}

// Get all publications for admin/dosen (with pagination)
export async function getPublications(filters?: PublicationFilters) {
    return PublicationService.getAll(filters);
}

// Get single publication
export async function getPublication(id: number) {
    return PublicationService.getById(id);
}

// Get all unique keywords
export async function getPublicationKeywords() {
    return PublicationService.getAllKeywords();
}

// Get all unique years
export async function getPublicationYears() {
    return PublicationService.getAllYears();
}

export async function deletePublication(id: number) {
    return auditAction({
        module: 'publications',
        action: 'delete',
        entityType: 'publication',
        entityId: id,
        description: 'User menghapus publikasi',
    }, async () => {
        await requireAnyPermission(['publications.manage', 'dashboard.lecturer']);

        // Delete file from disk before DB delete
        const pub = await PublicationService.getById(id);
        if (pub?.filePath) {
            await deleteFile(pub.filePath);
        }

        await PublicationService.delete(id);
        revalidatePath('/publications');
        revalidatePath('/admin/publications');
        revalidatePath('/lecturer/publications');
        revalidatePath('/'); // Invalidate homepage "Top Publications" cache
    });
}

export async function incrementViewCount(id: number) {
    await PublicationService.incrementViewCount(id);
    revalidatePath('/publications');
    revalidatePath('/');
    await writeActivityLog({
        module: 'publications',
        action: 'view',
        entityType: 'publication',
        entityId: id,
        description: 'Publikasi dilihat',
    });
}

export async function getTopPublications(limit: number = 5) {
    return PublicationService.getTop(limit);
}

// Like functionality
export async function togglePublicationLike(publicationId: number, userId: string) {
    return auditAction({
        module: 'publications',
        action: 'toggle_like',
        entityType: 'publication',
        entityId: publicationId,
        description: 'User mengubah like publikasi',
        metadata: { publicationId, userId },
        actor: { identifier: userId },
    }, async () => {
        const result = await PublicationService.toggleLike(publicationId, userId);
        revalidatePath('/publications');
        revalidatePath('/');
        return result;
    });
}

export async function getPublicationLikeCount(publicationId: number) {
    return PublicationService.getLikeCount(publicationId);
}

export async function checkUserLikedPublication(publicationId: number, userId: string) {
    return PublicationService.checkUserLiked(publicationId, userId);
}

export async function getPublicationLikeCounts(publicationIds: number[]) {
    return PublicationService.getLikeCounts(publicationIds);
}

export async function getUserLikedPublicationIds(userId: string, publicationIds: number[]) {
    return PublicationService.getUserLikedIds(userId, publicationIds);
}
