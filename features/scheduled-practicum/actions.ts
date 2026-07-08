'use server';

import { ScheduledPracticumService } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission, getSession } from '@/lib/auth';
import { createScheduledPracticumSchema, updateScheduledPracticumSchema } from './validator';
import type { CreateScheduledPracticumInput, UpdateScheduledPracticumInput } from './types';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

/**
 * Get all scheduled practicums
 */
export async function getScheduledPracticums() {
    return ScheduledPracticumService.getAll();
}

/**
 * Get scheduled practicums for a specific lecturer's courses
 */
export async function getScheduledPracticumsByLecturerId(lecturerId: string) {
    return ScheduledPracticumService.getByLecturerId(lecturerId);
}

/**
 * Get scheduled practicum by ID
 */
export async function getScheduledPracticumById(id: number) {
    return ScheduledPracticumService.getById(id);
}

/**
 * Get scheduled practicums by room
 */
export async function getScheduledPracticumsByRoom(roomId: number) {
    return ScheduledPracticumService.getByRoom(roomId);
}

/**
 * Create new scheduled practicum
 */
export async function createScheduledPracticum(data: CreateScheduledPracticumInput) {
    try {
        const session = await requirePermission('practicum.manage');
        const validated = createScheduledPracticumSchema.parse(data);

        await ScheduledPracticumService.create(validated as CreateScheduledPracticumInput, session.user.identifier);
        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/scheduled-practicum');
        revalidatePath('/student/scheduled-practicum');
        revalidatePath('/student/rooms');
        await writeActivityLog({ module: 'scheduled_practicum', action: 'create', entityType: 'scheduled_practicum', description: 'Admin membuat jadwal praktikum', metadata: validated });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'scheduled_practicum', action: 'create', entityType: 'scheduled_practicum', status: 'failed', description: 'Gagal membuat jadwal praktikum', metadata: { data, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal membuat jadwal praktikum' };
    }
}

/**
 * Update scheduled practicum
 */
export async function updateScheduledPracticum(id: number, data: UpdateScheduledPracticumInput) {
    try {
        await requirePermission('practicum.manage');
        const validated = updateScheduledPracticumSchema.parse(data);

        await ScheduledPracticumService.update(id, validated as UpdateScheduledPracticumInput);
        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/scheduled-practicum');
        revalidatePath('/student/scheduled-practicum');
        revalidatePath('/student/rooms');
        await writeActivityLog({ module: 'scheduled_practicum', action: 'update', entityType: 'scheduled_practicum', entityId: id, description: 'Admin memperbarui jadwal praktikum', metadata: validated });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'scheduled_practicum', action: 'update', entityType: 'scheduled_practicum', entityId: id, status: 'failed', description: 'Gagal memperbarui jadwal praktikum', metadata: { data, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal memperbarui jadwal praktikum' };
    }
}

/**
 * Delete scheduled practicum
 */
export async function deleteScheduledPracticum(id: number) {
    try {
        await requirePermission('practicum.manage');
        await ScheduledPracticumService.delete(id);
        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/scheduled-practicum');
        revalidatePath('/student/scheduled-practicum');
        revalidatePath('/student/rooms');
        await writeActivityLog({ module: 'scheduled_practicum', action: 'delete', entityType: 'scheduled_practicum', entityId: id, description: 'Admin menghapus jadwal praktikum' });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'scheduled_practicum', action: 'delete', entityType: 'scheduled_practicum', entityId: id, status: 'failed', description: 'Gagal menghapus jadwal praktikum', metadata: { error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menghapus jadwal praktikum' };
    }
}

export interface BulkCreateInput {
    courseId: number;
    roomId: number;
    moduleId?: number;
    startTime: string;
    endTime: string;
    daysOfWeek: number[]; // 0=Senin...6=Minggu
    periodStart: string;  // "YYYY-MM-DD"
    periodEnd: string;    // "YYYY-MM-DD"
}

/**
 * Bulk create scheduled practicums
 * Generates one entry per matching day in the given date range.
 * Skips dates that have conflicts without throwing.
 */
export async function bulkCreateScheduledPracticum(data: BulkCreateInput) {
    try {
        const session = await requirePermission('practicum.manage');

        if (!data.courseId || !data.roomId) return { success: false, error: 'Mata kuliah dan ruangan wajib dipilih' };
        if (!data.daysOfWeek || data.daysOfWeek.length === 0) return { success: false, error: 'Pilih minimal satu hari' };
        if (!data.periodStart || !data.periodEnd) return { success: false, error: 'Periode wajib diisi' };
        if (!/^\d{2}:\d{2}$/.test(data.startTime) || !/^\d{2}:\d{2}$/.test(data.endTime)) {
            return { success: false, error: 'Format jam tidak valid' };
        }

        const start = new Date(data.periodStart + 'T00:00:00');
        const end = new Date(data.periodEnd + 'T23:59:59');
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return { success: false, error: 'Rentang periode tidak valid' };
        }

        // Convert our dayOfWeek (0=Senin) to JS getDay() (0=Minggu)
        // Our: 0=Sen,1=Sel,2=Rab,3=Kam,4=Jum,5=Sab,6=Min
        // JS:  0=Min,1=Sen,2=Sel,3=Rab,4=Kam,5=Jum,6=Sab
        const ourToJs: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
        const targetJsDays = new Set(data.daysOfWeek.map((d) => ourToJs[d]));

        let created = 0;
        let skipped = 0;
        const errors: string[] = [];

        const cur = new Date(start);
        while (cur <= end) {
            if (targetJsDays.has(cur.getDay())) {
                try {
                    await ScheduledPracticumService.create(
                        {
                            courseId: data.courseId,
                            roomId: data.roomId,
                            moduleId: data.moduleId,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            scheduledDate: new Date(cur),
                        },
                        session.user.identifier
                    );
                    created++;
                } catch {
                    skipped++;
                }
            }
            cur.setDate(cur.getDate() + 1);
        }

        revalidatePath('/admin/scheduled-practicum');
        revalidatePath('/lecturer/scheduled-practicum');
        revalidatePath('/student/scheduled-practicum');
        revalidatePath('/student/rooms');

        await writeActivityLog({ module: 'scheduled_practicum', action: 'bulk_create', entityType: 'scheduled_practicum', description: 'Admin membuat jadwal praktikum massal', metadata: { ...data, created, skipped } });
        return { success: true, created, skipped };
    } catch (error: any) {
        await writeActivityLog({ module: 'scheduled_practicum', action: 'bulk_create', entityType: 'scheduled_practicum', status: 'failed', description: 'Gagal membuat jadwal praktikum massal', metadata: { data, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal membuat jadwal massal' };
    }
}
