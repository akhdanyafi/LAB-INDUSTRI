'use client';

import { useState, useTransition } from 'react';
import { FileText, Eye, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Check, X, Trash2, AlertTriangle, Download } from 'lucide-react';
import type { PracticumReportWithDetails, PracticumReportStatus, PracticumCondition } from '@/features/practicum-reports/types';
import { lecturerVerifyPracticumReport, lecturerDeletePracticumReport } from '@/features/practicum-reports/actions';
import { useRouter } from 'next/navigation';
import ViewportPortal from '@/components/shared/ViewportPortal';

interface LecturerPracticumReportTableProps {
    reports: PracticumReportWithDetails[];
}

const statusColors: Record<PracticumReportStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Diverifikasi': 'bg-green-100 text-green-800',
    'Ditolak': 'bg-red-100 text-red-800',
};

const conditionColors: Record<PracticumCondition, string> = {
    'Lancar': 'bg-green-100 text-green-800',
    'Kurang Lancar': 'bg-yellow-100 text-yellow-800',
    'Terkendala': 'bg-red-100 text-red-800',
};

const StatusIcon = ({ status }: { status: PracticumReportStatus }) => {
    switch (status) {
        case 'Diverifikasi': return <CheckCircle className="w-4 h-4" />;
        case 'Ditolak': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
    }
};

