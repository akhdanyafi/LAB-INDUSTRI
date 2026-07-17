'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit, X, Clock, MapPin, ChevronLeft, ChevronRight, BookOpen, FileText, CalendarRange } from 'lucide-react';
import TimeSelect from '@/components/shared/TimeSelect';
import { createScheduledPracticum, updateScheduledPracticum, deleteScheduledPracticum } from '@/features/scheduled-practicum/actions';
import BulkScheduleForm from './BulkScheduleForm';
import type { ScheduledPracticumWithDetails } from '@/features/scheduled-practicum/types';
import { DAY_NAMES } from '@/features/scheduled-practicum/types';
import type { CourseWithLecturer } from '@/features/courses/types';
import type { PracticumModuleWithCourse } from '@/features/practicum/types';
import type { PracticumReportWithDetails } from '@/features/practicum-reports/types';
import { AdminPracticumReportTable, AllPracticumLpjManager } from '@/features/practicum-reports/components';
import ViewportPortal from '@/components/shared/ViewportPortal';
import { translateError } from '@/lib/error';

interface Room {
    id: number;
    name: string;
}

interface LpjDoc {
    id: number;
    scheduledPracticumId: number;
    title: string;
    description: string | null;
    filePath: string;
    periodMonth: number;
    periodYear: number;
    createdAt: Date | null;
    uploaderName: string | null;
    uploaderId: string;
}

interface AdminScheduledPracticumManagerProps {
    schedules: ScheduledPracticumWithDetails[];
    courses: CourseWithLecturer[];
    modules: PracticumModuleWithCourse[];
    rooms: Room[];
    allReports: PracticumReportWithDetails[];
    lpjDocs?: LpjDoc[];
    currentUserId?: string;
}

/* ── Calendar helpers ─────────────────────────────────────────── */

function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    let startPad = firstDay.getDay() - 1;
    if (startPad < 0) startPad = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startPad - 1; i >= 0; i--)
        days.push({ date: new Date(year, month - 1, daysInPrev - i), isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++)
        days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++)
        days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    return days;
}

function jsDayToOurDay(jsDay: number) { return jsDay === 0 ? 6 : jsDay - 1; }

