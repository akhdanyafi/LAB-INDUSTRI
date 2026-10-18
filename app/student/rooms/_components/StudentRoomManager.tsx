'use client';

import { useState } from 'react';
import { CalendarDays, ClipboardList, MapPin, Clock, CheckCircle, XCircle, MessageSquare, LayoutGrid, List } from 'lucide-react';
import RoomBookingClient from '@/features/bookings/components/RoomBookingClient';

interface StudentRoomManagerProps {
    rooms: any[];
    myBookings: any[];
    calendarBookings: any[];
    practicumSchedules: any[];
    userId: string;
    role?: 'student' | 'lecturer';
}

export default function StudentRoomManager({
    rooms,
    myBookings,
    calendarBookings,
    practicumSchedules,
    userId,
    role = 'student'
}: StudentRoomManagerProps) {
    const [activeTab, setActiveTab] = useState<'booking' | 'history'>('booking');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            'Pending': 'bg-yellow-50 text-yellow-700',
            'Disetujui': 'bg-green-50 text-green-700',
            'Ditolak': 'bg-red-50 text-red-700',
            'Selesai': 'bg-blue-50 text-blue-700',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-700';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4" />;
            case 'Disetujui': return <CheckCircle className="w-4 h-4" />;
            case 'Ditolak': return <XCircle className="w-4 h-4" />;
            case 'Selesai': return <CheckCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-full max-w-full overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('booking')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'booking'
                        ? 'bg-white text-[#0F4C81] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    Pesan Ruangan
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'history'
                        ? 'bg-white text-[#0F4C81] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    Riwayat Booking
                    {myBookings.filter(b => b.status === 'Pending').length > 0 && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                            {myBookings.filter(b => b.status === 'Pending').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'booking' && (
                    <RoomBookingClient
                        rooms={rooms}
                        calendarBookings={calendarBookings}
                        practicumSchedules={practicumSchedules}
                        userId={userId}
                        userRole={role === 'lecturer' ? 'Dosen' : 'Mahasiswa'}
                    />
                )}

                {activeTab === 'history' && (
                    <>
                        {/* View Toggle — desktop only */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="px-2">
                                <h3 className="font-semibold text-gray-900">Riwayat Pengajuan Booking</h3>
                            </div>
                            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan Grid"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan List"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Table View — desktop only in list mode */}
                            {viewMode === 'list' && (
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Ruangan</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Tanggal & Waktu</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Keperluan</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {myBookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#0F4C81]/10 flex items-center justify-center shrink-0">
                                                            <MapPin className="w-4 h-4 text-[#0F4C81]" />
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-sm">{booking.room.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">
                                                    <div className="font-medium">{new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                                        {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm max-w-xs">
                                                    <p className="line-clamp-2" title={booking.purpose}>{booking.purpose}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${getStatusBadge(booking.status!)}`}>
                                                        {getStatusIcon(booking.status!)}
                                                        {booking.status}
                                                    </span>
                                                    {booking.status === 'Ditolak' && booking.rejectionReason && (
                                                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 max-w-xs">
                                                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                            <span>{booking.rejectionReason}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {myBookings.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    Belum ada riwayat booking ruangan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            )}

                            {/* Grid/Card View — always on mobile, desktop only in grid mode */}
                            <div className={`p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${viewMode === 'grid' ? 'grid' : 'grid md:hidden'}`}>
                                {myBookings.map((booking) => (
                                    <div key={booking.id} className="bg-white border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#0F4C81]/10 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-5 h-5 text-[#0F4C81]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 break-words">{booking.room.name}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${getStatusBadge(booking.status!)}`}>
                                                {getStatusIcon(booking.status!)}
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                                            <div className="text-gray-700 font-medium">
                                                {new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                            </div>
                                            {booking.purpose && (
                                                <p className="text-xs text-gray-600 line-clamp-2 pt-1 border-t border-gray-200" title={booking.purpose}>
                                                    {booking.purpose}
                                                </p>
                                            )}
                                        </div>

                                        {booking.status === 'Ditolak' && booking.rejectionReason && (
                                            <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                <span>{booking.rejectionReason}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {myBookings.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-500 border rounded-xl border-dashed">
                                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        Belum ada riwayat booking ruangan.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
