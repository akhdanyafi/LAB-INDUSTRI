'use client';

import { useState } from 'react';
import { FileText, Eye, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import type { PracticumReport, PracticumReportStatus, PracticumCondition } from '@/features/practicum-reports/types';
import { STATUS_COLORS, CONDITION_COLORS } from '@/features/practicum-reports/types';

interface PracticumReportTableProps {
    reports: PracticumReport[];
}

export default function PracticumReportTable({ reports }: PracticumReportTableProps) {
    const [selectedReport, setSelectedReport] = useState<PracticumReport | null>(null);

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatFullDate = (date: Date | string | null | undefined) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const StatusIcon = ({ status }: { status: PracticumReportStatus | null }) => {
        switch (status) {
            case 'Diverifikasi': return <CheckCircle className="w-4 h-4" />;
            case 'Ditolak': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (reports.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Belum ada berita acara</p>
                <p className="text-gray-400 text-sm mt-1">Berita acara yang Anda isi akan muncul di sini</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kondisi</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                    <p className="font-medium text-gray-900">{report.courseName}</p>
                                    <p className="text-xs text-blue-600 font-medium">{report.courseCode}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{formatDate(report.practicumDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span>{report.startTime} - {report.endTime}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[report.condition as PracticumCondition] || 'bg-gray-100 text-gray-700'}`}>
                                        {report.condition}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[(report.status || 'Pending') as PracticumReportStatus]}`}>
                                        <StatusIcon status={report.status as PracticumReportStatus | null} />
                                        {report.status || 'Pending'}
                                    </span>
                                    {report.status === 'Ditolak' && report.rejectionReason && (
                                        <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate" title={report.rejectionReason}>
                                            {report.rejectionReason}
                                        </p>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Detail
                                        </button>
                                        {report.status === 'Diverifikasi' && (
                                            <a
                                                href={`/api/practicum-reports/${report.id}/download`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Unduh PDF Berita Acara"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Unduh PDF
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Detail Berita Acara</h3>
                                    <p className="text-sm text-blue-600">{selectedReport.courseCode} - {selectedReport.courseName}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[(selectedReport.status || 'Pending') as PracticumReportStatus]}`}>
                                    <StatusIcon status={selectedReport.status as PracticumReportStatus | null} />
                                    {selectedReport.status || 'Pending'}
                                </span>
                            </div>

                            {selectedReport.status === 'Ditolak' && selectedReport.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-700">Alasan Penolakan:</p>
                                    <p className="text-sm text-red-600 mt-1">{selectedReport.rejectionReason}</p>
                                </div>
                            )}

                            {/* Info Jadwal */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Informasi Jadwal</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{formatFullDate(selectedReport.practicumDate)}</span></div>
                                    <div><span className="text-gray-500">Waktu:</span> <span className="font-medium">{selectedReport.startTime} - {selectedReport.endTime}</span></div>
                                    <div><span className="text-gray-500">Ruangan:</span> <span className="font-medium">{selectedReport.roomName}</span></div>
                                    <div><span className="text-gray-500">Dosen:</span> <span className="font-medium">{selectedReport.lecturerName || '-'}</span></div>
                                </div>
                            </div>

                            {/* Isi Berita Acara */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-gray-500">Angkatan:</span> <span className="font-medium ml-1">{selectedReport.batch}</span></div>
                                    <div><span className="text-gray-500">Jumlah Hadir:</span> <span className="font-medium ml-1">{selectedReport.attendeeCount} orang</span></div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Kondisi: </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-1 ${CONDITION_COLORS[selectedReport.condition as PracticumCondition]}`}>
                                            {selectedReport.condition}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Pelaksanaan</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
                                </div>
                                {selectedReport.issues && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kendala</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.issues}</p>
                                    </div>
                                )}
                                {selectedReport.followUp && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tindak Lanjut</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.followUp}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                                {selectedReport.status === 'Diverifikasi' && (
                                    <a
                                        href={`/api/practicum-reports/${selectedReport.id}/download`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Unduh PDF
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
