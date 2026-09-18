/**
 * Evaluation (Form Evaluasi Praktikum) Service
 * Business logic for the per-course practicum evaluation questionnaire filled by students.
 */

import { db } from '@/db';
import { evaluationQuestions, evaluationConfigs, evaluationResponses, evaluationAnalyses, courses, scheduledPracticums, users } from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { getSession, hasPermission } from '@/lib/auth';
import type {
    EvaluationAnalysis,
    EvaluationQuestionResult,
    EvaluationResults,
    ManagedCourse,
    UpsertQuestionInput,
} from './types';

export class EvaluationService {
    static isAdmin(session: any): boolean {
        return session?.user?.roleId === 1;
    }

    /**
     * Cek apakah sesi boleh mengelola evaluasi pada satu mata kuliah:
     * - Admin (roleId 1): selalu boleh
     * - Dosen pengampu MK ini, dengan permission 'evaluation.manage'
     * - Siapapun dengan permission 'practicum.manage' yang sudah pernah membuat
     *   jadwal praktikum untuk MK ini (LAB-INDUSTRI tidak punya role terpisah
     *   "Asisten Praktikum" — hak ini diberikan lewat permission override per
     *   user, biasanya ke Mahasiswa yang ditugaskan mengelola jadwal praktikum).
     */
    static async canManageCourse(session: any, courseId: number): Promise<boolean> {
        if (this.isAdmin(session)) return true;
        if (!session?.user) return false;

        // Dosen pengampu MK ini
        if (hasPermission(session, 'evaluation.manage')) {
            const lecturerRows = await db
                .select({ id: courses.id })
                .from(courses)
                .where(and(eq(courses.id, courseId), eq(courses.lecturerId, session.user.identifier)))
                .limit(1);
            if (lecturerRows.length > 0) return true;
        }

        // Pemegang permission 'practicum.manage' yang sudah pernah membuat jadwal utk MK ini
        if (hasPermission(session, 'practicum.manage')) {
            const scheduleRows = await db
                .select({ id: scheduledPracticums.id })
                .from(scheduledPracticums)
                .where(and(eq(scheduledPracticums.courseId, courseId), eq(scheduledPracticums.createdBy, session.user.identifier)))
                .limit(1);
            if (scheduleRows.length > 0) return true;
        }

        return false;
    }

    /**
     * Ambil sesi dari cookie lalu pastikan sesi tersebut berhak mengelola
     * evaluasi mata kuliah `courseId`. Melempar Error jika tidak berhak.
     */
    static async requireEvaluationAccess(courseId: number) {
        const session = await getSession();
        if (!session) {
            throw new Error('Anda harus login');
        }
        const allowed = await this.canManageCourse(session, courseId);
        if (!allowed) {
            throw new Error('Anda tidak memiliki akses untuk mengelola evaluasi mata kuliah ini');
        }
        return session;
    }

    // ============================================
    // Questions (Master)
    // ============================================

    static async getQuestions() {
        return await db
            .select()
            .from(evaluationQuestions)
            .where(eq(evaluationQuestions.isActive, true))
            .orderBy(asc(evaluationQuestions.order));
    }

    static async getAllQuestionsAdmin() {
        return await db
            .select()
            .from(evaluationQuestions)
            .orderBy(asc(evaluationQuestions.order));
    }

    static async upsertQuestion(data: UpsertQuestionInput) {
        if (data.id) {
            await db
                .update(evaluationQuestions)
                .set({
                    question: data.question,
                    type: data.type,
                    order: data.order,
                    isActive: data.isActive,
                })
                .where(eq(evaluationQuestions.id, data.id));
            return data.id;
        }

        const [result] = await db.insert(evaluationQuestions).values({
            question: data.question,
            type: data.type,
            order: data.order,
            isActive: data.isActive,
        });
        return Number((result as { insertId: number }).insertId);
    }

    static async deleteQuestion(id: number) {
        await db.delete(evaluationQuestions).where(eq(evaluationQuestions.id, id));
    }

    // ============================================
    // Config (Buka/Tutup per Mata Kuliah)
    // ============================================

