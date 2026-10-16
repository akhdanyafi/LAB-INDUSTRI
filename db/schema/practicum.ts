import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index, date, foreignKey, mediumtext } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { rooms } from './bookings';

// ============================================
// Courses (Mata Kuliah)
// ============================================
export const courses = mysqlTable('courses', {
    id: int('id').autoincrement().primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),     // e.g. "IF201"
    name: varchar('name', { length: 255 }).notNull(),             // e.g. "Basis Data"
    description: text('description'),
    sks: int('sks').default(3),
    semester: mysqlEnum('semester', ['Ganjil', 'Genap']),           // Ganjil or Genap
    lecturerId: varchar('lecturer_id', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }), // Dosen pengajar
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    lecturerIdx: index('lecturer_idx').on(table.lecturerId),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    lecturer: one(users, {
        fields: [courses.lecturerId],
        references: [users.identifier],
    }),
    modules: many(practicumModules),
    scheduledPracticums: many(scheduledPracticums),
}));

// ============================================
// Practicum Modules (Modul Praktikum)
// - Linked to a course via courseId
// ============================================
export const practicumModules = mysqlTable('practicum_modules', {
    id: int('id').autoincrement().primaryKey(),
    courseId: int('course_id').references(() => courses.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    filePath: varchar('file_path', { length: 255 }),
    moduleLink: varchar('module_link', { length: 500 }),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at'),
}, (table) => ({
    courseIdx: index('course_idx').on(table.courseId),
}));

export const practicumModulesRelations = relations(practicumModules, ({ one }) => ({
    course: one(courses, {
        fields: [practicumModules.courseId],
        references: [courses.id],
    }),
}));

// ============================================
// Scheduled Practicums (Jadwal Praktikum Terjadwal)
// - Created by Kepala Lab at the start of each semester
// - Blocks room bookings for the scheduled time
// ============================================
export const scheduledPracticums = mysqlTable('scheduled_practicums', {
    id: int('id').autoincrement().primaryKey(),
    courseId: int('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    roomId: int('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
    moduleId: int('module_id').references(() => practicumModules.id, { onDelete: 'set null' }), // Modul praktikum
    createdBy: varchar('created_by', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    dayOfWeek: int('day_of_week').notNull(),                       // 0=Senin, 1=Selasa, ..., 6=Minggu (auto-computed from scheduledDate)
    startTime: varchar('start_time', { length: 5 }).notNull(),     // "08:00"
    endTime: varchar('end_time', { length: 5 }).notNull(),         // "10:00"
    scheduledDate: datetime('scheduled_date').notNull(),            // Tanggal praktikum
    status: mysqlEnum('status', ['Aktif', 'Dibatalkan']).default('Aktif'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    courseIdx: index('sp_course_idx').on(table.courseId),
    roomIdx: index('sp_room_idx').on(table.roomId),
    moduleIdx: index('sp_module_idx').on(table.moduleId),
    createdByIdx: index('sp_created_by_idx').on(table.createdBy),
}));

export const scheduledPracticumsRelations = relations(scheduledPracticums, ({ one, many }) => ({
    course: one(courses, {
        fields: [scheduledPracticums.courseId],
        references: [courses.id],
    }),
    room: one(rooms, {
        fields: [scheduledPracticums.roomId],
        references: [rooms.id],
    }),
    module: one(practicumModules, {
        fields: [scheduledPracticums.moduleId],
        references: [practicumModules.id],
    }),
    createdByUser: one(users, {
        fields: [scheduledPracticums.createdBy],
        references: [users.identifier],
    }),
    practicumReports: many(practicumReports),
}));

// ============================================
// Practicum Reports (Berita Acara Praktikum)
// - Created by users with 'practicum.manage' permission
// - Contains details about practicum execution
// ============================================
export const practicumReports = mysqlTable('practicum_reports', {
    id: int('id').autoincrement().primaryKey(),
    scheduledPracticumId: int('scheduled_practicum_id').notNull(),
    createdBy: varchar('created_by', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    partnerId: varchar('partner_id', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }), // Asprak partner (opsional, maks. 1)

    // Data dari jadwal (disimpan sebagai snapshot)
    courseName: varchar('course_name', { length: 255 }).notNull(),
    courseCode: varchar('course_code', { length: 20 }).notNull(),
    lecturerName: varchar('lecturer_name', { length: 255 }),
    roomName: varchar('room_name', { length: 100 }).notNull(),
    practicumDate: datetime('practicum_date').notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),

    // Data yang diisi pengguna
    batch: varchar('batch', { length: 10 }).notNull(),
    attendeeCount: int('attendee_count').notNull(),
    condition: mysqlEnum('condition', ['Lancar', 'Kurang Lancar', 'Terkendala']).notNull(),
    description: text('description').notNull(),
    issues: text('issues'),
    followUp: text('follow_up'),

    // Status verifikasi
    status: mysqlEnum('report_status', ['Pending', 'Diverifikasi', 'Ditolak']).default('Pending'),
    verifiedBy: varchar('verified_by', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }),
    verifiedAt: datetime('verified_at'),
    rejectionReason: text('rejection_reason'),

    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at'),
    assistantSignature: mediumtext('assistant_signature'),             // TTD asprak pengisi (data URL PNG/JPEG)
    moduleId: int('module_id'),                                         // Modul yang digunakan (modul MK)
    moduleTitle: varchar('module_title', { length: 255 }),              // Judul modul (snapshot / ditulis asprak)
}, (table) => ({
    partnerIdx: index('pr_partner_idx').on(table.partnerId),
    scheduledPracticumIdx: index('pr_scheduled_practicum_idx').on(table.scheduledPracticumId),
    scheduledPracticumFk: foreignKey({
        columns: [table.scheduledPracticumId],
        foreignColumns: [scheduledPracticums.id],
        name: 'pr_sched_prac_id_fk',
    }).onDelete('cascade'),
    createdByIdx: index('pr_created_by_idx').on(table.createdBy),
    statusIdx: index('pr_status_idx').on(table.status),
    verifiedByIdx: index('pr_verified_by_idx').on(table.verifiedBy),
}));

export const practicumReportsRelations = relations(practicumReports, ({ one }) => ({
    scheduledPracticum: one(scheduledPracticums, {
        fields: [practicumReports.scheduledPracticumId],
        references: [scheduledPracticums.id],
    }),
    createdByUser: one(users, {
        fields: [practicumReports.createdBy],
        references: [users.identifier],
        relationName: 'createdBy',
    }),
    verifiedByUser: one(users, {
        fields: [practicumReports.verifiedBy],
        references: [users.identifier],
        relationName: 'verifiedBy',
    }),
}));

// ============================================
// Practicum LPJ Docs (LPJ per Jadwal Praktikum)
// - Uploaded by users with 'practicum.assist' or 'practicum.manage'
// - Linked to a scheduled practicum and covers a specific month/year
// ============================================
export const practicumLpjDocs = mysqlTable('practicum_lpj_docs', {
    id: int('id').autoincrement().primaryKey(),
    scheduledPracticumId: int('scheduled_practicum_id').notNull(),
    uploaderId: varchar('uploader_id', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    periodMonth: int('period_month').notNull(),  // 1-12
    periodYear: int('period_year').notNull(),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    schedIdx: index('lpj_sched_idx').on(table.scheduledPracticumId),
    uploaderIdx: index('lpj_uploader_idx').on(table.uploaderId),
    periodIdx: index('lpj_period_idx').on(table.periodYear, table.periodMonth),
    scheduledPracticumFk: foreignKey({
        columns: [table.scheduledPracticumId],
        foreignColumns: [scheduledPracticums.id],
        name: 'lpj_sched_prac_fk',
    }).onDelete('cascade'),
    uploaderFk: foreignKey({
        columns: [table.uploaderId],
        foreignColumns: [users.identifier],
        name: 'lpj_uploader_fk',
    }).onDelete('cascade'),
}));

export const practicumLpjDocsRelations = relations(practicumLpjDocs, ({ one }) => ({
    scheduledPracticum: one(scheduledPracticums, {
        fields: [practicumLpjDocs.scheduledPracticumId],
        references: [scheduledPracticums.id],
    }),
    uploader: one(users, {
        fields: [practicumLpjDocs.uploaderId],
        references: [users.identifier],
    }),
}));


