/**
 * Scheduled Practicum Service
 * Business logic for scheduled practicum management
 */

import { db } from '@/db';
import { scheduledPracticums, courses, practicumModules, users, roomBookings, practicumReports, practicumLpjDocs } from '@/db/schema';
import { rooms } from '@/db/schema';
import { eq, and, desc, gte, lte, inArray, count } from 'drizzle-orm';
import type { CreateScheduledPracticumInput, UpdateScheduledPracticumInput } from './types';

/**
 * Convert JS Date.getDay() (0=Sunday) to our dayOfWeek (0=Senin...6=Minggu)
 */
function dateToDayOfWeek(date: Date): number {
    const jsDay = date.getDay(); // 0=Sunday, 1=Monday, ...
    return jsDay === 0 ? 6 : jsDay - 1; // 0=Senin, 1=Selasa, ..., 6=Minggu
}

export class ScheduledPracticumService {
    /**
     * Get all scheduled practicums with details
     */
    static async getAll() {
        return await db
            .select({
                id: scheduledPracticums.id,
                courseId: scheduledPracticums.courseId,
                roomId: scheduledPracticums.roomId,
                moduleId: scheduledPracticums.moduleId,
                createdBy: scheduledPracticums.createdBy,
                dayOfWeek: scheduledPracticums.dayOfWeek,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
                scheduledDate: scheduledPracticums.scheduledDate,
                status: scheduledPracticums.status,
                createdAt: scheduledPracticums.createdAt,
                courseName: courses.name,
                courseCode: courses.code,
                roomName: rooms.name,
                moduleName: practicumModules.name,
                createdByName: users.fullName,
            })
            .from(scheduledPracticums)
            .leftJoin(courses, eq(scheduledPracticums.courseId, courses.id))
            .leftJoin(rooms, eq(scheduledPracticums.roomId, rooms.id))
            .leftJoin(practicumModules, eq(scheduledPracticums.moduleId, practicumModules.id))
            .leftJoin(users, eq(scheduledPracticums.createdBy, users.identifier))
            .orderBy(scheduledPracticums.scheduledDate, scheduledPracticums.dayOfWeek);
    }

    /**
     * Get scheduled practicums for a specific lecturer's courses
     */
    static async getByLecturerId(lecturerId: string) {
        return await db
            .select({
                id: scheduledPracticums.id,
                courseId: scheduledPracticums.courseId,
                roomId: scheduledPracticums.roomId,
                moduleId: scheduledPracticums.moduleId,
                createdBy: scheduledPracticums.createdBy,
                dayOfWeek: scheduledPracticums.dayOfWeek,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
                scheduledDate: scheduledPracticums.scheduledDate,
                status: scheduledPracticums.status,
                createdAt: scheduledPracticums.createdAt,
                courseName: courses.name,
                courseCode: courses.code,
                roomName: rooms.name,
                moduleName: practicumModules.name,
                createdByName: users.fullName,
            })
            .from(scheduledPracticums)
            .leftJoin(courses, eq(scheduledPracticums.courseId, courses.id))
            .leftJoin(rooms, eq(scheduledPracticums.roomId, rooms.id))
            .leftJoin(practicumModules, eq(scheduledPracticums.moduleId, practicumModules.id))
            .leftJoin(users, eq(scheduledPracticums.createdBy, users.identifier))
            .where(eq(courses.lecturerId, lecturerId))
            .orderBy(scheduledPracticums.scheduledDate, scheduledPracticums.dayOfWeek);
    }

