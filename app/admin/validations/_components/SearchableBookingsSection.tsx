'use client';

import { useState, useMemo, useTransition } from 'react';
import { User, CheckCircle, XCircle, Search, X, MapPin } from 'lucide-react';
import { updateBookingStatus } from '@/features/bookings/actions';
import RejectReasonModal from '@/components/ui/RejectReasonModal';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';

interface Booking {
    id: number;
    status: string | null;
    startTime: Date;
    endTime: Date;
    purpose: string | null;
    user: {
        fullName: string;
        identifier: string;
    };
    room: {
        name: string;
    };
}

interface SearchableBookingsProps {
    bookings: Booking[];
    sessionUserId: string;
}

export default function SearchableBookingsSection({ bookings, sessionUserId }: SearchableBookingsProps) {
    const { showAlert } = useAlert();
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null);

    // Filter active bookings (Pending + Disetujui)
    const activeBookings = useMemo(() => {
        return bookings.filter(b => b.status === 'Pending' || b.status === 'Disetujui');
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (!searchQuery) return activeBookings;
        const query = searchQuery.toLowerCase();
        return activeBookings.filter(booking =>
            booking.user.fullName.toLowerCase().includes(query) ||
            booking.user.identifier.toLowerCase().includes(query) ||
            booking.room.name.toLowerCase().includes(query) ||
            (booking.purpose && booking.purpose.toLowerCase().includes(query))
        );
    }, [activeBookings, searchQuery]);

    const pendingCount = activeBookings.filter(b => b.status === 'Pending').length;
    const approvedCount = activeBookings.filter(b => b.status === 'Disetujui').length;

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
            }
        });
    };

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{pendingCount}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Aktif</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama pemohon atau ruangan..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-sm text-gray-500 mt-2">
                        Menampilkan {filteredBookings.length} dari {activeBookings.length} booking
                    </p>
                )}
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
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
                            {filteredBookings.map((booking) => (
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
                                            <p className="font-medium text-gray-900">{booking.room.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        <div>{new Date(booking.startTime).toLocaleDateString('id-ID')}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm max-w-[200px] truncate">
                                        {booking.purpose || '-'}
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
                                        {booking.status === 'Pending' && (
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleApprove(booking.id)}
                                                    disabled={isPending}
                                                    className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(booking.id)}
                                                    disabled={isPending}
                                                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {booking.status === 'Disetujui' && (
                                            <span className="text-gray-400 text-sm">Aktif</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada permintaan booking.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <RejectReasonModal
                isOpen={rejectModalOpen}
                onClose={() => { setRejectModalOpen(false); setRejectingBookingId(null); }}
                onConfirm={handleRejectConfirm}
                title="Tolak Booking Ruangan"
                isPending={isPending}
            />
        </div>
    );
}
