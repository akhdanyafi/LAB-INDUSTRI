/**
 * Practicum Report (Berita Acara) Service
 */

import { db } from '@/db';
import { practicumReports, users, scheduledPracticums, courses } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { CreatePracticumReportInput, VerifyPracticumReportInput } from './types';

export class PracticumReportService {
    /**
     * Get all practicum reports with creator & verifier details (for admin/lecturer)
     */
    static async getAllWithDetails() {
        const results = await db.execute(sql`
            SELECT
                pr.id,
                pr.scheduled_practicum_id as scheduledPracticumId,
                pr.created_by as createdBy,
                pr.course_name as courseName,
                pr.course_code as courseCode,
                pr.lecturer_name as lecturerName,
                pr.room_name as roomName,
                pr.practicum_date as practicumDate,
                pr.start_time as startTime,
                pr.end_time as endTime,
                pr.batch,
                pr.attendee_count as attendeeCount,
                pr.condition as \`condition\`,
                pr.description,
                pr.issues,
                pr.follow_up as followUp,
                pr.report_status as status,
                pr.verified_by as verifiedBy,
                pr.verified_at as verifiedAt,
                pr.rejection_reason as rejectionReason,
                pr.created_at as createdAt,
                pr.updated_at as updatedAt,
                u1.full_name as createdByName,
                u2.full_name as verifiedByName
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            ORDER BY pr.created_at DESC
        `);

        return (results as unknown as any[][])[0] as any[];
    }

    /**
     * Get practicum reports for a specific lecturer's courses
     */
    static async getByLecturerId(lecturerId: string) {
        const results = await db.execute(sql`
            SELECT
                pr.id,
                pr.scheduled_practicum_id as scheduledPracticumId,
                pr.created_by as createdBy,
                pr.course_name as courseName,
                pr.course_code as courseCode,
                pr.lecturer_name as lecturerName,
                pr.room_name as roomName,
                pr.practicum_date as practicumDate,
                pr.start_time as startTime,
                pr.end_time as endTime,
                pr.batch,
                pr.attendee_count as attendeeCount,
                pr.condition as \`condition\`,
                pr.description,
                pr.issues,
                pr.follow_up as followUp,
                pr.report_status as status,
                pr.verified_by as verifiedBy,
                pr.verified_at as verifiedAt,
                pr.rejection_reason as rejectionReason,
                pr.created_at as createdAt,
                pr.updated_at as updatedAt,
                u1.full_name as createdByName,
                u2.full_name as verifiedByName
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            LEFT JOIN scheduled_practicums sp ON pr.scheduled_practicum_id = sp.id
            LEFT JOIN courses c ON sp.course_id = c.id
            WHERE c.lecturer_id = ${lecturerId}
            ORDER BY pr.created_at DESC
        `);

        return (results as unknown as any[][])[0] as any[];
    }

    /**
     * Get practicum reports created by a specific user
     */
    static async getByUser(userIdentifier: string) {
        return await db
            .select({
                id: practicumReports.id,
                scheduledPracticumId: practicumReports.scheduledPracticumId,
                createdBy: practicumReports.createdBy,
                courseName: practicumReports.courseName,
                courseCode: practicumReports.courseCode,
                lecturerName: practicumReports.lecturerName,
                roomName: practicumReports.roomName,
                practicumDate: practicumReports.practicumDate,
                startTime: practicumReports.startTime,
                endTime: practicumReports.endTime,
                batch: practicumReports.batch,
                attendeeCount: practicumReports.attendeeCount,
                condition: practicumReports.condition,
                description: practicumReports.description,
                issues: practicumReports.issues,
                followUp: practicumReports.followUp,
                status: practicumReports.status,
                verifiedBy: practicumReports.verifiedBy,
                verifiedAt: practicumReports.verifiedAt,
                rejectionReason: practicumReports.rejectionReason,
                createdAt: practicumReports.createdAt,
                updatedAt: practicumReports.updatedAt,
            })
            .from(practicumReports)
            .where(eq(practicumReports.createdBy, userIdentifier))
            .orderBy(desc(practicumReports.createdAt));
    }

    /**
     * Get practicum report by ID with details
     */
    static async getById(id: number) {
        const results = await db.execute(sql`
            SELECT
                pr.id,
                pr.scheduled_practicum_id as scheduledPracticumId,
                pr.created_by as createdBy,
                pr.course_name as courseName,
                pr.course_code as courseCode,
                pr.lecturer_name as lecturerName,
                pr.room_name as roomName,
                pr.practicum_date as practicumDate,
                pr.start_time as startTime,
                pr.end_time as endTime,
                pr.batch,
                pr.attendee_count as attendeeCount,
                pr.condition as \`condition\`,
                pr.description,
                pr.issues,
                pr.follow_up as followUp,
                pr.report_status as status,
                pr.verified_by as verifiedBy,
                pr.verified_at as verifiedAt,
                pr.rejection_reason as rejectionReason,
                pr.created_at as createdAt,
                pr.updated_at as updatedAt,
                u1.full_name as createdByName,
                u2.full_name as verifiedByName
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            WHERE pr.id = ${id}
            LIMIT 1
        `);

        const rows = (results as unknown as any[][])[0] as any[];
        return rows[0] || null;
    }