function formatDateStr(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toDateKey(d: Date | string) {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const CAL_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/* ── Component ────────────────────────────────────────────────── */

export default function AdminScheduledPracticumManager({
    schedules,
    courses,
    modules,
    rooms,
    allReports,
    lpjDocs,
    currentUserId,
}: AdminScheduledPracticumManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'calendar' | 'reports' | 'lpj'>('calendar');

    const [showForm, setShowForm] = useState(false);
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [editing, setEditing] = useState<ScheduledPracticumWithDetails | null>(null);
    const [formDate, setFormDate] = useState<string>('');

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');

    const dateMap = useMemo(() => {
        const m = new Map<string, ScheduledPracticumWithDetails[]>();
        for (const s of schedules) {
            if (s.scheduledDate) {
                const key = toDateKey(s.scheduledDate);
                if (!m.has(key)) m.set(key, []);
                m.get(key)!.push(s);
            }
        }
        return m;
    }, [schedules]);

    const getSchedulesForDate = useCallback((date: Date) => dateMap.get(toDateKey(date)) || [], [dateMap]);
    const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

    const filteredModules = useMemo(() => {
        if (!selectedCourseId) return modules;
        return modules.filter(m => m.courseId === parseInt(selectedCourseId));
    }, [modules, selectedCourseId]);

    const pendingReportsCount = useMemo(() => allReports.filter(r => r.status === 'Pending' || !r.status).length, [allReports]);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
    const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

    const openFormForDate = () => {
        if (!selectedDate) return;
        setFormDate(formatDateStr(selectedDate));
        setEditing(null);
        setSelectedCourseId('');
        setStartTime('08:00');
        setEndTime('10:00');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
            courseId: parseInt(fd.get('courseId') as string),
            roomId: parseInt(fd.get('roomId') as string),
            moduleId: fd.get('moduleId') ? parseInt(fd.get('moduleId') as string) : undefined,
            startTime: fd.get('startTime') as string,
            endTime: fd.get('endTime') as string,
            scheduledDate: new Date(fd.get('scheduledDate') as string),
        };
        startTransition(async () => {
            try {
                const res = editing
                    ? await updateScheduledPracticum(editing.id, data)
                    : await createScheduledPracticum(data);
                if (res?.error) setMessage({ type: 'error', text: res.error });
                else { setMessage({ type: 'success', text: editing ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!' }); setShowForm(false); setEditing(null); setFormDate(''); }
            } catch (error) {
                const { message } = translateError(error, 'Gagal menyimpan jadwal');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus jadwal ini?')) return;
        startTransition(async () => {
            try {
                const res = await deleteScheduledPracticum(id);
                if (res?.error) setMessage({ type: 'error', text: res.error });
                else setMessage({ type: 'success', text: 'Jadwal dihapus!' });
            } catch (error) {
                const { message } = translateError(error, 'Gagal menghapus');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleEdit = (s: ScheduledPracticumWithDetails) => {
        setEditing(s);
        setSelectedCourseId(String(s.courseId));
        setStartTime(s.startTime);
        setEndTime(s.endTime);
        setFormDate('');
        setShowForm(true);
    };

    const isToday = (d: Date) => d.toDateString() === now.toDateString();
    const isSel = (d: Date) => selectedDate?.toDateString() === d.toDateString();
    const selectedSchedules = selectedDate ? getSchedulesForDate(selectedDate) : [];

    return (
        <div className="space-y-6 pt-2">
            <div className="flex justify-between items-start pb-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Jadwal Praktikum</h1>
                    <p className="text-gray-500 text-sm mt-1.5">Kelola jadwal dan berita acara praktikum</p>
                </div>
                <button
                    onClick={() => setShowBulkForm(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                    <CalendarRange className="w-4 h-4" />
                    Jadwal Massal
                </button>
            </div>

            {showBulkForm && (
                <BulkScheduleForm
                    courses={courses}
                    modules={modules}
                    rooms={rooms}
                    onClose={() => setShowBulkForm(false)}
                />
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Kalender Praktikum
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Berita Acara
                        {pendingReportsCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
                                {pendingReportsCount}
                            </span>
                        )}
                    </span>
                </button>
                {lpjDocs !== undefined && (
                    <button
                        onClick={() => setActiveTab('lpj')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'lpj' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            LPJ Praktikum
                        </span>
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'lpj' && lpjDocs !== undefined && currentUserId ? (
                <AllPracticumLpjManager
                    schedules={schedules.map(s => ({ id: s.id, courseName: s.courseName ?? '', courseCode: s.courseCode ?? '' }))}
                    initialDocs={lpjDocs}
                    currentUserId={currentUserId}
                    isAdmin={true}
                />
            ) : activeTab === 'reports' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Semua Berita Acara</h2>
                                <p className="text-sm text-gray-500">
                                    {allReports.length} berita acara · {pendingReportsCount} menunggu verifikasi
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <AdminPracticumReportTable reports={allReports} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ═══ LEFT: Calendar ═══ */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                                <button onClick={prevMonth} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="text-center">
                                    <h2 className="text-lg font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
                                    <button onClick={goToday} className="text-xs text-green-600 hover:underline mt-0.5">Hari Ini</button>
                                </div>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                                {CAL_HEADERS.map(d => (
                                    <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {calendarDays.map((cell, idx) => {
                                    const daySchedules = getSchedulesForDate(cell.date);
                                    const has = daySchedules.length > 0;
                                    const today = isToday(cell.date);
                                    const selected = isSel(cell.date);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedDate(cell.date)}
                                            className={`
                                                relative min-h-[72px] p-1.5 border-b border-r border-gray-100
                                                text-left transition-all duration-150 group
                                                ${!cell.isCurrentMonth ? 'bg-gray-50/60' : ''}
                                                ${selected ? 'ring-2 ring-green-500 ring-inset z-10' : ''}
                                                ${has && cell.isCurrentMonth ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`
                                                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                                                    ${today ? 'bg-green-600 text-white shadow-sm'
                                                        : cell.isCurrentMonth ? has ? 'text-green-800 font-semibold' : 'text-gray-700' : 'text-gray-400'}
                                                `}>
                                                    {cell.date.getDate()}
                                                </span>
                                                {has && cell.isCurrentMonth && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold">
                                                        {daySchedules.length}
                                                    </span>
                                                )}
                                            </div>
                                            {has && cell.isCurrentMonth && (
                                                <div className="mt-1 space-y-0.5">
                                                    {daySchedules.slice(0, 2).map(s => (
                                                        <div key={s.id} className="text-[10px] leading-tight px-1.5 py-0.5 rounded-sm bg-green-600/15 text-green-800 truncate font-medium">
                                                            {s.courseCode}
                                                        </div>
                                                    ))}
                                                    {daySchedules.length > 2 && (
                                                        <div className="text-[10px] text-green-600 px-1.5 font-medium">+{daySchedules.length - 2} lagi</div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-300" />
                                    Ada jadwal praktikum
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-green-600" />
                                    Hari ini
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ RIGHT: Detail panel ═══ */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
                            <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                {selectedDate ? (
                                    <div>
                                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Detail Tanggal</p>
                                        <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                                            {DAY_NAMES[jsDayToOurDay(selectedDate.getDay())]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}
                                        </h3>
                                        <p className="text-xs text-gray-500">{selectedDate.getFullYear()}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Kalender Praktikum</p>
                                        <p className="text-sm text-gray-500 mt-1">Pilih tanggal pada kalender untuk melihat jadwal</p>
                                    </div>
                                )}
                            </div>

                            {selectedDate && (
                                <div className="p-4">
                                    {selectedSchedules.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedSchedules.map(s => (
                                                <div key={s.id} className="rounded-lg border border-green-100 bg-green-50/50 p-3 relative group">
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-1 self-stretch rounded-full bg-green-500 shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 text-sm">{s.courseName}</p>
                                                            <p className="text-xs text-green-700 font-medium">{s.courseCode}</p>
                                                            {s.moduleName && (
                                                                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                                    <BookOpen className="w-3 h-3" />
                                                                    {s.moduleName}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-green-600" />
                                                                    {s.startTime} – {s.endTime}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-green-600" />
                                                                    {s.roomName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 shrink-0">
                                                            <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit jadwal">
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus jadwal">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                <BookOpen className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500">Belum ada jadwal di tanggal ini</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={openFormForDate}
                                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Jadwal di Tanggal Ini
                                    </button>
                                </div>
                            )}

                            {!selectedDate && (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                                        <BookOpen className="w-7 h-7 text-green-400" />
                                    </div>
                                    <p className="text-sm text-gray-400">Klik tanggal pada kalender</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ FORM MODAL ═══ */}
            {showForm && (
                <ViewportPortal>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {editing ? 'Edit Jadwal Praktikum' : 'Tambah Jadwal Praktikum'}
                                    </h3>
                                    {formDate && !editing && (
                                        <p className="text-sm text-green-700 mt-0.5">{formDate}</p>
                                    )}
                                </div>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah *</label>
                                    <select
                                        name="courseId" required
                                        defaultValue={editing?.courseId || ''}
                                        onChange={e => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    >
                                        <option value="">-- Pilih Mata Kuliah --</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modul Praktikum</label>
                                    <select
                                        name="moduleId"
                                        defaultValue={editing?.moduleId || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    >
                                        <option value="">-- Pilih Modul (opsional) --</option>
                                        {filteredModules.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {selectedCourseId
                                            ? `Menampilkan ${filteredModules.length} modul untuk mata kuliah terpilih`
                                            : 'Pilih mata kuliah terlebih dahulu untuk filter modul'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan *</label>
                                    <select
                                        name="roomId" required
                                        defaultValue={editing?.roomId || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    >
                                        <option value="">-- Pilih Ruangan --</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                                    <input
                                        name="scheduledDate" type="date" required
                                        defaultValue={editing?.scheduledDate ? formatDateStr(new Date(editing.scheduledDate)) : formDate}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Hari akan otomatis ditentukan dari tanggal yang dipilih</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai *</label>
                                        <TimeSelect name="startTime" value={startTime} onChange={setStartTime} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai *</label>
                                        <TimeSelect name="endTime" value={endTime} onChange={setEndTime} required />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button type="submit" disabled={isPending}
                                        className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        {isPending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                                    </button>
                                    <button type="button"
                                        onClick={() => { setShowForm(false); setEditing(null); }}
                                        className="text-gray-500 hover:text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ViewportPortal>
            )}
        </div>
    );
}
