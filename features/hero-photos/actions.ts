'use server';

import { HeroPhotoService } from './service';
import { revalidatePath } from 'next/cache';
import { saveFile, deleteFile } from '@/lib/upload';
import { requirePermission } from '@/lib/auth';
import { auditAction } from '@/lib/audit';

export async function getHeroPhotos() {
    return HeroPhotoService.getAll();
}

export async function addHeroPhoto(formData: FormData) {
    return auditAction({
        module: 'hero_photos',
        action: 'create',
        entityType: 'hero_photo',
        description: 'Admin menambah foto hero',
        metadata: formData,
    }, async () => {
        await requirePermission('hero.manage');
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const link = formData.get('link') as string;
        const focalX = parseInt(formData.get('focalX') as string) || 50;
        const focalY = parseInt(formData.get('focalY') as string) || 50;
        const file = formData.get('file') as File;

        if (!file || file.size === 0) {
            throw new Error('Image file is required');
        }

        const imageUrl = await saveFile(file);

        await HeroPhotoService.create({
            title,
            description,
            imageUrl,
            focalX,
            focalY,
            link: link || null,
        });

        revalidatePath('/');
        revalidatePath('/admin/hero-photos');
    });
}

export async function updateHeroPhoto(id: number, formData: FormData) {
    return auditAction({
        module: 'hero_photos',
        action: 'update',
        entityType: 'hero_photo',
        entityId: id,
        description: 'Admin memperbarui foto hero',
        metadata: formData,
    }, async () => {
        await requirePermission('hero.manage');
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const link = formData.get('link') as string;

        // Parse focal points - if empty, do not override
        const focalXStr = formData.get('focalX');
        const focalYStr = formData.get('focalY');
        const focalX = focalXStr ? parseInt(focalXStr as string) : undefined;
        const focalY = focalYStr ? parseInt(focalYStr as string) : undefined;

        const file = formData.get('file') as File;

        let imageUrl: string | undefined;

        if (file && file.size > 0) {
            // Get old photo to delete
            const oldPhoto = await HeroPhotoService.getById(id);

            if (oldPhoto?.imageUrl) {
                await deleteFile(oldPhoto.imageUrl);
            }

            imageUrl = await saveFile(file);
        }

        await HeroPhotoService.update(id, {
            title,
            description,
            imageUrl,
            focalX,
            focalY,
            link: link || null,
        });

        revalidatePath('/');
        revalidatePath('/admin/hero-photos');
    });
}

export async function deleteHeroPhoto(id: number) {
    return auditAction({
        module: 'hero_photos',
        action: 'delete',
        entityType: 'hero_photo',
        entityId: id,
        description: 'Admin menghapus foto hero',
    }, async () => {
        await requirePermission('hero.manage');
        const photo = await HeroPhotoService.getById(id);

        if (photo?.imageUrl) {
            await deleteFile(photo.imageUrl);
        }

        await HeroPhotoService.delete(id);
        revalidatePath('/');
        revalidatePath('/admin/hero-photos');
    });
}
