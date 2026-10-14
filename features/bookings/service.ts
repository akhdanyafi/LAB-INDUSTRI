/**
 * Booking Service
 * Business logic for room bookings management
 */

import { db } from '@/db';
import { roomBookings, rooms, users, roles, scheduledPracticums, courses } from '@/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface CreateBookingInput {
    userId: string;
    roomId: number;
    startTime: Date;
    endTime: Date;
    purpose: string;
    // New fields
    organisasi?: string;
    jumlahPeserta?: number;
    suratPermohonan?: string;
    suratVerified?: boolean;
    dosenPembimbing?: string;
}

export class BookingService {
    /**
     * Get all rooms
     */
    static async getAllRooms() {
        return await db.select().from(rooms).orderBy(desc(rooms.id));
    }

    /**
     * Check room availability for a specific date
     */
    static async getRoomAvailability(roomId: number, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await db
            .select()
            .from(roomBookings)
            .where(and(
                eq(roomBookings.roomId, roomId),
                eq(roomBookings.status, 'Disetujui'),
                gte(roomBookings.startTime, startOfDay),
                lte(roomBookings.endTime, endOfDay)
            ))
            .orderBy(roomBookings.startTime);
    }

    /**
     * Create a new room booking request
     * Auto-validates if suratPermohonan is provided
     * Uses user's dosenPembimbing as fallback if not provided (only for students)
     */
    static async create(data: CreateBookingInput) {
        // Check for conflicts with scheduled practicums.
        // Each scheduled practicum is materialised as its own row with a concrete
        // scheduledDate, so only schedules falling on the SAME calendar date as the
        // booking can conflict — matching on dayOfWeek alone would block that weekday
        // forever, including dates long after the practicum has passed.
        const startOfDay = new Date(data.startTime);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(data.startTime);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingStartStr = `${String(data.startTime.getHours()).padStart(2, '0')}:${String(data.startTime.getMinutes()).padStart(2, '0')}`;
        const bookingEndStr = `${String(data.endTime.getHours()).padStart(2, '0')}:${String(data.endTime.getMinutes()).padStart(2, '0')}`;

        const conflictingSchedules = await db
            .select({ id: scheduledPracticums.id, startTime: scheduledPracticums.startTime, endTime: scheduledPracticums.endTime })
            .from(scheduledPracticums)
            .where(and(
                eq(scheduledPracticums.roomId, data.roomId),
                eq(scheduledPracticums.status, 'Aktif'),
                gte(scheduledPracticums.scheduledDate, startOfDay),
                lte(scheduledPracticums.scheduledDate, endOfDay)
            ));

        const conflict = conflictingSchedules.find(s =>
            bookingStartStr < s.endTime && bookingEndStr > s.startTime
        );

        if (conflict) {
            throw new Error(`Ruangan tidak tersedia: sudah dijadwalkan untuk praktikum terjadwal pada pukul ${conflict.startTime}-${conflict.endTime}`);
        }

        // Auto-validate if surat permohonan is provided AND verified
        const status = data.suratPermohonan && data.suratVerified ? 'Disetujui' : 'Pending';

        // Get user's dosenPembimbing and role
        const user = await db
            .select({
                dosenPembimbing: users.dosenPembimbing,
                roleName: roles.name,
            })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.identifier, data.userId))
            .limit(1);

        // If user is a lecturer (Dosen), don't set dosen pembimbing
        let finalDosenPembimbing: string | undefined = undefined;
        if (user[0]?.roleName !== 'Dosen') {
            finalDosenPembimbing = data.dosenPembimbing || user[0]?.dosenPembimbing || undefined;
        }

        await db.insert(roomBookings).values({
            userId: data.userId,
            roomId: data.roomId,
            startTime: data.startTime,
            endTime: data.endTime,
            purpose: data.purpose,
            organisasi: data.organisasi || 'Pribadi',
            jumlahPeserta: data.jumlahPeserta || 1,
            suratPermohonan: data.suratPermohonan || null,
            dosenPembimbing: finalDosenPembimbing,
            status,
        });
    }

    /**
     * Get booking requests with optional filters
     */
    static async getAll(filters?: { status?: string; startDate?: Date; endDate?: Date }) {
        let query = db
            .select({
                booking: roomBookings,
                user: users,
                room: rooms,
            })
            .from(roomBookings)
            .leftJoin(users, eq(roomBookings.userId, users.identifier))
            .leftJoin(rooms, eq(roomBookings.roomId, rooms.id))
            .orderBy(desc(roomBookings.startTime));

        const conditions = [];

        if (filters?.status) {
            conditions.push(eq(roomBookings.status, filters.status as any));
        }

        if (filters?.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            conditions.push(gte(roomBookings.startTime, start));
        }

        if (filters?.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(roomBookings.startTime, end));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const results = await query;

        return results.map(row => ({
            ...row.booking,
            user: row.user!,
            room: row.room!,
        }));
    }

    /**
     * Delete a booking
     */
    static async delete(id: number) {
        await db.delete(roomBookings).where(eq(roomBookings.id, id));
    }

    /**
     * Update booking status (approve/reject)
     */
    static async updateStatus(
        bookingId: number,
        status: 'Disetujui' | 'Ditolak',
        validatorId: string,
        rejectionReason?: string
    ) {
        await db.update(roomBookings)
            .set({ 
                status, 
                validatorId,
                rejectionReason: status === 'Ditolak' ? (rejectionReason || null) : null
            })
            .where(eq(roomBookings.id, bookingId));
    }

    /**
     * Mark an approved booking as finished (room no longer in use).
     * The booking drops off the calendar but stays in history.
     */
    static async markCompleted(bookingId: number) {
        const [result] = await db.update(roomBookings)
            .set({ status: 'Selesai' })
            .where(and(eq(roomBookings.id, bookingId), eq(roomBookings.status, 'Disetujui')));
        if (result.affectedRows === 0) {
            throw new Error('Booking tidak ditemukan atau belum disetujui');
        }
    }

    /**
     * Get user's bookings
     */
    static async getByUserId(userId: string) {
        const results = await db
            .select({
                booking: roomBookings,
                room: rooms,
            })
            .from(roomBookings)
            .leftJoin(rooms, eq(roomBookings.roomId, rooms.id))
            .where(eq(roomBookings.userId, userId))
            .orderBy(desc(roomBookings.startTime));

        return results.map(row => ({
            ...row.booking,
            room: row.room!,
        }));
    }

    /**
     * Get bookings for a specific month (for calendar)
     */
    static async getMonthBookings(month: number, year: number) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const results = await db
            .select({
                booking: roomBookings,
                room: rooms,
            })
            .from(roomBookings)
            .leftJoin(rooms, eq(roomBookings.roomId, rooms.id))
            .where(and(
                eq(roomBookings.status, 'Disetujui'),
                gte(roomBookings.startTime, startDate),
                lte(roomBookings.endTime, endDate)
            ));

        return results.map(row => ({
            ...row.booking,
            room: row.room!,
        }));
    }

    /**
     * Get rooms under maintenance
     */
    static async getMaintenanceRooms() {
        return await db.select().from(rooms).where(eq(rooms.status, 'Maintenance'));
    }

    /**
     * Get scheduled practicums for a room (for calendar display)
     */
    static async getScheduledPracticumsForCalendar(roomId?: number) {
        const conditions = [
            eq(scheduledPracticums.status, 'Aktif'),
        ];

        if (roomId) {
            conditions.push(eq(scheduledPracticums.roomId, roomId));
        }

        const results = await db
            .select({
                id: scheduledPracticums.id,
                roomId: scheduledPracticums.roomId,
                roomName: rooms.name,
                courseName: courses.name,
                courseCode: courses.code,
                dayOfWeek: scheduledPracticums.dayOfWeek,
                startTime: scheduledPracticums.startTime,
                endTime: scheduledPracticums.endTime,
                scheduledDate: scheduledPracticums.scheduledDate,
            })
            .from(scheduledPracticums)
            .leftJoin(rooms, eq(scheduledPracticums.roomId, rooms.id))
            .leftJoin(courses, eq(scheduledPracticums.courseId, courses.id))
            .where(and(...conditions))
            .orderBy(scheduledPracticums.dayOfWeek, scheduledPracticums.startTime);

        return results;
    }
}