    /**
     * Get by ID with details
     */
    static async getById(id: number) {
        const results = await db
            .select({
                id: scheduledPracticums.id,
                courseId: scheduledPracticums.courseId,
                roomId: scheduledPracticums.roomId,
                moduleId: scheduledPracticums.moduleId,
                createdBy: scheduledPracticums.createdBy,
                dayOfWeek: scheduledPracticums.dayOfWeek,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
                scheduledDate: scheduledPracticums.scheduledDate,
                status: scheduledPracticums.status,
                createdAt: scheduledPracticums.createdAt,
                courseName: courses.name,
                courseCode: courses.code,
                roomName: rooms.name,
                moduleName: practicumModules.name,
                createdByName: users.fullName,
            })
            .from(scheduledPracticums)
            .leftJoin(courses, eq(scheduledPracticums.courseId, courses.id))
            .leftJoin(rooms, eq(scheduledPracticums.roomId, rooms.id))
            .leftJoin(practicumModules, eq(scheduledPracticums.moduleId, practicumModules.id))
            .leftJoin(users, eq(scheduledPracticums.createdBy, users.identifier))
            .where(eq(scheduledPracticums.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Get scheduled practicums by room (for checking booking conflicts)
     */
    static async getByRoom(roomId: number) {
        return await db
            .select({
                id: scheduledPracticums.id,
                courseId: scheduledPracticums.courseId,
                dayOfWeek: scheduledPracticums.dayOfWeek,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
                scheduledDate: scheduledPracticums.scheduledDate,
                status: scheduledPracticums.status,
                courseName: courses.name,
                courseCode: courses.code,
                moduleName: practicumModules.name,
            })
            .from(scheduledPracticums)
            .leftJoin(courses, eq(scheduledPracticums.courseId, courses.id))
            .leftJoin(practicumModules, eq(scheduledPracticums.moduleId, practicumModules.id))
            .where(and(
                eq(scheduledPracticums.roomId, roomId),
                eq(scheduledPracticums.status, 'Aktif'),
            ))
            .orderBy(scheduledPracticums.scheduledDate, scheduledPracticums.dayOfWeek);
    }

    /**
     * Check if a room has a conflict with a scheduled practicum at a given time
     */
    static async hasConflict(
        roomId: number,
        scheduledDate: Date,
        startTime: string,
        endTime: string,
        excludeId?: number
    ): Promise<boolean> {
        // 1. Check conflict with other scheduled practicums on the SAME DATE
        const startOfDay = new Date(scheduledDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(scheduledDate);
        endOfDay.setHours(23, 59, 59, 999);

        const schedules = await db
            .select({
                id: scheduledPracticums.id,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
            })
            .from(scheduledPracticums)
            .where(and(
                eq(scheduledPracticums.roomId, roomId),
                eq(scheduledPracticums.status, 'Aktif'),
                gte(scheduledPracticums.scheduledDate, startOfDay),
                lte(scheduledPracticums.scheduledDate, endOfDay),
            ));

        const practicumConflict = schedules.some(s => {
            if (excludeId && s.id === excludeId) return false;
            return startTime < s.endTime && endTime > s.startTime;
        });

        if (practicumConflict) return true;

        // 2. Check conflict with approved room bookings on that date
        const approvedBookings = await db
            .select({
                id: roomBookings.id,
                startTime: roomBookings.startTime,
                endTime: roomBookings.endTime,
            })
            .from(roomBookings)
            .where(and(
                eq(roomBookings.roomId, roomId),
                eq(roomBookings.status, 'Disetujui'),
                gte(roomBookings.startTime, startOfDay),
                lte(roomBookings.endTime, endOfDay)
            ));

        const bookingConflict = approvedBookings.some(b => {
            const bStart = `${String(new Date(b.startTime).getHours()).padStart(2, '0')}:${String(new Date(b.startTime).getMinutes()).padStart(2, '0')}`;
            const bEnd = `${String(new Date(b.endTime).getHours()).padStart(2, '0')}:${String(new Date(b.endTime).getMinutes()).padStart(2, '0')}`;
            return startTime < bEnd && endTime > bStart;
        });

        return bookingConflict;
    }

    /**
     * Create a new scheduled practicum
     * dayOfWeek is auto-computed from scheduledDate
     */
    static async create(data: CreateScheduledPracticumInput, createdBy: string) {
        // Auto-compute dayOfWeek from scheduledDate
        const dayOfWeek = dateToDayOfWeek(new Date(data.scheduledDate));

        // Check for conflicts first (practicums + approved bookings)
        const hasConflict = await this.hasConflict(
            data.roomId,
            data.scheduledDate,
            data.startTime,
            data.endTime,
        );

        if (hasConflict) {
            throw new Error('Jadwal bentrok dengan praktikum lain atau booking ruangan yang sudah disetujui pada waktu tersebut');
        }

        await db.insert(scheduledPracticums).values({
            courseId: data.courseId,
            roomId: data.roomId,
            moduleId: data.moduleId || null,
            createdBy,
            dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            scheduledDate: data.scheduledDate,
        });
    }

    /**
     * Update a scheduled practicum
     * If scheduledDate changes, dayOfWeek is auto-recomputed
     */
    static async update(id: number, data: UpdateScheduledPracticumInput) {
        const updateData: Record<string, any> = {};

        if (data.courseId !== undefined) updateData.courseId = data.courseId;
        if (data.roomId !== undefined) updateData.roomId = data.roomId;
        if (data.moduleId !== undefined) updateData.moduleId = data.moduleId;
        if (data.startTime !== undefined) updateData.startTime = data.startTime;
        if (data.endTime !== undefined) updateData.endTime = data.endTime;
        if (data.scheduledDate !== undefined) {
            updateData.scheduledDate = data.scheduledDate;
            // Auto-recompute dayOfWeek when date changes
            updateData.dayOfWeek = dateToDayOfWeek(new Date(data.scheduledDate));
        }
        if (data.status !== undefined) updateData.status = data.status;

        await db.update(scheduledPracticums).set(updateData).where(eq(scheduledPracticums.id, id));
    }

    /**
     * Delete a scheduled practicum
     */
    static async delete(id: number) {
        await db.delete(scheduledPracticums).where(eq(scheduledPracticums.id, id));
    }

    /**
     * Find schedules matching a bulk-delete filter, with the number of
     * berita acara / LPJ that would be cascade-deleted alongside them.
     */
    static async findForBulkDelete(filter: {
        courseId: number;
        roomId?: number;
        daysOfWeek: number[];
        periodStart: Date;
        periodEnd: Date;
    }) {
        const conditions = [
            eq(scheduledPracticums.courseId, filter.courseId),
            inArray(scheduledPracticums.dayOfWeek, filter.daysOfWeek),
            gte(scheduledPracticums.scheduledDate, filter.periodStart),
            lte(scheduledPracticums.scheduledDate, filter.periodEnd),
        ];
        if (filter.roomId) {
            conditions.push(eq(scheduledPracticums.roomId, filter.roomId));
        }

        const rows = await db
            .select({ id: scheduledPracticums.id })
            .from(scheduledPracticums)
            .where(and(...conditions));
        const ids = rows.map((r) => r.id);
        if (ids.length === 0) return { ids, reportCount: 0, lpjCount: 0 };

        const [[reports], [lpj]] = await Promise.all([
            db.select({ n: count() }).from(practicumReports).where(inArray(practicumReports.scheduledPracticumId, ids)),
            db.select({ n: count() }).from(practicumLpjDocs).where(inArray(practicumLpjDocs.scheduledPracticumId, ids)),
        ]);
        return { ids, reportCount: reports.n, lpjCount: lpj.n };
    }

    /**
     * Delete many schedules at once (reports/LPJ cascade via FK)
     */
    static async deleteMany(ids: number[]) {
        if (ids.length === 0) return;
        await db.delete(scheduledPracticums).where(inArray(scheduledPracticums.id, ids));
    }
}
