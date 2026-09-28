'use client';

import { useState, useTransition } from 'react';
import { FileText, Eye, CheckCircle, XCircle, AlertCircle, Trash2, Check, X, AlertTriangle, Calendar, Clock, Users, Download } from 'lucide-react';
import type { PracticumReportWithDetails, PracticumReportStatus, PracticumCondition } from '@/features/practicum-reports/types';
import { STATUS_COLORS, CONDITION_COLORS } from '@/features/practicum-reports/types';
import { verifyPracticumReport, deletePracticumReport, deleteAllPracticumReports } from '@/features/practicum-reports/actions';
import { useRouter } from 'next/navigation';

interface AdminPracticumReportTableProps {
    reports: PracticumReportWithDetails[];
}

const StatusIcon = ({ status }: { status: PracticumReportStatus | null }) => {
    switch (status) {
        case 'Diverifikasi': return <CheckCircle className="w-4 h-4" />;
        case 'Ditolak': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
    }
};

export default function AdminPracticumReportTable({ reports }: AdminPracticumReportTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedReport, setSelectedReport] = useState<PracticumReportWithDetails | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
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

    const handleVerify = (report: PracticumReportWithDetails) => {
        startTransition(async () => {
            const result = await verifyPracticumReport(report.id, { status: 'Diverifikasi' });
            if (result.success) {
                setMessage({ type: 'success', text: 'Berita acara berhasil diverifikasi!' });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal memverifikasi' });
            }
        });
    };

    const handleReject = () => {
        if (!selectedReport || !rejectionReason.trim()) return;
        startTransition(async () => {
            const result = await verifyPracticumReport(selectedReport.id, {
                status: 'Ditolak',
                rejectionReason: rejectionReason.trim(),
            });
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

    const handleDelete = () => {
        if (!reportToDelete) return;
        startTransition(async () => {
            const result = await deletePracticumReport(reportToDelete.id);
            if (result.success) {
                setMessage({ type: 'success', text: 'Berita acara berhasil dihapus!' });
                setShowDeleteModal(false);
                setReportToDelete(null);
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal menghapus' });
            }
        });
    };

    const handleDeleteAll = () => {
        startTransition(async () => {
            const result = await deleteAllPracticumReports();
            if (result.success) {
                setMessage({ type: 'success', text: 'Semua berita acara berhasil dihapus!' });
                setShowDeleteAllModal(false);
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal menghapus semua berita acara' });
            }
        });
    };

    if (reports.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Belum ada berita acara</p>
                <p className="text-gray-400 text-sm mt-1">Berita acara akan muncul setelah asisten praktikum mengisi form</p>
            </div>
        );
    }

    return (
        <>
            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{reports.length} berita acara ditemukan</p>
                <button
                    onClick={() => setShowDeleteAllModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Semua
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Kuliah</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengisi</th>
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
                                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {formatDate(report.practicumDate)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {report.startTime} - {report.endTime}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <p className="text-sm text-gray-700">{report.createdByName || report.createdBy}</p>
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
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {report.status === 'Diverifikasi' && (
                                            <a
                                                href={`/api/practicum-reports/${report.id}/download`}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Unduh PDF Berita Acara"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {(report.status === 'Pending' || report.status === 'Ditolak') && (
                                            <button
                                                onClick={() => handleVerify(report)}
                                                disabled={isPending}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Verifikasi"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {(report.status === 'Pending' || report.status === 'Diverifikasi') && (
                                            <button
                                                onClick={() => { setSelectedReport(report); setShowRejectModal(true); }}
                                                disabled={isPending}
                                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Tolak"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setReportToDelete(report); setShowDeleteModal(true); }}
                                            disabled={isPending}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[(selectedReport.status || 'Pending') as PracticumReportStatus]}`}>
                                    <StatusIcon status={selectedReport.status as PracticumReportStatus | null} />
                                    {selectedReport.status || 'Pending'}
                                </span>
                                {selectedReport.verifiedByName && (
                                    <span className="text-xs text-gray-500">oleh {selectedReport.verifiedByName}</span>
                                )}
                            </div>

                            {selectedReport.status === 'Ditolak' && selectedReport.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-700">Alasan Penolakan:</p>
                                    <p className="text-sm text-red-600 mt-1">{selectedReport.rejectionReason}</p>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Informasi Jadwal</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{formatFullDate(selectedReport.practicumDate)}</span></div>
                                    <div><span className="text-gray-500">Waktu:</span> <span className="font-medium">{selectedReport.startTime} - {selectedReport.endTime}</span></div>
                                    <div><span className="text-gray-500">Ruangan:</span> <span className="font-medium">{selectedReport.roomName}</span></div>
                                    <div><span className="text-gray-500">Dosen:</span> <span className="font-medium">{selectedReport.lecturerName || '-'}</span></div>
                                    <div><span className="text-gray-500">Pengisi:</span> <span className="font-medium">{selectedReport.createdByName || selectedReport.createdBy}</span></div>
                                </div>
                            </div>

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

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {selectedReport.status === 'Diverifikasi' && (
                                    <a
                                        href={`/api/practicum-reports/${selectedReport.id}/download`}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        Unduh PDF
                                    </a>
                                )}
                                {(selectedReport.status === 'Pending' || selectedReport.status === 'Ditolak') && (
                                    <button
                                        onClick={() => { handleVerify(selectedReport); setSelectedReport(null); }}
                                        disabled={isPending}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4" />
                                        Verifikasi
                                    </button>
                                )}
                                {(selectedReport.status === 'Pending' || selectedReport.status === 'Diverifikasi') && (
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isPending}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4" />
                                        Tolak
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[130] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Tolak Berita Acara</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {selectedReport.courseCode} - {selectedReport.courseName}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Tuliskan alasan penolakan..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleReject}
                                disabled={isPending || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? 'Menolak...' : 'Tolak'}
                            </button>
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteModal && reportToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[130] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Hapus Berita Acara?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Berita acara <strong>{reportToDelete.courseCode} - {reportToDelete.courseName}</strong> akan dihapus permanen.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? 'Menghapus...' : 'Hapus'}
                            </button>
                            <button
                                onClick={() => { setShowDeleteModal(false); setReportToDelete(null); }}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Confirm Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[130] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Hapus Semua?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Semua <strong>{reports.length} berita acara</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAll}
                                disabled={isPending}
                                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? 'Menghapus...' : 'Hapus Semua'}
                            </button>
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
