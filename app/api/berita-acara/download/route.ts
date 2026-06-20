import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/db';
import { practicumReports, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { writeActivityLog } from '@/lib/audit';

function getDateRange(type: string, refDate: string) {
    const base = refDate ? new Date(refDate) : new Date();

    if (type === 'harian') {
        const start = new Date(base);
        start.setHours(0, 0, 0, 0);
        const end = new Date(base);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    if (type === 'mingguan') {
        const day = base.getDay(); // 0=Sun
        const diffToMon = day === 0 ? -6 : 1 - day;
        const start = new Date(base);
        start.setDate(base.getDate() + diffToMon);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    if (type === 'bulanan') {
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }

    // Custom: expect startDate & endDate query params
    return null;
}

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('period') || 'bulanan'; // harian | mingguan | bulanan | custom
    const refDate = searchParams.get('date') || new Date().toISOString();
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;

    if (periodType === 'custom' && startParam && endParam) {
        startDate = new Date(startParam);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(endParam);
        endDate.setHours(23, 59, 59, 999);
    } else {
        const range = getDateRange(periodType, refDate);
        if (!range) {
            return NextResponse.json({ error: 'Parameter periode tidak valid' }, { status: 400 });
        }
        startDate = range.start;
        endDate = range.end;
    }

    const userId = session.user.identifier;
    const isAdmin = session.user.roleId === 1;
    const isLecturer = session.user.roleId === 2;

    // Admin: semua laporan; Dosen: laporan di matakuliah yang diajar; User biasa: laporan milik sendiri
    let reports: any[];

    if (isAdmin) {
        reports = await db
            .select({
                id: practicumReports.id,
                courseName: practicumReports.courseName,
                courseCode: practicumReports.courseCode,
                lecturerName: practicumReports.lecturerName,
                roomName: practicumReports.roomName,
                practicumDate: practicumReports.practicumDate,
                startTime: practicumReports.startTime,
                endTime: practicumReports.endTime,
                batch: practicumReports.batch,
                attendeeCount: practicumReports.attendeeCount,
                condition: practicumReports.condition,
                description: practicumReports.description,
                issues: practicumReports.issues,
                followUp: practicumReports.followUp,
                status: practicumReports.status,
                rejectionReason: practicumReports.rejectionReason,
                createdAt: practicumReports.createdAt,
                createdByName: users.fullName,
            })
            .from(practicumReports)
            .leftJoin(users, eq(practicumReports.createdBy, users.identifier))
            .where(and(
                gte(practicumReports.practicumDate, startDate),
                lte(practicumReports.practicumDate, endDate)
            ))
            .orderBy(desc(practicumReports.practicumDate));
    } else {
        reports = await db
            .select({
                id: practicumReports.id,
                courseName: practicumReports.courseName,
                courseCode: practicumReports.courseCode,
                lecturerName: practicumReports.lecturerName,
                roomName: practicumReports.roomName,
                practicumDate: practicumReports.practicumDate,
                startTime: practicumReports.startTime,
                endTime: practicumReports.endTime,
                batch: practicumReports.batch,
                attendeeCount: practicumReports.attendeeCount,
                condition: practicumReports.condition,
                description: practicumReports.description,
                issues: practicumReports.issues,
                followUp: practicumReports.followUp,
                status: practicumReports.status,
                rejectionReason: practicumReports.rejectionReason,
                createdAt: practicumReports.createdAt,
                createdByName: users.fullName,
            })
            .from(practicumReports)
            .leftJoin(users, eq(practicumReports.createdBy, users.identifier))
            .where(and(
                eq(practicumReports.createdBy, userId),
                gte(practicumReports.practicumDate, startDate),
                lte(practicumReports.practicumDate, endDate)
            ))
            .orderBy(desc(practicumReports.practicumDate));
    }

    const formatDate = (d: Date | null) => {
        if (!d) return '-';
        const dt = typeof d === 'string' ? new Date(d) : d;
        return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const wsData = [
        [
            'No',
            'Mata Kuliah',
            'Kode MK',
            'Dosen',
            'Ruangan',
            'Tanggal Praktikum',
            'Jam Mulai',
            'Jam Selesai',
            'Angkatan',
            'Jumlah Peserta',
            'Kondisi',
            'Deskripsi',
            'Kendala',
            'Tindak Lanjut',
            'Status',
            'Alasan Penolakan',
            'Dibuat Oleh',
            'Dibuat Pada',
        ],
        ...reports.map((r, i) => [
            i + 1,
            r.courseName,
            r.courseCode,
            r.lecturerName || '-',
            r.roomName,
            formatDate(r.practicumDate),
            r.startTime,
            r.endTime,
            r.batch,
            r.attendeeCount,
            r.condition,
            r.description,
            r.issues || '-',
            r.followUp || '-',
            r.status || 'Pending',
            r.rejectionReason || '-',
            r.createdByName || '-',
            formatDate(r.createdAt),
        ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto column width
    const colWidths = wsData[0].map((_, colIdx) => ({
        wch: Math.max(...wsData.map(row => String(row[colIdx] ?? '').length), 10),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Berita Acara');

    const periodLabel: Record<string, string> = {
        harian: 'Harian',
        mingguan: 'Mingguan',
        bulanan: 'Bulanan',
        custom: 'Kustom',
    };
    const filename = `Berita_Acara_${periodLabel[periodType] || 'Laporan'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await writeActivityLog({
        module: 'practicum_reports',
        action: 'export_xlsx',
        entityType: 'practicum_report',
        description: 'User mengekspor berita acara praktikum XLSX',
        metadata: { periodType, startDate, endDate, count: reports.length, filename },
    });

    return new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
