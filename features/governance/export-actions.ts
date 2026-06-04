'use server';

import { db } from '@/db';
import { labAttendance, itemLoans, roomBookings, users, rooms, items } from '@/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { writeActivityLog } from '@/lib/audit';

interface ExportFilters {
    startDate: string;
    endDate: string;
}

// Helper function to escape CSV values
const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '"-"';
    const str = String(value);
    // Always wrap in quotes and escape internal quotes
    return `"${str.replace(/"/g, '""')}"`;
};

// Helper function for identifiers (NIM/NIDN) to preserve leading zeros in Excel
// Uses ="value" format which Excel interprets as text formula
const escapeIdentifier = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '"-"';
    // Format as Excel text formula to preserve leading zeros: ="0001234"
    return `"=""${value.replace(/"/g, '""')}"""`;
};

/**
 * Export attendance data to CSV format
 */
export async function exportAttendanceData(filters: ExportFilters) {
    const { startDate, endDate } = filters;

    const records = await db
        .select({
            id: labAttendance.id,
            userName: users.fullName,
            userIdentifier: users.identifier,
            roomName: rooms.name,
            checkIn: labAttendance.checkInTime,
            purpose: labAttendance.purpose,
            dosenPJ: labAttendance.dosenPenanggungJawab,
        })
        .from(labAttendance)
        .leftJoin(users, eq(labAttendance.userId, users.identifier))
        .leftJoin(rooms, eq(labAttendance.roomId, rooms.id))
        .where(
            and(
                gte(labAttendance.checkInTime, new Date(startDate)),
                lte(labAttendance.checkInTime, new Date(endDate + 'T23:59:59'))
            )
        )
        .orderBy(labAttendance.checkInTime);

    // Format as CSV
    const headers = ['No', 'Nama', 'NIM/NIDN', 'Ruangan', 'Waktu Masuk', 'Dosen Penanggung Jawab', 'Keperluan'];
    const rows = records.map((r, i) => {
        const checkIn = r.checkIn ? new Date(r.checkIn) : null;

        return [
            i + 1,
            escapeCSV(r.userName),
            escapeIdentifier(r.userIdentifier),
            escapeCSV(r.roomName),
            escapeCSV(checkIn ? checkIn.toLocaleString('id-ID') : '-'),
            escapeCSV(r.dosenPJ),
            escapeCSV(r.purpose)
        ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    await writeActivityLog({
        module: 'exports',
        action: 'export_attendance_csv',
        entityType: 'lab_attendance',
        description: 'User mengekspor data absensi',
        metadata: { filters, count: records.length },
    });
    return { csv: csvContent, count: records.length };
}

/**
 * Export item loan data to CSV format
 */
export async function exportLoanData(filters: ExportFilters) {
    const { startDate, endDate } = filters;

    const records = await db
        .select({
            id: itemLoans.id,
            userName: users.fullName,
            userIdentifier: users.identifier,
            itemName: items.name,
            requestDate: itemLoans.requestDate,
            returnPlanDate: itemLoans.returnPlanDate,
            actualReturnDate: itemLoans.actualReturnDate,
            status: itemLoans.status,
            organisasi: itemLoans.organisasi,
            purpose: itemLoans.purpose,
        })
        .from(itemLoans)
        .leftJoin(users, eq(itemLoans.studentId, users.identifier))
        .leftJoin(items, eq(itemLoans.itemId, items.id))
        .where(
            and(
                gte(itemLoans.requestDate, new Date(startDate)),
                lte(itemLoans.requestDate, new Date(endDate + 'T23:59:59'))
            )
        )
        .orderBy(itemLoans.requestDate);

    const headers = ['No', 'Nama', 'NIM/NIDN', 'Alat', 'Tanggal Request', 'Rencana Kembali', 'Aktual Kembali', 'Status', 'Organisasi', 'Keperluan'];
    const rows = records.map((r, i) => [
        i + 1,
        escapeCSV(r.userName),
        escapeIdentifier(r.userIdentifier),
        escapeCSV(r.itemName),
        escapeCSV(r.requestDate ? new Date(r.requestDate).toLocaleDateString('id-ID') : '-'),
        escapeCSV(r.returnPlanDate ? new Date(r.returnPlanDate).toLocaleDateString('id-ID') : '-'),
        escapeCSV(r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString('id-ID') : '-'),
        escapeCSV(r.status),
        escapeCSV(r.organisasi),
        escapeCSV(r.purpose)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    await writeActivityLog({
        module: 'exports',
        action: 'export_loans_csv',
        entityType: 'item_loan',
        description: 'User mengekspor data peminjaman',
        metadata: { filters, count: records.length },
    });
    return { csv: csvContent, count: records.length };
}

/**
 * Export room booking data to CSV format
 */
export async function exportBookingData(filters: ExportFilters) {
    const { startDate, endDate } = filters;

    const records = await db
        .select({
            id: roomBookings.id,
            userName: users.fullName,
            userIdentifier: users.identifier,
            roomName: rooms.name,
            startTime: roomBookings.startTime,
            endTime: roomBookings.endTime,
            purpose: roomBookings.purpose,
            status: roomBookings.status,
            organisasi: roomBookings.organisasi,
            jumlahPeserta: roomBookings.jumlahPeserta,
            dosenPembimbing: roomBookings.dosenPembimbing,
        })
        .from(roomBookings)
        .leftJoin(users, eq(roomBookings.userId, users.identifier))
        .leftJoin(rooms, eq(roomBookings.roomId, rooms.id))
        .where(
            and(
                gte(roomBookings.startTime, new Date(startDate)),
                lte(roomBookings.startTime, new Date(endDate + 'T23:59:59'))
            )
        )
        .orderBy(roomBookings.startTime);

    const headers = ['No', 'Nama', 'NIM/NIDN', 'Ruangan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Status', 'Organisasi', 'Jumlah Peserta', 'Dosen Pembimbing', 'Keperluan'];
    const rows = records.map((r, i) => {
        const start = r.startTime ? new Date(r.startTime) : null;
        const end = r.endTime ? new Date(r.endTime) : null;

        return [
            i + 1,
            escapeCSV(r.userName),
            escapeIdentifier(r.userIdentifier),
            escapeCSV(r.roomName),
            escapeCSV(start ? start.toLocaleDateString('id-ID') : '-'),
            escapeCSV(start ? start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'),
            escapeCSV(end ? end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'),
            escapeCSV(r.status),
            escapeCSV(r.organisasi),
            r.jumlahPeserta || '-',
            escapeCSV(r.dosenPembimbing),
            escapeCSV(r.purpose)
        ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    await writeActivityLog({
        module: 'exports',
        action: 'export_bookings_csv',
        entityType: 'room_booking',
        description: 'User mengekspor data booking ruangan',
        metadata: { filters, count: records.length },
    });
    return { csv: csvContent, count: records.length };
}