    static async getConfigByCourse(courseId: number) {
        const rows = await db
            .select()
            .from(evaluationConfigs)
            .where(eq(evaluationConfigs.courseId, courseId))
            .limit(1);
        return rows[0] || null;
    }

    static async setOpen(courseId: number, isOpen: boolean, actorId: string) {
        const existing = await this.getConfigByCourse(courseId);

        if (!existing) {
            await db.insert(evaluationConfigs).values({
                courseId,
                isOpen,
                openedBy: isOpen ? actorId : null,
                openedAt: isOpen ? new Date() : null,
                closedAt: isOpen ? null : new Date(),
            });
            return;
        }

        await db
            .update(evaluationConfigs)
            .set({
                isOpen,
                openedBy: isOpen ? actorId : existing.openedBy,
                openedAt: isOpen ? new Date() : existing.openedAt,
                closedAt: isOpen ? null : new Date(),
                updatedAt: new Date(),
            })
            .where(eq(evaluationConfigs.id, existing.id));
    }

    // ============================================
    // Responses
    // ============================================

    static async hasSubmitted(courseId: number, studentId: string): Promise<boolean> {
        const rows = await db
            .select({ id: evaluationResponses.id })
            .from(evaluationResponses)
            .where(and(eq(evaluationResponses.courseId, courseId), eq(evaluationResponses.studentIdentifier, studentId)))
            .limit(1);
        return rows.length > 0;
    }

    static async submitResponse(courseId: number, studentId: string, answers: Record<string, string | number>) {
        const config = await this.getConfigByCourse(courseId);
        if (!config || !config.isOpen) {
            throw new Error('Kuesioner evaluasi untuk mata kuliah ini sedang tidak dibuka');
        }

        const alreadySubmitted = await this.hasSubmitted(courseId, studentId);
        if (alreadySubmitted) {
            throw new Error('Anda sudah mengisi evaluasi untuk mata kuliah ini');
        }

        await db.insert(evaluationResponses).values({
            courseId,
            studentIdentifier: studentId,
            answers,
        });
    }

    static async getResponsesByCourse(courseId: number) {
        return await db
            .select()
            .from(evaluationResponses)
            .where(eq(evaluationResponses.courseId, courseId));
    }

    static async getRespondentsByCourse(courseId: number) {
        const rows = await db
            .select({
                responseId: evaluationResponses.id,
                studentIdentifier: evaluationResponses.studentIdentifier,
                studentName: users.fullName,
                submittedAt: evaluationResponses.submittedAt,
            })
            .from(evaluationResponses)
            .leftJoin(users, eq(evaluationResponses.studentIdentifier, users.identifier))
            .where(eq(evaluationResponses.courseId, courseId))
            .orderBy(desc(evaluationResponses.submittedAt));
        return rows;
    }

    /**
     * Hapus satu jawaban mahasiswa (respondent) untuk suatu MK, supaya mereka
     * bisa mengisi ulang kuesioner selama statusnya masih "Buka".
     */
    static async deleteResponse(responseId: number) {
        await db.delete(evaluationResponses).where(eq(evaluationResponses.id, responseId));
    }

    /**
     * Rekap hasil evaluasi satu mata kuliah:
     * - Pertanyaan tipe 'Rating': rata-rata nilai per pertanyaan
     * - Pertanyaan tipe 'Teks': daftar jawaban teks
     */
    static async getResults(courseId: number): Promise<EvaluationResults> {
        const [questions, responses] = await Promise.all([
            this.getQuestions(),
            this.getResponsesByCourse(courseId),
        ]);

        const questionResults: EvaluationQuestionResult[] = questions.map((q) => {
            if (q.type === 'Rating') {
                const values: number[] = [];
                for (const r of responses) {
                    const answers = (r.answers || {}) as Record<string, string | number>;
                    const raw = answers[String(q.id)];
                    const num = typeof raw === 'number' ? raw : Number(raw);
                    if (raw !== undefined && raw !== null && !Number.isNaN(num)) {
                        values.push(num);
                    }
                }
                const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
                return {
                    id: q.id,
                    question: q.question,
                    type: q.type,
                    order: q.order,
                    average,
                    ratingCount: values.length,
                    textAnswers: [],
                };
            }

            const textAnswers: string[] = [];
            for (const r of responses) {
                const answers = (r.answers || {}) as Record<string, string | number>;
                const raw = answers[String(q.id)];
                if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                    textAnswers.push(String(raw));
                }
            }
            return {
                id: q.id,
                question: q.question,
                type: q.type,
                order: q.order,
                average: null,
                ratingCount: 0,
                textAnswers,
            };
        });

