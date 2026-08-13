import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { rooms } from './bookings'; // Assuming rooms are shared or in bookings

// Item Categories
export const itemCategories = mysqlTable('item_categories', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
});

// Items
export const items = mysqlTable('items', {
    id: int('id').autoincrement().primaryKey(),
    categoryId: int('category_id').notNull().references(() => itemCategories.id, { onDelete: 'restrict' }),
    roomId: int('room_id').notNull().references(() => rooms.id, { onDelete: 'restrict' }), // Location
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    qrCode: varchar('qr_code', { length: 255 }).unique().notNull(),
    quantity: int('quantity').notNull().default(1),
    status: mysqlEnum('status', ['Tersedia', 'Dipinjam', 'Maintenance']).default('Tersedia'),
}, (table) => ({
    categoryIdx: index('category_idx').on(table.categoryId),
    roomIdx: index('room_idx').on(table.roomId),
}));

export const itemsRelations = relations(items, ({ one }) => ({
    category: one(itemCategories, {
        fields: [items.categoryId],
        references: [itemCategories.id],
    }),
    room: one(rooms, {
        fields: [items.roomId],
        references: [rooms.id],
    }),
}));

// Item Loans
export const itemLoans = mysqlTable('item_loans', {
    id: int('id').autoincrement().primaryKey(),
    studentId: varchar('student_id', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    itemId: int('item_id').notNull().references(() => items.id, { onDelete: 'restrict' }),
    validatorId: varchar('validator_id', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }),
    requestDate: datetime('request_date').default(sql`CURRENT_TIMESTAMP`),
    returnPlanDate: datetime('return_plan_date').notNull(),
    actualReturnDate: datetime('actual_return_date'),
    status: mysqlEnum('status', ['Pending', 'Disetujui', 'Ditolak', 'Selesai', 'Terlambat']).default('Pending'),
    rejectionReason: text('rejection_reason'),
    // New fields for enhanced loan form
    organisasi: varchar('organisasi', { length: 255 }),
    startTime: datetime('start_time'),
    endTime: datetime('end_time'),
    purpose: varchar('purpose', { length: 255 }),
    suratIzin: varchar('surat_izin', { length: 255 }),
    dosenPembimbing: varchar('dosen_pembimbing', { length: 255 }),
    software: text('software'), // JSON array of selected software for PC/Server
    notificationRead: mysqlEnum('notification_read', ['0', '1']).default('0'), // Track if admin has seen auto-approval notification
    // Return mechanism fields
    returnPhoto: varchar('return_photo', { length: 255 }), // Photo proof of return
    returnStatus: mysqlEnum('return_status', ['Belum', 'Pending', 'Dikembalikan']).default('Belum'), // Return status
    returnNotificationRead: mysqlEnum('return_notification_read', ['0', '1']).default('0'), // Track if admin has seen auto-return notification
}, (table) => ({
    studentIdx: index('student_idx').on(table.studentId),
    itemIdx: index('item_idx').on(table.itemId),
    validatorIdx: index('validator_idx').on(table.validatorId),
}));

export const itemLoansRelations = relations(itemLoans, ({ one }) => ({
    student: one(users, {
        fields: [itemLoans.studentId],
        references: [users.identifier],
    }),
    item: one(items, {
        fields: [itemLoans.itemId],
        references: [items.id],
    }),
    validator: one(users, {
        fields: [itemLoans.validatorId],
        references: [users.identifier],
    }),
}));
