'use server';

import { revalidatePath } from 'next/cache';
import { HitsService, HitsCategoryService } from './service';
import { saveFile, deleteFile } from '@/lib/upload';
import { requirePermission } from '@/lib/auth';

const HITS_PERMISSION = 'hits.manage';

function revalidateHits() {
    revalidatePath('/');
    revalidatePath('/admin/governance');
    revalidatePath('/admin/dashboard');
    revalidatePath('/student/dashboard');
    revalidatePath('/lecturer/dashboard');
    revalidatePath('/student/manage/governance');
    revalidatePath('/lecturer/manage/governance');
}

/* ---------------------------------- Read ---------------------------------- */

export async function getHitsInfos() {
    return HitsService.getAll();
}

export async function getPublishedHitsInfos(limit?: number) {
    return HitsService.getPublished(limit);
}

export async function getHitsCategories() {
    return HitsCategoryService.getAll();
}

/* --------------------------------- Mutate --------------------------------- */

function parseCategoryId(value: FormDataEntryValue | null): number | null {
    if (!value) return null;
    const parsed = parseInt(value as string, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export async function addHitsInfo(formData: FormData) {
    await requirePermission(HITS_PERMISSION);

    const title = (formData.get('title') as string)?.trim();
    const description = formData.get('description') as string;
    const link = formData.get('link') as string;
    const categoryId = parseCategoryId(formData.get('categoryId'));
    const focalX = parseInt(formData.get('focalX') as string) || 50;
    const focalY = parseInt(formData.get('focalY') as string) || 50;
    const isPublished = formData.get('isPublished') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;
    const file = formData.get('file') as File;

    if (!title) throw new Error('Judul informasi wajib diisi');
    if (!file || file.size === 0) throw new Error('Foto informasi wajib diunggah');

    const imageUrl = await saveFile(file);

    await HitsService.create({
        title,
        description: description || null,
        imageUrl,
        focalX,
        focalY,
        link: link || null,
        categoryId,
        isPublished,
        displayOrder,
    });

    revalidateHits();
}

export async function updateHitsInfo(id: number, formData: FormData) {
    await requirePermission(HITS_PERMISSION);

    const title = (formData.get('title') as string)?.trim();
    const description = formData.get('description') as string;
    const link = formData.get('link') as string;
    const categoryId = parseCategoryId(formData.get('categoryId'));
    const isPublished = formData.get('isPublished') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    const focalXStr = formData.get('focalX');
    const focalYStr = formData.get('focalY');
    const focalX = focalXStr ? parseInt(focalXStr as string) : undefined;
    const focalY = focalYStr ? parseInt(focalYStr as string) : undefined;

    if (!title) throw new Error('Judul informasi wajib diisi');

    const file = formData.get('file') as File;
    let imageUrl: string | undefined;

    if (file && file.size > 0) {
        const existing = await HitsService.getById(id);
        if (existing?.imageUrl) {
            await deleteFile(existing.imageUrl);
        }
        imageUrl = await saveFile(file);
    }

    await HitsService.update(id, {
        title,
        description: description || null,
        imageUrl,
        focalX,
        focalY,
        link: link || null,
        categoryId,
        isPublished,
        displayOrder,
    });

    revalidateHits();
}

export async function deleteHitsInfo(id: number) {
    await requirePermission(HITS_PERMISSION);

    const existing = await HitsService.getById(id);
    if (existing?.imageUrl) {
        await deleteFile(existing.imageUrl);
    }

    await HitsService.delete(id);
    revalidateHits();
}

/* -------------------------------- Kategori -------------------------------- */

export async function addHitsCategory(name: string, color: string) {
    await requirePermission(HITS_PERMISSION);

    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kategori wajib diisi');

    const duplicate = await HitsCategoryService.findByName(trimmed);
    if (duplicate) throw new Error('Kategori dengan nama tersebut sudah ada');

    await HitsCategoryService.create(trimmed, color || '#2563EB');
    revalidateHits();
}

export async function updateHitsCategory(id: number, name: string, color: string) {
    await requirePermission(HITS_PERMISSION);

    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kategori wajib diisi');

    const duplicate = await HitsCategoryService.findByName(trimmed, id);
    if (duplicate) throw new Error('Kategori dengan nama tersebut sudah ada');

    await HitsCategoryService.update(id, trimmed, color || '#2563EB');
    revalidateHits();
}

export async function deleteHitsCategory(id: number) {
    await requirePermission(HITS_PERMISSION);
    await HitsCategoryService.delete(id);
    revalidateHits();
}