        const respondents = await this.getRespondentsByCourse(courseId);

        return {
            courseId,
            totalRespondents: responses.length,
            questions: questionResults,
            respondents,
        };
    }

    // ============================================
    // Managed Courses (untuk Dosen / pemegang 'practicum.manage')
    // ============================================

    /**
     * Daftar MK yang boleh dikelola evaluasinya oleh sesi yang sedang login:
     * - Admin: semua MK
     * - Dosen: MK yang diampu (dengan permission 'evaluation.manage')
     * - Pemegang permission 'practicum.manage': MK yang pernah dia buatkan
     *   jadwal praktikumnya (LAB-INDUSTRI tidak punya role terpisah "Asisten
     *   Praktikum" — cek ini murni berbasis permission + kepemilikan jadwal,
     *   sama seperti `canManageCourse`).
     */
    static async getManagedCourses(session: any): Promise<ManagedCourse[]> {
        if (!session?.user) return [];

        if (this.isAdmin(session)) {
            const rows = await db.select({ id: courses.id, code: courses.code, name: courses.name }).from(courses);
            return rows.map((r) => ({ courseId: r.id, courseCode: r.code, courseName: r.name }));
        }

        const managed = new Map<number, ManagedCourse>();

        if (hasPermission(session, 'evaluation.manage')) {
            const rows = await db
                .select({ id: courses.id, code: courses.code, name: courses.name })
                .from(courses)
                .where(eq(courses.lecturerId, session.user.identifier));
            for (const r of rows) {
                managed.set(r.id, { courseId: r.id, courseCode: r.code, courseName: r.name });
            }
        }

        if (hasPermission(session, 'practicum.manage')) {
            const rows = await db
                .selectDistinct({ id: courses.id, code: courses.code, name: courses.name })
                .from(scheduledPracticums)
                .innerJoin(courses, eq(scheduledPracticums.courseId, courses.id))
                .where(eq(scheduledPracticums.createdBy, session.user.identifier));
            for (const r of rows) {
                managed.set(r.id, { courseId: r.id, courseCode: r.code, courseName: r.name });
            }
        }

        return Array.from(managed.values());
    }

    // ============================================
    // Analyses (Hasil Analisis Kuesioner, diunggah pengelola MK)
    // ============================================

    static async getAnalysesByCourse(courseId: number): Promise<EvaluationAnalysis[]> {
        return await db
            .select({
                id: evaluationAnalyses.id,
                courseId: evaluationAnalyses.courseId,
                uploadedBy: evaluationAnalyses.uploadedBy,
                uploaderName: users.fullName,
                fileName: evaluationAnalyses.fileName,
                filePath: evaluationAnalyses.filePath,
                note: evaluationAnalyses.note,
                createdAt: evaluationAnalyses.createdAt,
            })
            .from(evaluationAnalyses)
            .leftJoin(users, eq(evaluationAnalyses.uploadedBy, users.identifier))
            .where(eq(evaluationAnalyses.courseId, courseId))
            .orderBy(desc(evaluationAnalyses.createdAt));
    }

    static async uploadAnalysis(courseId: number, uploadedBy: string, fileName: string, filePath: string, note: string | null) {
        await db.insert(evaluationAnalyses).values({ courseId, uploadedBy, fileName, filePath, note: note || null });
    }

    static async getAnalysisById(id: number) {
        const rows = await db.select().from(evaluationAnalyses).where(eq(evaluationAnalyses.id, id)).limit(1);
        return rows[0] || null;
    }

    static async deleteAnalysis(id: number) {
        await db.delete(evaluationAnalyses).where(eq(evaluationAnalyses.id, id));
    }
}
