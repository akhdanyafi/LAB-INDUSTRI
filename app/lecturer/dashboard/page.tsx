import { getLecturerDashboard } from '@/features/dashboard/actions';
import { getScheduledPracticumsByLecturerId } from '@/features/scheduled-practicum/actions';
import { getSession, hasPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Calendar, FileText, ArrowRight, Download, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import StudentScheduleWidget from '@/app/student/dashboard/_components/StudentScheduleWidget';
import AttendanceButton from '@/features/attendance/components/AttendanceButton';
import { getPublishedHitsInfos } from '@/features/hits/actions';
import HitsInfoSection from '@/features/hits/components/HitsInfoSection';

export default async function LecturerDashboard() {
    const session = await getSession();
    if (!session) redirect('/login');

    const showLPJ = hasPermission(session, 'governance.view');
    const [dashboard, schedules, hitsInfos] = await Promise.all([
        getLecturerDashboard(session.user.identifier, showLPJ),
        getScheduledPracticumsByLecturerId(session.user.identifier),
        getPublishedHitsInfos(3)
    ]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Dosen
                </h1>
                <AttendanceButton userData={{ identifier: session.user.identifier, role: session.user.role }} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Active Loans */}
                <Link href="/lecturer/items" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium group-hover:text-blue-600 transition-colors">Peminjaman Aktif</h3>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Package className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboard.activeLoans?.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                        Lihat alat dipinjam <ArrowRight className="w-3 h-3" />
                    </p>
                </Link>

                {/* Upcoming Bookings */}
                <Link href="/lecturer/rooms" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-green-500 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium group-hover:text-green-600 transition-colors">Booking Mendatang</h3>
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <Calendar className="w-4 h-4 text-green-500" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboard.totalBookings}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 group-hover:text-green-500 transition-colors">
                        Lihat jadwal ruangan <ArrowRight className="w-3 h-3" />
                    </p>
                </Link>

                {/* Pending Requests */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Request</h3>
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-orange-500" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboard.pendingRequests?.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">Menunggu persetujuan</p>
                </div>
            </div>

            <div className="mb-8">
                <StudentScheduleWidget schedules={schedules} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Loans */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            Peminjaman Aktif
                        </h2>
                        <Link href="/lecturer/items" className="text-sm text-[#0F4C81] hover:underline flex items-center gap-1 group">
                            Semua <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    <div className="space-y-3 flex-1">
                        {dashboard.activeLoans?.slice(0, 5).map((loan) => (
                            <div key={loan.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">{loan.item.name}</h4>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{loan.item.category.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md ring-1 ring-blue-600/20">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(loan.returnPlanDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${loan.returnStatus === 'Pending' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20' :
                                        loan.returnStatus === 'Dikembalikan' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                                            'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                                        }`}>
                                        {loan.returnStatus === 'Pending' ? 'Menunggu Konfirmasi' :
                                            loan.returnStatus === 'Dikembalikan' ? 'Selesai' :
                                                'Dipinjam'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!dashboard.activeLoans || dashboard.activeLoans.length === 0) && (
                            <div className="text-center py-10 px-4 h-full flex flex-col items-center justify-center">
                                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium text-sm">Tidak ada peminjaman aktif</p>
                                <p className="text-gray-400 text-xs mt-1 max-w-[250px] mx-auto">Anda belum meminjam alat bantu apapun saat ini.</p>
                                <Link href="/lecturer/items" className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                                    Pinjam Alat
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            Booking Ruangan Saya
                        </h2>
                        <Link href="/lecturer/rooms" className="text-sm text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 group">
                            Semua <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    <div className="space-y-3 flex-1">
                        {dashboard.upcomingBookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm group-hover:text-green-700 transition-colors">{booking.room.name}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                            <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                <span className="font-medium text-gray-700">{new Date(booking.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="font-medium text-gray-700">
                                                    {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="text-gray-400 font-normal mx-0.5">-</span>
                                                    {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-semibold text-xs ring-1 ring-green-600/20">
                                        Disetujui
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2.5 line-clamp-1 border-t border-gray-100 pt-2"><span className="text-gray-400 mr-1">Tujuan:</span>{booking.purpose}</p>
                            </div>
                        ))}
                        {dashboard.upcomingBookings.length === 0 && (
                            <div className="text-center py-10 px-4 h-full flex flex-col items-center justify-center">
                                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium text-sm">Tidak ada jadwal booking ruangan mendatang</p>
                                <p className="text-gray-400 text-xs mt-1 max-w-[250px] mx-auto">Buat pengajuan baru jika Anda membutuhkan ruangan lab.</p>
                                <Link href="/lecturer/rooms" className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors shadow-sm">
                                    Buat Booking Baru
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* LPJ Section - visible for users with governance.view permission */}
                {showLPJ && dashboard.latestLPJ && dashboard.latestLPJ.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                Dokumen LPJ Terbaru
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboard.latestLPJ.map((doc) => (
                                <div key={doc.id} className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100 group">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            <FileText className="w-5 h-5 text-orange-600 group-hover:text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-orange-700 transition-colors">{doc.title}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">TANGGAL UPLOAD</span>
                                            <span className="text-xs font-medium text-gray-600 mt-0.5">
                                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                        <a
                                            href={doc.filePath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center w-8 h-8 text-orange-600 bg-orange-50 rounded-full hover:bg-orange-500 hover:text-white transition-all focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                                            title="Unduh Dokumen"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6">
                <HitsInfoSection items={hitsInfos} compact />
            </div>
        </div>
    );
}
