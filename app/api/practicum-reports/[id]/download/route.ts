import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { PracticumReportService } from '@/features/practicum-reports/service';
import { getSession } from '@/lib/auth';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';
import path from 'path';
import fs from 'fs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth check
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const reportId = parseInt(id);
        if (isNaN(reportId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Fetch report with full details (module title, lecturer identifier, etc.)
        const report = await PracticumReportService.getByIdWithDetails(reportId);
        if (!report) {
            return NextResponse.json({ error: 'Berita acara tidak ditemukan' }, { status: 404 });
        }

        // Only allow download for verified reports
        if (report.status !== 'Diverifikasi') {
            return NextResponse.json(
                { error: 'Berita acara belum diverifikasi' },
                { status: 403 }
            );
        }

        // Check access:
        // - Admin or anyone with practicum.manage (e.g. Dosen) can download any
        // - Otherwise, only the creator of the report can download their own
        const userRole = session.user.role;
        const userId = session.user.identifier;
        if (
            userRole !== 'Admin' &&
            !session.user.permissions?.includes('practicum.manage') &&
            report.createdBy !== userId
        ) {
            return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
        }

        // Get logo path (use the lab/faculty logo if available)
        let logoUrl: string | undefined;
        try {
            const logoPath = path.join(process.cwd(), 'public', 'fst-icon.png');
            if (fs.existsSync(logoPath)) {
                logoUrl = logoPath;
            }
        } catch {
            // No logo — skip
        }

        // Dynamically import the PDF template to avoid SSR issues
        const { BeritaAcaraPDF } = await import('@/features/practicum-reports/pdf/BeritaAcaraPDF');

        const pdfData = {
            courseName: report.courseName,
            courseCode: report.courseCode,
            lecturerName: report.lecturerName,
            lecturerId: report.lecturerId || undefined,
            assistantName: report.createdByName || report.createdBy,
            assistantId: report.createdBy,
            batch: report.batch,
            roomName: report.roomName,
            practicumDate: report.practicumDate,
            startTime: report.startTime,
            endTime: report.endTime,
            moduleTitle: report.moduleName || undefined,
            attendeeCount: Number(report.attendeeCount),
            condition: report.condition as 'Lancar' | 'Kurang Lancar' | 'Terkendala',
            description: report.description,
            issues: report.issues,
            followUp: report.followUp,
            verifiedByName: report.verifiedByName,
            verifiedById: report.verifiedBy,
        };

        const buffer = await renderToBuffer(
            React.createElement(BeritaAcaraPDF, { data: pdfData, logoUrl }) as any
        );

        const filename = `berita-acara-${report.courseCode}-${report.createdBy}-${reportId}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, '-');

        const uint8 = new Uint8Array(buffer);

        await writeActivityLog({
            module: 'practicum_reports',
            action: 'download_pdf',
            entityType: 'practicum_report',
            entityId: reportId,
            description: 'User mengunduh PDF berita acara praktikum',
            metadata: { reportId, filename },
        });

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': uint8.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error generating berita acara PDF:', error);
        await writeActivityLog({
            module: 'practicum_reports',
            action: 'download_pdf',
            entityType: 'practicum_report',
            status: 'failed',
            description: 'Gagal mengunduh PDF berita acara praktikum',
            metadata: { error: getErrorMessage(error) },
        });
        return NextResponse.json(
            { error: 'Gagal generate PDF: ' + error.message },
            { status: 500 }
        );
    }
}
