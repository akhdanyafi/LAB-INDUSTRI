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
