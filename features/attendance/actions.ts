'use server';

import { findUserByNim, createAttendance, getAvailableRooms } from './service';
import type { CheckInResult } from './types';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

/**
 * Get all available rooms for the attendance form
 */
export async function getRooms() {
    return await getAvailableRooms();
}

/**
 * Get all lecturers for the dosen penanggung jawab dropdown
 */
export async function getLecturers() {
    const { db } = await import('@/db');
    const { users, roles } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const lecturers = await db
        .select({
            identifier: users.identifier,
            fullName: users.fullName,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.name, 'Dosen'))
        .orderBy(users.fullName);

    return lecturers;
}

/**
 * Check in a user by their NIM with room, purpose, and optional dosen penanggung jawab
 */
export async function checkIn(
    nim: string,
    roomId: number,
    purpose: string,
    dosenPenanggungJawab?: string
): Promise<CheckInResult> {
    try {
        // Validate NIM
        if (!nim || nim.trim() === '') {
            await writeActivityLog({
                module: 'attendance',
                action: 'check_in',
                status: 'failed',
                entityType: 'lab_attendance',
                description: 'Absensi gagal: NIM kosong',
                metadata: { nim, roomId, purpose },
            });
            return {
                success: false,
                error: 'NIM tidak boleh kosong',
            };
        }

        // Validate room
        if (!roomId || roomId <= 0) {
            await writeActivityLog({
                module: 'attendance',
                action: 'check_in',
                status: 'failed',
                entityType: 'lab_attendance',
                description: 'Absensi gagal: ruangan belum dipilih',
                metadata: { nim, roomId, purpose },
                actor: { identifier: nim },
            });
            return {
                success: false,
                error: 'Silakan pilih ruangan',
            };
        }

        // Validate purpose
        if (!purpose || purpose.trim() === '') {
            await writeActivityLog({
                module: 'attendance',
                action: 'check_in',
                status: 'failed',
                entityType: 'lab_attendance',
                description: 'Absensi gagal: tujuan belum diisi',
                metadata: { nim, roomId, purpose },
                actor: { identifier: nim },
            });
            return {
                success: false,
                error: 'Silakan pilih atau masukkan tujuan',
            };
        }

        // Find user by NIM
        const user = await findUserByNim(nim.trim());

        if (!user) {
            await writeActivityLog({
                module: 'attendance',
                action: 'check_in',
                status: 'failed',
                entityType: 'lab_attendance',
                description: 'Absensi gagal: NIM tidak terdaftar',
                metadata: { nim, roomId, purpose },
                actor: { identifier: nim },
            });
            return {
                success: false,
                error: 'NIM tidak terdaftar dalam sistem',
            };
        }

        // Use provided dosen or fallback to user's dosenPembimbing
        // If user is a lecturer (Dosen), set to null since they don't have a supervisor
        let finalDosenPenanggungJawab = '-';
        if (user.roleName !== 'Dosen') {
            finalDosenPenanggungJawab = dosenPenanggungJawab?.trim() || user.dosenPembimbing || '-';
        }

        // Create attendance record
        await createAttendance(user.identifier, roomId, purpose.trim(), finalDosenPenanggungJawab);

        // Get the latest attendance for this user with details
        const attendance = await getLatestAttendanceForUser(user.identifier);

        await writeActivityLog({
            module: 'attendance',
            action: 'check_in',
            entityType: 'lab_attendance',
            entityId: attendance?.id,
            description: 'User melakukan absensi masuk lab',
            metadata: { nim: user.identifier, roomId, purpose, dosenPenanggungJawab: finalDosenPenanggungJawab },
            actor: { identifier: user.identifier, fullName: user.fullName },
        });
        return {
            success: true,
            data: attendance,
        };
    } catch (error) {
        console.error('Check-in error:', error);
        await writeActivityLog({
            module: 'attendance',
            action: 'check_in',
            entityType: 'lab_attendance',
            status: 'failed',
            description: 'Absensi gagal karena error sistem',
            metadata: { nim, roomId, purpose, dosenPenanggungJawab, error: getErrorMessage(error) },
            actor: { identifier: nim },
        });
        return {
            success: false,
            error: 'Terjadi kesalahan saat melakukan absen',
        };
    }
}

/**
 * Get the latest attendance record for a user with all details
 */
async function getLatestAttendanceForUser(userId: string) {
    const { db } = await import('@/db');
    const { labAttendance, users, rooms } = await import('@/db/schema');
    const { eq, desc } = await import('drizzle-orm');

    const result = await db.select({
        id: labAttendance.id,
        userId: labAttendance.userId,
        roomId: labAttendance.roomId,
        purpose: labAttendance.purpose,
        dosenPenanggungJawab: labAttendance.dosenPenanggungJawab,
        checkInTime: labAttendance.checkInTime,
        user: {
            identifier: users.identifier,
            fullName: users.fullName,
        },
        room: {
            id: rooms.id,
            name: rooms.name,
            location: rooms.location,
        }
    })
        .from(labAttendance)
        .innerJoin(users, eq(labAttendance.userId, users.identifier))
        .innerJoin(rooms, eq(labAttendance.roomId, rooms.id))
        .where(eq(labAttendance.userId, userId))
        .orderBy(desc(labAttendance.checkInTime))
        .limit(1);

    return result[0] || null;
}

/**
 * Get today's attendance for dashboard
 */
export async function getTodayAttendanceAction() {
    const { getTodayAttendance } = await import('./service');
    return getTodayAttendance();
}

/**
 * Get room attendance statistics for dashboard chart
 */
export async function getRoomAttendanceStatsAction() {
    const { getRoomAttendanceStats } = await import('./service');
    return getRoomAttendanceStats();
}

