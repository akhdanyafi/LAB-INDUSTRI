/**
 * Practicum Report (Berita Acara) Service
 */

import { db } from '@/db';
import { practicumReports, users, roles, scheduledPracticums, practicumModules } from '@/db/schema';
import { eq, desc, and, or, ne, sql, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import type {
    AsprakPartnerOption, CreatePracticumReportInput, ReportModuleOptions, UpdatePracticumReportInput, VerifyPracticumReportInput,
} from './types';

export const ASPRAK_ROLE_NAME = 'Asisten Praktikum';

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
                pr.partner_id as partnerId,
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
                up.full_name as partnerName,
                u2.full_name as verifiedByName,
                (pr.assistant_signature IS NOT NULL) as hasSignature,
                COALESCE(pr.module_title, spm.name) as moduleTitle
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users up ON pr.partner_id = up.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            LEFT JOIN scheduled_practicums ssp ON pr.scheduled_practicum_id = ssp.id
            LEFT JOIN practicum_modules spm ON ssp.module_id = spm.id
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
                pr.partner_id as partnerId,
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
                up.full_name as partnerName,
                u2.full_name as verifiedByName,
                (pr.assistant_signature IS NOT NULL) as hasSignature,
                COALESCE(pr.module_title, spm.name) as moduleTitle
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users up ON pr.partner_id = up.identifier
            LEFT JOIN users u2 ON pr.verified_by = u2.identifier
            LEFT JOIN scheduled_practicums sp ON pr.scheduled_practicum_id = sp.id
            LEFT JOIN practicum_modules spm ON sp.module_id = spm.id
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
        const creator = alias(users, 'creator');
        const partner = alias(users, 'partner');
        return await db
            .select({
                id: practicumReports.id,
                scheduledPracticumId: practicumReports.scheduledPracticumId,
                createdBy: practicumReports.createdBy,
                partnerId: practicumReports.partnerId,
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
                createdByName: creator.fullName,
                partnerName: partner.fullName,
                moduleId: practicumReports.moduleId,
                moduleTitle: practicumReports.moduleTitle,
                hasSignature: sql<number>`(${practicumReports.assistantSignature} IS NOT NULL)`,
            })
            .from(practicumReports)
            .leftJoin(creator, eq(practicumReports.createdBy, creator.identifier))
            .leftJoin(partner, eq(practicumReports.partnerId, partner.identifier))
            .where(or(
                eq(practicumReports.createdBy, userIdentifier),
                eq(practicumReports.partnerId, userIdentifier)
            ))
            .orderBy(desc(practicumReports.createdAt))
            .then((rows) => rows.map((r) => ({ ...r, hasSignature: Number(r.hasSignature) === 1, canSign: r.createdBy === userIdentifier })));
    }

    /** Data tanda tangan untuk halaman approval: TTD asprak pengisi + nama dosen pengampu MK (dari jadwal). */
    static async getReviewSignatures(id: number) {
        const results = await db.execute(sql`
            SELECT pr.created_by AS createdBy, pr.partner_id AS partnerId, pr.assistant_signature AS signature,
                   u1.full_name AS createdByName, c.lecturer_id AS lecturerId, ul.full_name AS lecturerName,
                   pr.lecturer_name AS lecturerSnapshot
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN scheduled_practicums sp ON pr.scheduled_practicum_id = sp.id
            LEFT JOIN courses c ON sp.course_id = c.id
            LEFT JOIN users ul ON c.lecturer_id = ul.identifier
            WHERE pr.id = ${id}
            LIMIT 1
        `);
        const rows = (results as unknown as Record<string, unknown>[][])[0];
        return (rows[0] as {
            createdBy: string; partnerId: string | null; signature: string | null; createdByName: string | null;
            lecturerId: string | null; lecturerName: string | null; lecturerSnapshot: string | null;
        } | undefined) ?? null;
    }

    /** Tanda tangan asprak pengisi (data URL) beserta pemilik berita acara. */
    static async getSignature(id: number): Promise<{ createdBy: string; signature: string | null } | null> {
        const [row] = await db
            .select({ createdBy: practicumReports.createdBy, signature: practicumReports.assistantSignature })
            .from(practicumReports)
            .where(eq(practicumReports.id, id))
            .limit(1);
        return row ?? null;
    }

    /** Sisipkan / ganti / hapus tanda tangan tanpa mengubah status verifikasi. */
    static async setSignature(id: number, signature: string | null) {
        await db.update(practicumReports).set({ assistantSignature: signature }).where(eq(practicumReports.id, id));
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
                pr.partner_id as partnerId,
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
                up.full_name as partnerName,
                u2.full_name as verifiedByName
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users up ON pr.partner_id = up.identifier
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
                pr.partner_id as partnerId,
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
                pr.assistant_signature as assistantSignature,
                u1.full_name as createdByName,
                up.full_name as partnerName,
                u2.full_name as verifiedByName,
                COALESCE(pr.module_title, pm.name) as moduleName,
                pr.module_id as moduleId,
                ulecturer.identifier as lecturerId
            FROM practicum_reports pr
            LEFT JOIN users u1 ON pr.created_by = u1.identifier
            LEFT JOIN users up ON pr.partner_id = up.identifier
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
     * (sebagai pembuat maupun sebagai partner asprak)
     */
    static async existsForUserAndSchedule(userIdentifier: string, scheduledPracticumId: number): Promise<boolean> {
        const results = await db
            .select({ id: practicumReports.id })
            .from(practicumReports)
            .where(and(
                or(
                    eq(practicumReports.createdBy, userIdentifier),
                    eq(practicumReports.partnerId, userIdentifier)
                ),
                eq(practicumReports.scheduledPracticumId, scheduledPracticumId)
            ))
            .limit(1);

        return results.length > 0;
    }

    /**
     * Get set of scheduledPracticumIds that a user has already reported
     * (sebagai pembuat maupun sebagai partner asprak)
     */
    static async getReportedScheduleIds(userIdentifier: string): Promise<Set<number>> {
        const results = await db
            .select({ scheduledPracticumId: practicumReports.scheduledPracticumId })
            .from(practicumReports)
            .where(or(
                eq(practicumReports.createdBy, userIdentifier),
                eq(practicumReports.partnerId, userIdentifier)
            ));

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

        const partnerId = data.partnerId || null;
        if (partnerId) {
            if (partnerId === createdBy) {
                throw new Error('Partner asprak tidak boleh diri sendiri');
            }
            if (!(await this.isActiveAsprak(partnerId))) {
                throw new Error('Partner harus mahasiswa dengan role Asisten Praktikum');
            }
            if (await this.existsForUserAndSchedule(partnerId, data.scheduledPracticumId)) {
                throw new Error('Partner yang dipilih sudah tercatat di berita acara lain untuk jadwal ini');
            }
        }

        const chosenModule = await this.resolveModule(data.scheduledPracticumId, data.moduleId ?? null, data.moduleTitle ?? null);

        await db.insert(practicumReports).values({
            scheduledPracticumId: data.scheduledPracticumId,
            moduleId: chosenModule.moduleId,
            moduleTitle: chosenModule.moduleTitle,
            createdBy,
            partnerId,
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
            assistantSignature: data.assistantSignature || null,
            status: 'Pending',
        });
    }

    /** Modul milik MK pada jadwal praktikum (pilihan "modul yang digunakan"). */
    static async getModuleOptions(scheduledPracticumId: number): Promise<ReportModuleOptions> {
        const [schedule] = await db
            .select({ courseId: scheduledPracticums.courseId, moduleId: scheduledPracticums.moduleId })
            .from(scheduledPracticums)
            .where(eq(scheduledPracticums.id, scheduledPracticumId))
            .limit(1);
        if (!schedule) return { options: [], defaultModuleId: null };
        const options = await db
            .select({ id: practicumModules.id, name: practicumModules.name })
            .from(practicumModules)
            .where(eq(practicumModules.courseId, schedule.courseId))
            .orderBy(asc(practicumModules.name));
        return { options, defaultModuleId: schedule.moduleId ?? null };
    }

    /** Validasi modul: harus milik MK jadwal tersebut, atau judul ditulis sendiri. */
    private static async resolveModule(scheduledPracticumId: number, moduleId: number | null, moduleTitle: string | null) {
        if (moduleId) {
            const { options } = await this.getModuleOptions(scheduledPracticumId);
            const found = options.find((o) => o.id === moduleId);
            if (!found) throw new Error('Modul yang dipilih bukan modul mata kuliah ini');
            return { moduleId, moduleTitle: found.name };
        }
        if (!moduleTitle?.trim()) throw new Error('Modul yang digunakan harus dipilih atau ditulis');
        return { moduleId: null, moduleTitle: moduleTitle.trim() };
    }

    /**
     * Edit berita acara oleh asprak pengisi, selama belum disetujui.
     * Berita acara yang Ditolak lalu diedit diajukan ulang (status kembali Pending).
     */
    static async update(id: number, data: UpdatePracticumReportInput, userIdentifier: string) {
        const [report] = await db
            .select({
                createdBy: practicumReports.createdBy,
                status: practicumReports.status,
                scheduledPracticumId: practicumReports.scheduledPracticumId,
                partnerId: practicumReports.partnerId,
            })
            .from(practicumReports)
            .where(eq(practicumReports.id, id))
            .limit(1);
        if (!report) throw new Error('Berita acara tidak ditemukan');
        if (report.createdBy !== userIdentifier) throw new Error('Hanya asprak pengisi berita acara yang dapat mengeditnya');
        if (report.status === 'Diverifikasi') throw new Error('Berita acara yang sudah disetujui tidak dapat diedit');

        const partnerId = data.partnerId || null;
        if (partnerId && partnerId !== report.partnerId) {
            if (partnerId === userIdentifier) throw new Error('Partner asprak tidak boleh diri sendiri');
            if (!(await this.isActiveAsprak(partnerId))) throw new Error('Partner harus mahasiswa dengan role Asisten Praktikum');
            if (await this.existsForUserAndSchedule(partnerId, report.scheduledPracticumId)) {
                throw new Error('Partner yang dipilih sudah tercatat di berita acara lain untuk jadwal ini');
            }
        }
        const chosenModule = await this.resolveModule(report.scheduledPracticumId, data.moduleId ?? null, data.moduleTitle ?? null);

        await db.update(practicumReports).set({
            batch: data.batch,
            attendeeCount: data.attendeeCount,
            condition: data.condition,
            description: data.description,
            issues: data.issues || null,
            followUp: data.followUp || null,
            partnerId,
            moduleId: chosenModule.moduleId,
            moduleTitle: chosenModule.moduleTitle,
            updatedAt: new Date(),
            ...(report.status === 'Ditolak'
                ? { status: 'Pending' as const, rejectionReason: null, verifiedBy: null, verifiedAt: null }
                : {}),
        }).where(eq(practicumReports.id, id));
        return { resubmitted: report.status === 'Ditolak' };
    }

    /**
     * Daftar mahasiswa ber-role Asisten Praktikum (aktif) yang bisa dipilih sebagai partner
     */
    static async getAsprakPartnerOptions(excludeIdentifier: string): Promise<AsprakPartnerOption[]> {
        return await db
            .select({ identifier: users.identifier, fullName: users.fullName })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(and(
                eq(roles.name, ASPRAK_ROLE_NAME),
                eq(users.status, 'Active'),
                ne(users.identifier, excludeIdentifier)
            ))
            .orderBy(asc(users.fullName));
    }

    /**
     * Cek apakah user adalah Asisten Praktikum yang aktif
     */
    static async isActiveAsprak(identifier: string): Promise<boolean> {
        const rows = await db
            .select({ identifier: users.identifier })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(and(
                eq(users.identifier, identifier),
                eq(roles.name, ASPRAK_ROLE_NAME),
                eq(users.status, 'Active')
            ))
            .limit(1);
        return rows.length > 0;
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