    /**
     * Get practicum report by ID with full details for PDF generation:
     * includes module title and lecturer identifier (NIDN-equivalent) via
     * joins to scheduled_practicums -> practicum_modules / courses -> users.
     * Kept separate from getById() so existing callers of getById() are unaffected.
     */
    static async getByIdWithDetails(id: number) {
        const results = await db.execute(sql`
            SELECT
                pr.id,
                pr.scheduled_practicum_id as scheduledPracticumId,
                pr.created_by as createdBy,
                pr.course_name as courseName,
                pr.course_code as courseCode,
                pr.lecturer_name as lecturerName,
                pr.room_name as roomName,
                pr.practicum_date as practicumDate,
                pr.start_time as startTime,
                pr.end_time as endTime,
                pr.batch,
                pr.attendee_count as attendeeCount,
                pr.condition as \`condition\`,
                pr.description,
                pr.issues,
                pr.follow_up as followUp,
                pr.report_status as status,
                pr.verified_by as verifiedBy,
                pr.verified_at as verifiedAt,
                pr.rejection_reason as rejectionReason,
                pr.created_at as createdAt,
                pr.updated_at as updatedAt,
                u1.full_name as createdByName,
                u2.full_name as verifiedByName,
                pm.name as moduleName,
                ulecturer.identifier as lecturerId
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            LEFT JOIN scheduled_practicums sp ON pr.scheduled_practicum_id = sp.id
            LEFT JOIN practicum_modules pm ON sp.module_id = pm.id
            LEFT JOIN courses c ON sp.course_id = c.id
            LEFT JOIN users ulecturer ON c.lecturer_id = ulecturer.identifier
            WHERE pr.id = ${id}
            LIMIT 1
        `);

        const rows = (results as unknown as any[][])[0] as any[];
        return rows[0] || null;
    }

    /**
     * Check if a report already exists for a scheduled practicum by a user
     */
    static async existsForUserAndSchedule(userIdentifier: string, scheduledPracticumId: number): Promise<boolean> {
        const results = await db
            .select({ id: practicumReports.id })
            .from(practicumReports)
            .where(and(
                eq(practicumReports.createdBy, userIdentifier),
                eq(practicumReports.scheduledPracticumId, scheduledPracticumId)
            ))
            .limit(1);

        return results.length > 0;
    }

    /**
     * Get set of scheduledPracticumIds that a user has already reported
     */
    static async getReportedScheduleIds(userIdentifier: string): Promise<Set<number>> {
        const results = await db
            .select({ scheduledPracticumId: practicumReports.scheduledPracticumId })
            .from(practicumReports)
            .where(eq(practicumReports.createdBy, userIdentifier));

        return new Set(results.map(r => r.scheduledPracticumId));
    }

    /**
     * Get the lecturer name for a scheduled practicum (from courses → users)
     */
    static async getLecturerName(scheduledPracticumId: number): Promise<string | null> {
        const results = await db.execute(sql`
            SELECT u.full_name
            FROM scheduled_practicums sp
            LEFT JOIN courses c ON sp.course_id = c.id
            LEFT JOIN users u ON c.lecturer_id = u.identifier
            WHERE sp.id = ${scheduledPracticumId}
            LIMIT 1
        `);
        const rows = (results as unknown as any[][])[0] as any[];
        return rows[0]?.full_name || null;
    }

    /**
     * Create a new practicum report
     */
    static async create(data: CreatePracticumReportInput, createdBy: string) {
        const exists = await this.existsForUserAndSchedule(createdBy, data.scheduledPracticumId);
        if (exists) {
            throw new Error('Anda sudah mengisi berita acara untuk jadwal praktikum ini');
        }

        await db.insert(practicumReports).values({
            scheduledPracticumId: data.scheduledPracticumId,
            createdBy,
            courseName: data.courseName,
            courseCode: data.courseCode,
            lecturerName: data.lecturerName,
            roomName: data.roomName,
            practicumDate: data.practicumDate,
            startTime: data.startTime,
            endTime: data.endTime,
            batch: data.batch,
            attendeeCount: data.attendeeCount,
            condition: data.condition,
            description: data.description,
            issues: data.issues || null,
            followUp: data.followUp || null,
            status: 'Pending',
        });
    }

    /**
     * Verify (approve/reject) a practicum report
     */
    static async verify(id: number, data: VerifyPracticumReportInput, verifiedBy: string) {
        await db.update(practicumReports)
            .set({
                status: data.status,
                verifiedBy,
                verifiedAt: new Date(),
                rejectionReason: data.rejectionReason || null,
                updatedAt: new Date(),
            })
            .where(eq(practicumReports.id, id));
    }

    /**
     * Check if a report belongs to a lecturer's courses
     */
    static async belongsToLecturer(reportId: number, lecturerId: string): Promise<boolean> {
        const results = await db.execute(sql`
            SELECT pr.id
            FROM practicum_reports pr
            LEFT JOIN scheduled_practicums sp ON pr.scheduled_practicum_id = sp.id
            LEFT JOIN courses c ON sp.course_id = c.id
            WHERE pr.id = ${reportId} AND c.lecturer_id = ${lecturerId}
            LIMIT 1
        `);
        const rows = (results as unknown as any[][])[0] as any[];
        return rows.length > 0;
    }

    /**
     * Delete a practicum report by ID
     */
    static async delete(id: number) {
        await db.delete(practicumReports).where(eq(practicumReports.id, id));
    }

    /**
     * Delete all practicum reports
     */
    static async deleteAll() {
        await db.delete(practicumReports);
    }
}
