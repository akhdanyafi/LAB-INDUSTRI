'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { EvaluationService } from './service';
import { courses, evaluationConfigs } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import {
    toggleEvaluationSchema,
    submitEvaluationSchema,
    upsertQuestionSchema,
} from './validator';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';
import type { OpenEvaluationForStudent, SubmitEvaluationInput, UpsertQuestionInput } from './types';

function revalidateEvaluationPaths() {
    revalidatePath('/student/evaluation');
    revalidatePath('/lecturer/manage/evaluation');
    revalidatePath('/admin/evaluation');
}

/**
 * Buka / tutup kuesioner evaluasi untuk satu mata kuliah.
 * Boleh: Admin, Dosen pengampu (dgn 'evaluation.manage'), pemegang 'practicum.manage'
 * yang pernah membuat jadwal utk MK tsb.
 */
export async function toggleCourseEvaluation(courseId: number, isOpen: boolean) {
    try {
        const validated = toggleEvaluationSchema.parse({ courseId, isOpen });
        const session = await EvaluationService.requireEvaluationAccess(validated.courseId);

        await EvaluationService.setOpen(validated.courseId, validated.isOpen, session.user.identifier);

        revalidateEvaluationPaths();
        await writeActivityLog({ module: 'evaluation', action: 'toggle', entityType: 'evaluation_config', entityId: validated.courseId, description: `User ${validated.isOpen ? 'membuka' : 'menutup'} kuesioner evaluasi praktikum`, metadata: validated });
        return { success: true };
    } catch (error: any) {
        console.error('Error toggling course evaluation:', error);
        await writeActivityLog({ module: 'evaluation', action: 'toggle', entityType: 'evaluation_config', entityId: courseId, status: 'failed', description: 'Gagal mengubah status evaluasi', metadata: { courseId, isOpen, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal mengubah status evaluasi' };
    }
}

/**
 * Ambil konfigurasi evaluasi (status buka/tutup) untuk satu mata kuliah.
 * Dipakai untuk render tombol toggle dan hasil.
 */
export async function getEvaluationConfigForCourse(courseId: number) {
    return EvaluationService.getConfigByCourse(courseId);
}

/**
 * Daftar MK yang kuesionernya sedang "Buka", beserta status sudah/belum
 * diisi oleh mahasiswa yang sedang login.
 */
export async function getOpenEvaluationsForStudent(): Promise<OpenEvaluationForStudent[]> {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('Anda harus login');
    }

    const openConfigs = await db
        .select({
            courseId: courses.id,
            courseCode: courses.code,
            courseName: courses.name,
        })
        .from(courses)
        .innerJoin(evaluationConfigs, eq(evaluationConfigs.courseId, courses.id))
        .where(eq(evaluationConfigs.isOpen, true));

    const results: OpenEvaluationForStudent[] = [];
    for (const c of openConfigs) {
        const hasSubmitted = await EvaluationService.hasSubmitted(c.courseId, session.user.identifier);
        results.push({
            courseId: c.courseId,
            courseCode: c.courseCode,
            courseName: c.courseName,
            hasSubmitted,
        });
    }
    return results;
}

/**
 * Submit jawaban evaluasi oleh mahasiswa yang sedang login.
 */
export async function submitCourseEvaluation(courseId: number, answers: SubmitEvaluationInput['answers']) {
    try {
        const session = await getSession();
        if (!session?.user) {
            throw new Error('Anda harus login');
        }

        const validated = submitEvaluationSchema.parse({ courseId, answers });

        await EvaluationService.submitResponse(validated.courseId, session.user.identifier, validated.answers);

        revalidateEvaluationPaths();
        await writeActivityLog({ module: 'evaluation', action: 'submit', entityType: 'evaluation_response', entityId: validated.courseId, description: 'Mahasiswa mengisi evaluasi praktikum', metadata: { courseId: validated.courseId } });
        return { success: true };
    } catch (error: any) {
        console.error('Error submitting course evaluation:', error);
        await writeActivityLog({ module: 'evaluation', action: 'submit', entityType: 'evaluation_response', entityId: courseId, status: 'failed', description: 'Gagal mengirim evaluasi', metadata: { courseId, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal mengirim evaluasi' };
    }
}

/**
 * Hasil rekap evaluasi satu mata kuliah (rata-rata rating + jawaban teks).
 * Hanya untuk Admin / Dosen pengampu / pemegang 'practicum.manage' pengelola MK terkait.
 */
export async function getCourseEvaluationResults(courseId: number) {
    await EvaluationService.requireEvaluationAccess(courseId);
    return EvaluationService.getResults(courseId);
}

/**
 * Daftar pertanyaan aktif (untuk ditampilkan di form pengisian mahasiswa).
 */
export async function getEvaluationQuestions() {
    return EvaluationService.getQuestions();
}

/**
 * Daftar semua pertanyaan (aktif & non-aktif) untuk pengelolaan Admin.
 */
export async function getAllEvaluationQuestionsAdmin() {
    const session = await getSession();
    if (!session || session.user.roleId !== 1) {
        throw new Error('Hanya admin yang dapat mengelola pertanyaan evaluasi');
    }
    return EvaluationService.getAllQuestionsAdmin();
}

/**
 * Tambah / ubah pertanyaan evaluasi (Admin only).
 */
export async function upsertEvaluationQuestion(data: UpsertQuestionInput) {
    try {
        const session = await getSession();
        if (!session || session.user.roleId !== 1) {
            throw new Error('Hanya admin yang dapat mengelola pertanyaan evaluasi');
        }

        const validated = upsertQuestionSchema.parse(data);
        await EvaluationService.upsertQuestion(validated as UpsertQuestionInput);

        revalidateEvaluationPaths();
        await writeActivityLog({ module: 'evaluation', action: 'upsert_question', entityType: 'evaluation_question', entityId: validated.id, description: 'Admin menyimpan pertanyaan evaluasi praktikum', metadata: validated });
        return { success: true };
    } catch (error: any) {
        console.error('Error upserting evaluation question:', error);
        await writeActivityLog({ module: 'evaluation', action: 'upsert_question', entityType: 'evaluation_question', status: 'failed', description: 'Gagal menyimpan pertanyaan evaluasi', metadata: { data, error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menyimpan pertanyaan evaluasi' };
    }
}

/**
 * Hapus pertanyaan evaluasi (Admin only).
 */
export async function deleteEvaluationQuestion(id: number) {
    try {
        const session = await getSession();
        if (!session || session.user.roleId !== 1) {
            throw new Error('Hanya admin yang dapat mengelola pertanyaan evaluasi');
        }

        await EvaluationService.deleteQuestion(id);

        revalidateEvaluationPaths();
        await writeActivityLog({ module: 'evaluation', action: 'delete_question', entityType: 'evaluation_question', entityId: id, description: 'Admin menghapus pertanyaan evaluasi praktikum' });
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting evaluation question:', error);
        await writeActivityLog({ module: 'evaluation', action: 'delete_question', entityType: 'evaluation_question', entityId: id, status: 'failed', description: 'Gagal menghapus pertanyaan evaluasi', metadata: { error: getErrorMessage(error) } });
        return { success: false, error: error.message || 'Gagal menghapus pertanyaan evaluasi' };
    }
}
