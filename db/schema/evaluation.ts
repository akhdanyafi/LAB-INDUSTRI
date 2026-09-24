import { mysqlTable, int, varchar, text, boolean, datetime, mysqlEnum, json, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { courses } from './practicum';

// ============================================
// Evaluation Questions (Master Pertanyaan Kuesioner)
// - Managed by Admin
// ============================================
export const evaluationQuestions = mysqlTable('evaluation_questions', {
    id: int('id').autoincrement().primaryKey(),
    question: text('question').notNull(),
    type: mysqlEnum('type', ['Rating', 'Teks']).default('Rating').notNull(),
    order: int('order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// Evaluation Configs (Status Buka/Tutup Kuesioner per Mata Kuliah)
// ============================================
export const evaluationConfigs = mysqlTable('evaluation_configs', {
    id: int('id').autoincrement().primaryKey(),
    courseId: int('course_id').notNull().unique().references(() => courses.id, { onDelete: 'cascade' }),
    isOpen: boolean('is_open').default(false).notNull(),
    openedBy: varchar('opened_by', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }),
    openedAt: datetime('opened_at'),
    closedAt: datetime('closed_at'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at'),
}, (table) => ({
    openedByIdx: index('ec_opened_by_idx').on(table.openedBy),
}));

// ============================================
// Evaluation Responses (Jawaban Mahasiswa)
// - 1 mahasiswa hanya boleh submit sekali per MK selama kuesioner "Buka"
// ============================================
export const evaluationResponses = mysqlTable('evaluation_responses', {
    id: int('id').autoincrement().primaryKey(),
    courseId: int('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    studentIdentifier: varchar('student_identifier', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    answers: json('answers').notNull(),
    submittedAt: datetime('submitted_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    uniqueCourseStudent: uniqueIndex('unique_evaluation_course_student').on(table.courseId, table.studentIdentifier),
    courseIdx: index('er_course_idx').on(table.courseId),
    studentIdx: index('er_student_idx').on(table.studentIdentifier),
}));

// ============================================
// Evaluation Analyses (Hasil Analisis Kuesioner, diunggah pengelola MK)
// ============================================
export const evaluationAnalyses = mysqlTable('evaluation_analyses', {
    id: int('id').autoincrement().primaryKey(),
    courseId: int('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    uploadedBy: varchar('uploaded_by', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 255 }).notNull(),
    note: text('note'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    courseIdx: index('ea_course_idx').on(table.courseId),
    uploadedByIdx: index('ea_uploaded_by_idx').on(table.uploadedBy),
}));

// ============================================
// Relations
// ============================================
export const evaluationConfigsRelations = relations(evaluationConfigs, ({ one }) => ({
    course: one(courses, {
        fields: [evaluationConfigs.courseId],
        references: [courses.id],
    }),
    openedByUser: one(users, {
        fields: [evaluationConfigs.openedBy],
        references: [users.identifier],
    }),
}));

export const evaluationResponsesRelations = relations(evaluationResponses, ({ one }) => ({
    course: one(courses, {
        fields: [evaluationResponses.courseId],
        references: [courses.id],
    }),
    student: one(users, {
        fields: [evaluationResponses.studentIdentifier],
        references: [users.identifier],
    }),
}));

export const evaluationAnalysesRelations = relations(evaluationAnalyses, ({ one }) => ({
    course: one(courses, {
        fields: [evaluationAnalyses.courseId],
        references: [courses.id],
    }),
    uploadedByUser: one(users, {
        fields: [evaluationAnalyses.uploadedBy],
        references: [users.identifier],
    }),
}));
