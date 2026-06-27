/**
 * Course Service
 * Business logic for courses (mata kuliah) management
 */

import { db } from '@/db';
import { courses, users } from '@/db/schema';
import { eq, desc, like, or } from 'drizzle-orm';
import type { CreateCourseInput, UpdateCourseInput } from './types';

export class CourseService {
    /**
     * Get all courses with lecturer info
     */
    static async getAll() {
        const results = await db
            .select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                description: courses.description,
                sks: courses.sks,
                semester: courses.semester,
                lecturerId: courses.lecturerId,
                createdAt: courses.createdAt,
                lecturerName: users.fullName,
            })
            .from(courses)
            .leftJoin(users, eq(courses.lecturerId, users.identifier))
            .orderBy(desc(courses.createdAt));

        return results;
    }

    /**
     * Get all courses for a specific lecturer
     */
    static async getByLecturerId(lecturerId: string) {
        const results = await db
            .select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                description: courses.description,
                sks: courses.sks,
                semester: courses.semester,
                lecturerId: courses.lecturerId,
                createdAt: courses.createdAt,
                lecturerName: users.fullName,
            })
            .from(courses)
            .leftJoin(users, eq(courses.lecturerId, users.identifier))
            .where(eq(courses.lecturerId, lecturerId))
            .orderBy(desc(courses.createdAt));

        return results;
    }

    /**
     * Get course by ID with lecturer info
     */
    static async getById(id: number) {
        const results = await db
            .select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                description: courses.description,
                sks: courses.sks,
                semester: courses.semester,
                lecturerId: courses.lecturerId,
                createdAt: courses.createdAt,
                lecturerName: users.fullName,
            })
            .from(courses)
            .leftJoin(users, eq(courses.lecturerId, users.identifier))
            .where(eq(courses.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Search courses by code or name
     */
    static async search(query: string) {
        const searchTerm = `%${query}%`;
        return await db
            .select({
                id: courses.id,
                code: courses.code,
                name: courses.name,
                description: courses.description,
                sks: courses.sks,
                semester: courses.semester,
                lecturerId: courses.lecturerId,
                createdAt: courses.createdAt,
                lecturerName: users.fullName,
            })
            .from(courses)
            .leftJoin(users, eq(courses.lecturerId, users.identifier))
            .where(
                or(
                    like(courses.code, searchTerm),
                    like(courses.name, searchTerm)
                )
            )
            .orderBy(courses.name);
    }

    /**
     * Create a new course
     */
    static async create(data: CreateCourseInput) {
        try {
            await db.insert(courses).values({
                code: data.code,
                name: data.name,
                description: data.description || null,
                sks: data.sks || 3,
                semester: data.semester || null,
                lecturerId: data.lecturerId || null,
            });
        } catch (error: any) {
            if (error?.cause?.code === 'ER_DUP_ENTRY' || error?.code === 'ER_DUP_ENTRY') {
                throw new Error(`Kode mata kuliah "${data.code}" sudah digunakan. Gunakan kode lain.`);
            }
            throw error;
        }
    }

    /**
     * Update a course
     */
    static async update(id: number, data: UpdateCourseInput) {
        const updateData: Record<string, any> = {};

        if (data.code !== undefined) updateData.code = data.code;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.sks !== undefined) updateData.sks = data.sks;
        if (data.semester !== undefined) updateData.semester = data.semester;
        if (data.lecturerId !== undefined) updateData.lecturerId = data.lecturerId;

        try {
            await db.update(courses).set(updateData).where(eq(courses.id, id));
        } catch (error: any) {
            if (error?.cause?.code === 'ER_DUP_ENTRY' || error?.code === 'ER_DUP_ENTRY') {
                throw new Error(`Kode mata kuliah "${data.code}" sudah digunakan. Gunakan kode lain.`);
            }
            throw error;
        }
    }

    /**
     * Assign lecturer to course (can be updated anytime by Kepala Lab / Admin)
     */
    static async assignLecturer(courseId: number, lecturerId: string | null) {
        await db.update(courses)
            .set({ lecturerId })
            .where(eq(courses.id, courseId));
    }

    /**
     * Delete a course
     */
    static async delete(id: number) {
        await db.delete(courses).where(eq(courses.id, id));
    }

    /**
     * Get all unique semesters from courses
     */
    static async getAllSemesters(): Promise<("Ganjil" | "Genap")[]> {
        const results = await db
            .select({ semester: courses.semester })
            .from(courses)
            .groupBy(courses.semester);

        return results
            .map(r => r.semester)
            .filter((s): s is "Ganjil" | "Genap" => s === "Ganjil" || s === "Genap")
            .sort();
    }
}
