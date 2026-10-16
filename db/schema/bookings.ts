import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Rooms
export const rooms = mysqlTable('rooms', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    capacity: int('capacity').notNull(),
    status: mysqlEnum('status', ['Tersedia', 'Maintenance']).default('Tersedia'),
});

export const roomBookings = mysqlTable('room_bookings', {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    roomId: int('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
    validatorId: varchar('validator_id', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }),
    startTime: datetime('start_time').notNull(),
    endTime: datetime('end_time').notNull(),
    purpose: text('purpose').notNull(),
    // New fields
    organisasi: varchar('organisasi', { length: 255 }).default('Pribadi'), // e.g. Pribadi, HMIF, Panitia Fortex
    jumlahPeserta: int('jumlah_peserta').default(1), // Number of attendees
    suratPermohonan: varchar('surat_permohonan', { length: 255 }), // File path for permission letter (optional)
    dosenPembimbing: varchar('dosen_pembimbing', { length: 255 }), // Supervising lecturer name
    status: mysqlEnum('status', ['Pending', 'Disetujui', 'Ditolak', 'Selesai']).default('Pending'),
    rejectionReason: text('rejection_reason'),
    notificationRead: mysqlEnum('notification_read', ['0', '1']).default('0'), // Track if admin has seen auto-approval notification
}, (table) => ({
    userIdx: index('user_idx').on(table.userId),
    roomIdx: index('room_idx').on(table.roomId),
    validatorIdx: index('validator_idx').on(table.validatorId),
}));

export const roomBookingsRelations = relations(roomBookings, ({ one }) => ({
    user: one(users, {
        fields: [roomBookings.userId],
        references: [users.identifier],
    }),
    room: one(rooms, {
        fields: [roomBookings.roomId],
        references: [rooms.id],
    }),
    validator: one(users, {
        fields: [roomBookings.validatorId],
        references: [users.identifier],
    }),
}));
