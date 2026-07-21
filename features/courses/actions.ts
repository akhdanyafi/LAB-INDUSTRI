'use server';

import { CourseService } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import type { CreateCourseInput, UpdateCourseInput } from './types';
import { auditAction } from '@/lib/audit';

/**
 * Get all courses
 */
export async function getCourses() {
    return CourseService.getAll();
}

/**
 * Get courses for a specific lecturer
 */
export async function getCoursesByLecturerId(lecturerId: string) {
    return CourseService.getByLecturerId(lecturerId);
}

/**
 * Get course by ID
 */
export async function getCourseById(id: number) {
    return CourseService.getById(id);
}

/**
 * Search courses
 */
export async function searchCourses(query: string) {
    return CourseService.search(query);
}

/**
 * Get all semesters
 */
export async function getAllSemesters() {
    return CourseService.getAllSemesters();
}

/**
 * Create new course (Admin / Kepala Lab only)
 */
export async function createCourse(data: CreateCourseInput) {
    try {
        await auditAction({
            module: 'courses',
            action: 'create',
            entityType: 'course',
            description: 'Admin membuat mata kuliah',
            metadata: data,
        }, async () => {
            await requirePermission('courses.manage');
            await CourseService.create(data);
            revalidatePath('/admin/courses');
            revalidatePath('/lecturer/courses');
        });
        return { success: true as const };
    } catch (error) {
        // Lempar sebagai data (bukan throw) agar pesan error spesifik tidak
        // disensor Next.js saat melewati batas Server Action -> Client.
        return { error: error instanceof Error ? error.message : 'Gagal menambah mata kuliah' };
    }
}

/**
 * Update course (Admin / Kepala Lab only)
 */
export async function updateCourse(id: number, data: UpdateCourseInput) {
    try {
        await auditAction({
            module: 'courses',
            action: 'update',
            entityType: 'course',
            entityId: id,
            description: 'Admin memperbarui mata kuliah',
            metadata: data,
        }, async () => {
            await requirePermission('courses.manage');
            await CourseService.update(id, data);
            revalidatePath('/admin/courses');
            revalidatePath('/lecturer/courses');
        });
        return { success: true as const };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Gagal memperbarui mata kuliah' };
    }
}

/**
 * Assign lecturer to course (Admin / Kepala Lab only)
 */
export async function assignLecturerToCourse(courseId: number, lecturerId: string | null) {
    return auditAction({
        module: 'courses',
        action: 'assign_lecturer',
        entityType: 'course',
        entityId: courseId,
        description: 'Admin mengubah dosen pengampu mata kuliah',
        metadata: { courseId, lecturerId },
    }, async () => {
        await requirePermission('courses.manage');
        await CourseService.assignLecturer(courseId, lecturerId);
        revalidatePath('/admin/courses');
        revalidatePath('/lecturer/courses');
    });
}

/**
 * Delete course (Admin / Kepala Lab only)
 */
export async function deleteCourse(id: number) {
    try {
        await auditAction({
            module: 'courses',
            action: 'delete',
            entityType: 'course',
            entityId: id,
            description: 'Admin menghapus mata kuliah',
        }, async () => {
            await requirePermission('courses.manage');
            await CourseService.delete(id);
            revalidatePath('/admin/courses');
            revalidatePath('/lecturer/courses');
        });
        return { success: true as const };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Gagal menghapus mata kuliah' };
    }
}
