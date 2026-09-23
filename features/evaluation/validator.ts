/**
 * Evaluation (Form Evaluasi Praktikum) Validator
 */

import { z } from 'zod';

export const toggleEvaluationSchema = z.object({
    courseId: z.coerce.number().min(1, 'Mata kuliah harus dipilih'),
    isOpen: z.coerce.boolean(),
});

export const submitEvaluationSchema = z.object({
    courseId: z.coerce.number().min(1, 'Mata kuliah harus dipilih'),
    answers: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const upsertQuestionSchema = z.object({
    id: z.coerce.number().optional(),
    question: z.string().min(1, 'Pertanyaan harus diisi'),
    type: z.enum(['Rating', 'Teks'], { message: 'Tipe pertanyaan harus dipilih' }),
    order: z.coerce.number().default(0),
    isActive: z.coerce.boolean().default(true),
});
