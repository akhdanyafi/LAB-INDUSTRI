'use server';

import { PracticumService } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { deleteFile } from '@/lib/upload';
import type { CreateModuleInput, UpdateModuleInput } from './types';
import { auditAction } from '@/lib/audit';

/**
 * Get all practicum modules
 */
export async function getModules() {
    return PracticumService.getAll();
}

/**
 * Get modules for courses taught by a specific lecturer
 */
export async function getModulesByLecturerId(lecturerId: string) {
    return PracticumService.getByLecturerId(lecturerId);
}

/**
 * Get module by ID
 */
export async function getModuleById(id: number) {
    return PracticumService.getById(id);
}

/**
 * Search modules
 */
export async function searchModules(query: string) {
    return PracticumService.search(query);
}

/**
 * Get modules by course
 */
export async function getModulesByCourse(courseId: number) {
    return PracticumService.getByCourseId(courseId);
}

/**
 * Create new module
 */
export async function createModule(data: CreateModuleInput) {
    return auditAction({
        module: 'practicum',
        action: 'create_module',
        entityType: 'practicum_module',
        description: 'Admin membuat modul praktikum',
        metadata: data,
    }, async () => {
        await requirePermission('practicum.manage');
        await PracticumService.create(data);
        revalidatePath('/admin/practicum');
        revalidatePath('/lecturer/practicum');
        revalidatePath('/student/practicum');
    });
}

/**
 * Update module
 */
export async function updateModule(id: number, data: UpdateModuleInput) {
    return auditAction({
        module: 'practicum',
        action: 'update_module',
        entityType: 'practicum_module',
        entityId: id,
        description: 'Admin memperbarui modul praktikum',
        metadata: data,
    }, async () => {
        await requirePermission('practicum.manage');

        // Delete old file if a new filePath is provided
        if (data.filePath) {
            const oldModule = await PracticumService.getById(id);
            if (oldModule?.filePath && oldModule.filePath !== data.filePath) {
                await deleteFile(oldModule.filePath);
            }
        }

        await PracticumService.update(id, data);
        revalidatePath('/admin/practicum');
        revalidatePath('/lecturer/practicum');
        revalidatePath('/student/practicum');
    });
}

/**
 * Delete module
 */
export async function deleteModule(id: number) {
    return auditAction({
        module: 'practicum',
        action: 'delete_module',
        entityType: 'practicum_module',
        entityId: id,
        description: 'Admin menghapus modul praktikum',
    }, async () => {
        await requirePermission('practicum.manage');

        // Delete file from disk before DB delete
        const mod = await PracticumService.getById(id);
        if (mod?.filePath) {
            await deleteFile(mod.filePath);
        }

        await PracticumService.delete(id);
        revalidatePath('/admin/practicum');
        revalidatePath('/lecturer/practicum');
        revalidatePath('/student/practicum');
    });
}
