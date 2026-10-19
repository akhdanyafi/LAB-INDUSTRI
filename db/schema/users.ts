import { mysqlTable, int, varchar, datetime, mysqlEnum, index, boolean } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// Roles
export const roles = mysqlTable('roles', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(), // 'Admin', 'Mahasiswa', 'Dosen'
});

// Users
export const users = mysqlTable('users', {
    roleId: int('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    identifier: varchar('identifier', { length: 50 }).primaryKey(), // NIM or NIDN
    email: varchar('email', { length: 255 }), // Nullable for pre-registered users
    passwordHash: varchar('password_hash', { length: 255 }), // Nullable for pre-registered users
    status: mysqlEnum('status', ['Active', 'Pending', 'Rejected', 'Pre-registered']).default('Pending'),
    // New fields for bulk enrollment
    batch: int('batch'), // e.g. 2022
    studyType: mysqlEnum('study_type', ['Reguler', 'Hybrid']).default('Reguler'),
    // New fields for student data
    programStudi: varchar('program_studi', { length: 100 }).default('Informatika'), // e.g. 'Informatika', 'Sistem Informasi'
    dosenPembimbing: varchar('dosen_pembimbing', { length: 255 }), // Stores dosen name directly (no FK relation)
    phoneNumber: varchar('phone_number', { length: 20 }), // Optional phone number
    // Biodata tambahan (khususnya untuk role Asisten Praktikum)
    photoPath: varchar('photo_path', { length: 255 }), // Pas foto
    bankName: varchar('bank_name', { length: 100 }), // Nama bank
    bankAccountNumber: varchar('bank_account_number', { length: 50 }), // Nomor rekening
    bankAccountName: varchar('bank_account_name', { length: 255 }), // Nama pemilik rekening
    customRoleEnabled: boolean('custom_role_enabled').notNull().default(false),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    roleIdx: index('role_idx').on(table.roleId),
    batchIdx: index('batch_idx').on(table.batch),
}));

export const usersRelations = relations(users, ({ one }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
}));
