/**
 * Evaluation (Form Evaluasi Praktikum) Service
 * Business logic for the per-course practicum evaluation questionnaire filled by students.
 */

import { db } from '@/db';
import { evaluationQuestions, evaluationConfigs, evaluationResponses, courses, scheduledPracticums } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { getSession, hasPermission } from '@/lib/auth';
import type {
    EvaluationQuestionResult,
    EvaluationResults,
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

        return {
            courseId,
            totalRespondents: responses.length,
            questions: questionResults,
        };
    }
}
