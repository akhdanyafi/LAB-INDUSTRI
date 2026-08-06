import { getStudentDashboard } from '@/features/dashboard/actions';
import { getScheduledPracticums } from '@/features/scheduled-practicum/actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Package, Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import StudentScheduleWidget from './_components/StudentScheduleWidget';
import AttendanceButton from '@/features/attendance/components/AttendanceButton';
import { getPublishedHitsInfos } from '@/features/hits/actions';
import HitsInfoSection from '@/features/hits/components/HitsInfoSection';

export default async function StudentDashboard() {
    const session = await getSession();
    if (!session) redirect('/login');

    const [dashboard, schedules, hitsInfos] = await Promise.all([
        getStudentDashboard(session.user.identifier),
        getScheduledPracticums(),
        getPublishedHitsInfos(3)
    ]);

    // Check for overdue items
    const today = new Date();
    const overdueLoans = dashboard.activeLoans.filter(
        loan => new Date(loan.returnPlanDate) < today
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Mahasiswa</h1>
                <AttendanceButton userData={{ identifier: session.user.identifier, role: session.user.role }} />
            </div>

            {/* Alert for overdue items */}
            {overdueLoans.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900">Perhatian: Peminjaman Terlambat</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Anda memiliki {overdueLoans.length} peminjaman yang melewati batas waktu pengembalian.
                            Segera kembalikan alat yang dipinjam.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Peminjaman Aktif</h3>
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{dashboard.activeLoans.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Booking Mendatang</h3>
                        <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{dashboard.upcomingBookings.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Request</h3>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{dashboard.pendingRequests.length}</p>
                </div>
            </div>

            <div className="mb-8">
                <StudentScheduleWidget schedules={schedules} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Loans */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Peminjaman Aktif</h2>
                        <Link href="/student/loans" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {dashboard.activeLoans.slice(0, 5).map((loan) => {
                            const isOverdue = new Date(loan.returnPlanDate) < today;
                            return (
                                <div key={loan.id} className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">{loan.item.name}</p>
                                            <p className="text-xs text-gray-500">{loan.item.category.name} • {loan.item.room.name}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        <span className={isOverdue ? 'text-red-700 font-medium' : 'text-gray-600'}>
                                            Kembali: {new Date(loan.returnPlanDate).toLocaleDateString('id-ID')}
                                            {isOverdue && ' (Terlambat)'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {dashboard.activeLoans.length === 0 && (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Tidak ada peminjaman aktif</p>
                                <Link href="/student/items" className="text-primary text-sm hover:underline mt-2 inline-block">
                                    Pinjam alat sekarang
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Booking Mendatang</h2>
                        <Link href="/student/rooms" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {dashboard.upcomingBookings.map((booking) => (
                            <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-900 text-sm">{booking.room.name}</p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                        {new Date(booking.startTime).toLocaleDateString('id-ID')} •
                                        {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{booking.purpose}</p>
                            </div>
                        ))}
                        {dashboard.upcomingBookings.length === 0 && (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Tidak ada booking mendatang</p>
                                <Link href="/student/rooms" className="text-primary text-sm hover:underline mt-2 inline-block">
                                    Book ruangan sekarang
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {hitsInfos.length > 0 && (
                <div className="mt-6">
                    <HitsInfoSection items={hitsInfos} compact />
                </div>
            )}
        </div>
    );
}
