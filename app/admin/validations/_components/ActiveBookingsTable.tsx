'use client';

import { useState, useTransition } from 'react';
import { MapPin, User, CheckCircle, XCircle, Eye, X, ExternalLink, LayoutGrid, List, Trash2 } from 'lucide-react';
import { updateBookingStatus, deleteBooking } from '@/features/bookings/actions';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';
import RejectReasonModal from '@/components/ui/RejectReasonModal';

interface Booking {
    id: number;
    status: string | null;
    startTime: Date;
    endTime: Date;
    purpose: string;
    organisasi?: string | null;
    jumlahPeserta?: number | null;
    dosenPembimbing?: string | null;
    suratPermohonan?: string | null;
    user: { fullName: string; identifier: string; phoneNumber?: string | null; };
    room: { name: string; };
}

interface ActiveBookingsTableProps {
    bookings: Booking[];
    sessionUserId: string;
}

export default function ActiveBookingsTable({ bookings, sessionUserId }: ActiveBookingsTableProps) {
    const { showAlert, showConfirm } = useAlert();
    const [isPending, startTransition] = useTransition();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });

    const handleApprove = (bookingId: number) => {
        startTransition(async () => {
            const result = await updateBookingStatus(bookingId, 'Disetujui', sessionUserId);
            if (!result?.success) {
                const { title, message } = translateError(result?.error, 'Gagal menyetujui booking');
                showAlert({ title, message, type: 'error' });
            }
        });
    };

    const handleReject = (bookingId: number) => {
        setRejectingBookingId(bookingId);
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = (reason: string) => {
        if (rejectingBookingId === null) return;
        const bookingId = rejectingBookingId;
        setRejectModalOpen(false);
        setRejectingBookingId(null);
        startTransition(async () => {
            const result = await updateBookingStatus(bookingId, 'Ditolak', sessionUserId, reason || undefined);
            if (!result?.success) {
                const { title, message } = translateError(result?.error, 'Gagal menolak booking');
                showAlert({ title, message, type: 'error' });
                return;
            }
            showAlert({ title: 'Berhasil', message: 'Permintaan booking ditolak', type: 'success' });
        });
    };

    const handleDelete = async (bookingId: number) => {
        const confirmed = await showConfirm({
            title: 'Hapus Booking',
            message: 'Apakah Anda yakin ingin menghapus booking ini? Data tidak dapat dikembalikan.',
            type: 'danger',
            confirmText: 'Hapus'
        });
        if (confirmed) {
            startTransition(async () => {
                const result = await deleteBooking(bookingId);
                if (!result?.success) {
                    const { title, message } = translateError(result?.error, 'Gagal menghapus booking');
                    showAlert({ title, message, type: 'error' });
                    return;
                }
                showAlert({ title: 'Berhasil', message: 'Booking berhasil dihapus', type: 'success' });
            });
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`} title="Tampilan Grid">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`} title="Tampilan List">
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {/* Users List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table View (Hidden on mobile, toggled on desktop) */}
                {viewMode === 'list' && (
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Pemohon</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Ruangan</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Tanggal & Waktu</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Keperluan</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${isPending ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">{booking.user.fullName}</p>
                                            <p className="text-xs text-gray-500">{booking.user.identifier}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#0F4C81]" />
                                        <span className="font-medium text-gray-900">{booking.room.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    <div>{new Date(booking.startTime).toLocaleDateString('id-ID')}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                                    {booking.purpose}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${booking.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                                        booking.status === 'Disetujui' ? 'bg-green-50 text-green-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-1">
                                        {/* View Details Button */}
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="text-[#0F4C81] hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {booking.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(booking.id)}
                                                    disabled={isPending}
                                                    className="text-green-600 hover:text-green-700 p-1.5 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Setujui"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(booking.id)}
                                                    disabled={isPending}
                                                    className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Tolak"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(booking.id)}
                                            disabled={isPending}
                                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Belum ada permintaan booking.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
                )}

                {/* Grid/Card View — always on mobile, desktop only in grid mode */}
                <div className={`p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${viewMode === 'grid' ? 'grid' : 'grid md:hidden'}`}>
                        {bookings.map((booking) => (
                            <div key={booking.id} className={`bg-white border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow ${isPending ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 break-words" title={booking.room.name}>{booking.room.name}</p>
                                            <p className="text-xs text-gray-500 break-words" title={booking.purpose}>{booking.purpose}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                        booking.status === 'Disetujui' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="break-words" title={booking.user.fullName}>{booking.user.fullName} ({booking.user.identifier})</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-600 pt-1 border-t border-gray-200">
                                        <span>{new Date(booking.startTime).toLocaleDateString('id-ID')}</span>
                                        <span>
                                            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-auto pt-2">
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="flex-1 flex justify-center items-center gap-1 text-[#0F4C81] bg-blue-50 hover:bg-blue-100 py-2 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Detail
                                    </button>
                                    
                                    {booking.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(booking.id)}
                                                disabled={isPending}
                                                className="flex-1 flex justify-center items-center gap-1 text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> Setuju
                                            </button>
                                            <button
                                                onClick={() => handleReject(booking.id)}
                                                disabled={isPending}
                                                className="flex-1 flex justify-center items-center gap-1 text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Tolak
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(booking.id)}
                                        disabled={isPending}
                                        className="flex justify-center items-center gap-1 text-red-500 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {bookings.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 border rounded-xl border-dashed">
                                Belum ada permintaan booking.
                            </div>
                        )}
                </div>
            </div>

            {/* Modal Detail Booking */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#0F4C81]" />
                                Detail Booking Ruangan
                            </h3>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Data Pemohon */}
                            <div>
                                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Data Pemesan</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Nama Lengkap</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.user.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">NIM / Identifier</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.user.identifier}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Nomor HP</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.user.phoneNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Dosen Pembimbing</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.dosenPembimbing || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Booking */}
                            <div>
                                <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Detail Booking</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Ruangan</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.room.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Tanggal</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(selectedBooking.startTime).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Waktu</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(selectedBooking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            {' s.d '}
                                            {new Date(selectedBooking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Jumlah Peserta</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.jumlahPeserta || '-'} Orang</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Organisasi / Unit</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.organisasi || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gray-500">Keperluan</p>
                                        <p className="font-medium text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedBooking.purpose}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dokumen */}
                            {selectedBooking.suratPermohonan && (
                                <div>
                                    <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Dokumen Tambahan</h4>
                                    <div className="text-sm border border-gray-100 p-4 rounded-xl bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ExternalLink className="w-5 h-5 text-gray-400" />
                                            <span className="font-medium text-gray-900">Surat Permohonan / Izin</span>
                                        </div>
                                        <a href={selectedBooking.suratPermohonan} target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:underline font-medium">Buka File</a>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <RejectReasonModal
                isOpen={rejectModalOpen}
                onClose={() => { setRejectModalOpen(false); setRejectingBookingId(null); }}
                onConfirm={handleRejectConfirm}
                title="Tolak Booking Ruangan"
                isPending={isPending}
            />
        </>
    );
}
