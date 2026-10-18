import { getLoanRequests } from '@/features/loans/actions';
import { getBookingRequests } from '@/features/bookings/actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Box, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function RiwayatPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getSession();
    if (!session) redirect('/login');

    const params = await searchParams;
    const activeTab = (params.tab as string) || 'loans';

    // Fetch all loans and bookings
    const [loans, bookings] = await Promise.all([
        getLoanRequests(),
        getBookingRequests()
    ]);

    // Filter logic based on search params
    const startDate = params.startDate as string | undefined;
    const endDate = params.endDate as string | undefined;
    const statusFilter = params.status as string | undefined;

    let filteredLoans = loans;
    let filteredBookings = bookings;

    // Apply date filters
    if (startDate) {
        const start = new Date(startDate);
        filteredLoans = filteredLoans.filter(l => l.requestDate && new Date(l.requestDate) >= start);
        filteredBookings = filteredBookings.filter(b => new Date(b.startTime) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        filteredLoans = filteredLoans.filter(l => l.requestDate && new Date(l.requestDate) <= end);
        filteredBookings = filteredBookings.filter(b => new Date(b.startTime) <= end);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
        filteredLoans = filteredLoans.filter(l => l.status === statusFilter);
        filteredBookings = filteredBookings.filter(b => b.status === statusFilter);
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat</h1>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <form className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            name="startDate"
                            defaultValue={startDate}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            name="endDate"
                            defaultValue={endDate}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            defaultValue={statusFilter || 'all'}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Disetujui">Disetujui</option>
                            <option value="Ditolak">Ditolak</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>
                    <input type="hidden" name="tab" value={activeTab} />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#0F4C81] text-white rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors"
                    >
                        Filter
                    </button>
                    <Link
                        href={`/admin/riwayat?tab=${activeTab}`}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Reset
                    </Link>
                </form>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <Link
                    href="/admin/riwayat?tab=loans"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'loans'
                        ? 'bg-[#0F4C81] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Riwayat Peminjaman
                </Link>
                <Link
                    href="/admin/riwayat?tab=bookings"
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'bookings'
                        ? 'bg-[#0F4C81] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Riwayat Booking
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total</h3>
                    <p className="text-3xl font-bold text-[#0F4C81] mt-2">
                        {activeTab === 'loans' ? filteredLoans.length : filteredBookings.length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">
                        {activeTab === 'loans'
                            ? filteredLoans.filter(l => l.status === 'Pending').length
                            : filteredBookings.filter(b => b.status === 'Pending').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Disetujui</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {activeTab === 'loans'
                            ? filteredLoans.filter(l => l.status === 'Disetujui').length
                            : filteredBookings.filter(b => b.status === 'Disetujui').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Ditolak</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        {activeTab === 'loans'
                            ? filteredLoans.filter(l => l.status === 'Ditolak').length
                            : filteredBookings.filter(b => b.status === 'Ditolak').length}
                    </p>
                </div>
            </div>

            {/* Loans Table */}
            {activeTab === 'loans' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Mahasiswa</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Alat</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Tanggal Pinjam</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{loan.student.fullName}</p>
                                                    <p className="text-xs text-gray-500">{loan.student.identifier}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Box className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-900">{loan.item.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600" suppressHydrationWarning>
                                            {loan.requestDate ? new Date(loan.requestDate).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${loan.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : loan.status === 'Disetujui'
                                                        ? 'bg-green-100 text-green-700'
                                                        : loan.status === 'Selesai'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {loan.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLoans.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            {activeTab === 'bookings' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Pemohon</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Ruangan</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Tanggal & Waktu</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
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
                                            <p className="text-gray-900">{booking.room.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600" suppressHydrationWarning>
                                            {new Date(booking.startTime).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${booking.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : booking.status === 'Disetujui'
                                                        ? 'bg-green-100 text-green-700'
                                                        : booking.status === 'Selesai'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