export default function LecturerPracticumReportTable({ reports }: LecturerPracticumReportTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedReport, setSelectedReport] = useState<PracticumReportWithDetails | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<PracticumReportWithDetails | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    const formatDateTime = (date: Date | string | null | undefined) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleVerify = (report: PracticumReportWithDetails) => {
        startTransition(async () => {
            const result = await lecturerVerifyPracticumReport(report.id, { status: 'Diverifikasi' });
            if (result.success) {
                setMessage({ type: 'success', text: 'Berita acara berhasil diverifikasi!' });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal memverifikasi berita acara' });
            }
        });
    };

    const handleReject = () => {
        if (!selectedReport || !rejectionReason.trim()) return;
        startTransition(async () => {
            const result = await lecturerVerifyPracticumReport(selectedReport.id, { status: 'Ditolak', rejectionReason: rejectionReason.trim() });
            if (result.success) {
                setMessage({ type: 'success', text: 'Berita acara berhasil ditolak!' });
                setShowRejectModal(false);
                setSelectedReport(null);
                setRejectionReason('');
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal menolak berita acara' });
            }
        });
    };

    const openRejectModal = (report: PracticumReportWithDetails) => { setSelectedReport(report); setRejectionReason(''); setShowRejectModal(true); };
    const openDeleteModal = (report: PracticumReportWithDetails) => { setReportToDelete(report); setShowDeleteModal(true); };

    const handleDelete = () => {
        if (!reportToDelete) return;
        startTransition(async () => {
            const result = await lecturerDeletePracticumReport(reportToDelete.id);
            if (result.success) {
                setMessage({ type: 'success', text: 'Berita acara berhasil dihapus!' });
                setShowDeleteModal(false);
                setReportToDelete(null);
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal menghapus berita acara' });
            }
        });
    };

    if (reports.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-9 h-9 text-gray-400" />
                </div>
                <h3 className="text-gray-600 font-medium text-lg">Belum ada berita acara</h3>
                <p className="text-sm text-gray-400 mt-1">Berita acara dari mahasiswa untuk matakuliah Anda akan muncul di sini</p>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal Praktikum</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Matakuliah</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dibuat Oleh</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ruangan</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Angkatan</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Hadir</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Kondisi</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">{formatDate(report.practicumDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-300" />
                                        <span className="text-xs text-gray-500">{report.startTime} - {report.endTime}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{report.courseCode}</div>
                                    <div className="text-xs text-gray-500 max-w-[200px] truncate">{report.courseName}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm text-gray-900">{report.createdByName || report.createdBy}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm text-gray-900">{report.roomName}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm text-gray-900">{report.batch}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">{report.attendeeCount}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${conditionColors[report.condition as PracticumCondition]}`}>
                                        {report.condition}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[(report.status || 'Pending') as PracticumReportStatus]}`}>
                                        <StatusIcon status={(report.status || 'Pending') as PracticumReportStatus} />
                                        {report.status || 'Pending'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setSelectedReport(report)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {report.status === 'Diverifikasi' && (
                                            <a
                                                href={`/api/practicum-reports/${report.id}/download`}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Unduh PDF Berita Acara"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        )}
                                        {(report.status === 'Pending' || !report.status) && (
                                            <>
                                                <button onClick={() => handleVerify(report)} disabled={isPending} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Verifikasi">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openRejectModal(report)} disabled={isPending} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Tolak">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => openDeleteModal(report)} disabled={isPending} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" title="Hapus">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedReport && !showRejectModal && (
                <ViewportPortal>
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
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${statusColors[(selectedReport.status || 'Pending') as PracticumReportStatus]}`}>
                                    <StatusIcon status={(selectedReport.status || 'Pending') as PracticumReportStatus} />
                                    <div>
                                        <span className="font-medium">Status: {selectedReport.status || 'Pending'}</span>
                                        {selectedReport.status === 'Ditolak' && selectedReport.rejectionReason && (
                                            <p className="text-sm mt-0.5">Alasan: {selectedReport.rejectionReason}</p>
                                        )}
                                        {selectedReport.status === 'Diverifikasi' && selectedReport.verifiedAt && (
                                            <p className="text-sm mt-0.5">Diverifikasi pada {formatDateTime(selectedReport.verifiedAt)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-purple-700 mb-2">Informasi Pembuat</h4>
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{selectedReport.createdByName}</span>
                                        <span className="text-gray-500 ml-2">({selectedReport.createdBy})</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Dibuat pada: {formatDateTime(selectedReport.createdAt)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Informasi Jadwal</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-2 text-sm">
                                            <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="text-gray-500">Matakuliah</span>
                                                <p className="font-medium text-gray-900">{selectedReport.courseCode} - {selectedReport.courseName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="text-gray-500">Hari/Tanggal</span>
                                                <p className="font-medium text-gray-900">{formatFullDate(selectedReport.practicumDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="text-gray-500">Waktu</span>
                                                <p className="font-medium text-gray-900">{selectedReport.startTime} - {selectedReport.endTime}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <Users className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <span className="text-gray-500">Ruang Lab</span>
                                                <p className="font-medium text-gray-900">{selectedReport.roomName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-700">Informasi Pelaksanaan</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <span className="text-xs text-gray-500">Angkatan</span>
                                            <p className="font-semibold text-gray-900 mt-0.5">{selectedReport.batch}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <span className="text-xs text-gray-500">Mahasiswa Hadir</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold text-gray-900">{selectedReport.attendeeCount} orang</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <span className="text-xs text-gray-500">Kondisi</span>
                                            <div className="mt-0.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${conditionColors[selectedReport.condition as PracticumCondition]}`}>
                                                    {selectedReport.condition}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Deskripsi Pelaksanaan</span>
                                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selectedReport.description}</p>
                                    </div>
                                    {selectedReport.issues && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Kendala</span>
                                            <p className="mt-1 text-sm text-gray-600 bg-yellow-50 rounded-lg p-3 whitespace-pre-wrap border border-yellow-100">{selectedReport.issues}</p>
                                        </div>
                                    )}
                                    {selectedReport.followUp && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Tindak Lanjut</span>
                                            <p className="mt-1 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap border border-blue-100">{selectedReport.followUp}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                                {selectedReport.status === 'Diverifikasi' && (
                                    <a
                                        href={`/api/practicum-reports/${selectedReport.id}/download`}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Unduh PDF
                                    </a>
                                )}
                                {(selectedReport.status === 'Pending' || !selectedReport.status) && (
                                    <>
                                        <button onClick={() => handleVerify(selectedReport)} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                                            <Check className="w-4 h-4" />
                                            {isPending ? 'Memproses...' : 'Verifikasi'}
                                        </button>
                                        <button onClick={() => setShowRejectModal(true)} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                                            <X className="w-4 h-4" />
                                            Tolak
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedReport(null)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </ViewportPortal>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedReport && (
                <ViewportPortal>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Tolak Berita Acara</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedReport.courseCode} - {selectedReport.courseName}</p>
                            </div>
                            <div className="p-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alasan Penolakan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    placeholder="Tuliskan alasan penolakan berita acara..."
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                                />
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                                <button onClick={handleReject} disabled={isPending || !rejectionReason.trim()} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <X className="w-4 h-4" />
                                    {isPending ? 'Memproses...' : 'Konfirmasi Tolak'}
                                </button>
                                <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} disabled={isPending} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </ViewportPortal>
            )}

            {/* Delete Modal */}
            {showDeleteModal && reportToDelete && (
                <ViewportPortal>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Hapus Berita Acara</h3>
                                        <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus berita acara untuk:</p>
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900">{reportToDelete.courseCode} - {reportToDelete.courseName}</p>
                                    <p className="text-sm text-gray-500 mt-1">{formatDate(reportToDelete.practicumDate)} | {reportToDelete.startTime} - {reportToDelete.endTime}</p>
                                    <p className="text-sm text-gray-500">Dibuat oleh: {reportToDelete.createdByName || reportToDelete.createdBy}</p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                                <button onClick={handleDelete} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" />
                                    {isPending ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                                <button onClick={() => { setShowDeleteModal(false); setReportToDelete(null); }} disabled={isPending} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </ViewportPortal>
            )}
        </>
    );
}
