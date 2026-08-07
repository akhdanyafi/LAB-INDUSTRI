import { getAdminStats } from '@/features/dashboard/actions';
import { getRoomAttendanceStatsAction } from '@/features/attendance/actions';
import { UserService } from '@/features/users/service';
import { TrendingUp, Package, Clock, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardAnalytics from './_components/DashboardAnalytics';
import TodayAttendance from './_components/TodayAttendance';
import RoomAttendanceChart from './_components/RoomAttendanceChart';
import DashboardNotifications from './_components/DashboardNotifications';
import AttendanceButton from '@/features/attendance/components/AttendanceButton';
import { getSession } from '@/lib/auth';
import { getPublishedHitsInfos } from '@/features/hits/actions';
import HitsInfoSection from '@/features/hits/components/HitsInfoSection';

export default async function AdminDashboard() {
    const [stats, roomAttendanceStats, pendingUsers, hitsInfos] = await Promise.all([
        getAdminStats(),
        getRoomAttendanceStatsAction(),
        UserService.getPending(),
        getPublishedHitsInfos(3)
    ]);

    const session = await getSession();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                {session && (
                    <AttendanceButton userData={{ identifier: session.user.identifier, role: session.user.role }} />
                )}
            </div>

            {/* Unified Notifications Section */}
            <DashboardNotifications
                pendingUsers={pendingUsers.length}
                pendingLoans={stats.pendingLoans}
                pendingBookings={stats.pendingBookings}
                autoApprovedLoans={stats.autoApprovedLoans}
                autoApprovedBookings={stats.autoApprovedBookings}
                autoReturnedLoans={stats.autoReturnedLoans}
            />

            {/* Smart Analytics Section */}
            <DashboardAnalytics />

            {/* Attendance Section - Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TodayAttendance />
                <RoomAttendanceChart data={roomAttendanceStats} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Total Alat</h3>
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{stats.totalItems}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Peminjaman Aktif</h3>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{stats.activeLoans}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Peminjaman</h3>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{stats.pendingLoans}</p>
                    {stats.pendingLoans > 0 && (
                        <Link href="/admin/validations?tab=loans" className="text-xs text-primary hover:underline mt-2 inline-block">
                            Lihat semua →
                        </Link>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Booking</h3>
                        <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{stats.pendingBookings}</p>
                    {stats.pendingBookings > 0 && (
                        <Link href="/admin/validations?tab=rooms" className="text-xs text-primary hover:underline mt-2 inline-block">
                            Lihat semua →
                        </Link>
                    )}
                </div>
            </div>

            {/* Item Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-semibold mb-4">Status Alat</h2>
                <div className="space-y-3">
                    {stats.itemStats.map((stat) => {
                        const total = stats.totalItems;
                        const percentage = ((stat.count / total) * 100).toFixed(1);
                        const color = stat.status === 'Tersedia' ? 'bg-green-500' :
                            stat.status === 'Dipinjam' ? 'bg-orange-500' : 'bg-gray-500';

                        return (
                            <div key={stat.status}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{stat.status}</span>
                                    <span className="text-gray-500">{stat.count} ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Loans */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Peminjaman Aktif</h2>
                        <Link href="/admin/validations?tab=loans" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.recentLoans.filter(loan => loan.status === 'Disetujui').slice(0, 5).map((loan) => (
                            <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">{loan.student.fullName}</p>
                                    <p className="text-xs text-gray-500">{loan.item.name}</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                    Aktif
                                </span>
                            </div>
                        ))}
                        {stats.recentLoans.filter(loan => loan.status === 'Disetujui').length === 0 && (
                            <p className="text-center text-gray-500 py-4 text-sm">Tidak ada peminjaman aktif</p>
                        )}
                    </div>
                </div>

                {/* Active Room Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Booking Ruangan Aktif</h2>
                        <Link href="/admin/validations?tab=rooms" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Lihat semua <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.recentBookings.filter(booking => booking.status === 'Disetujui').slice(0, 5).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">{booking.user.fullName}</p>
                                    <p className="text-xs text-gray-500" suppressHydrationWarning>
                                        {booking.room.name} • {new Date(booking.startTime).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                    Aktif
                                </span>
                            </div>
                        ))}
                        {stats.recentBookings.filter(booking => booking.status === 'Disetujui').length === 0 && (
                            <p className="text-center text-gray-500 py-4 text-sm">Tidak ada booking aktif</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <HitsInfoSection items={hitsInfos} compact />
            </div>
        </div>
    );
}
