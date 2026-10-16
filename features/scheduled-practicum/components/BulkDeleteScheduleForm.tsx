'use client';

import { useState, useTransition } from 'react';
import { X, CalendarX, Loader2, AlertTriangle } from 'lucide-react';
import { bulkDeleteScheduledPracticum, previewBulkDeleteScheduledPracticum } from '@/features/scheduled-practicum/actions';
import type { CourseWithLecturer } from '@/features/courses/types';

interface Room { id: number; name: string; }

interface Props {
    courses: CourseWithLecturer[];
    rooms: Room[];
    onClose: () => void;
}

const DAY_OPTIONS = [
    { label: 'Senin', value: 0 },
    { label: 'Selasa', value: 1 },
    { label: 'Rabu', value: 2 },
    { label: 'Kamis', value: 3 },
    { label: 'Jumat', value: 4 },
    { label: 'Sabtu', value: 5 },
];

interface Preview { count: number; reportCount: number; lpjCount: number; }

export default function BulkDeleteScheduleForm({ courses, rooms, onClose }: Props) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    // Any filter change invalidates the previous preview
    const changed = <T,>(setter: (v: T) => void) => (v: T) => {
        setter(v);
        setPreview(null);
        setResult(null);
    };

    const toggleDay = (day: number) => {
        changed(setDaysOfWeek)(
            daysOfWeek.includes(day) ? daysOfWeek.filter((d) => d !== day) : [...daysOfWeek, day]
        );
    };

    const allDaysSelected = daysOfWeek.length === DAY_OPTIONS.length;

    const buildInput = () => ({
        courseId: parseInt(selectedCourseId),
        roomId: selectedRoomId ? parseInt(selectedRoomId) : undefined,
        daysOfWeek,
        periodStart,
        periodEnd,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (daysOfWeek.length === 0) {
            setResult({ type: 'error', text: 'Pilih minimal satu hari' });
            return;
        }
        setResult(null);

        // Step 1: preview how many schedules match
        if (!preview) {
            startTransition(async () => {
                const res = await previewBulkDeleteScheduledPracticum(buildInput());
                if (!res.success) {
                    setResult({ type: 'error', text: res.error || 'Gagal memeriksa jadwal' });
                    return;
                }
                if (!res.count) {
                    setResult({ type: 'error', text: 'Tidak ada jadwal yang cocok dengan filter tersebut.' });
                    return;
                }
                setPreview({ count: res.count, reportCount: res.reportCount ?? 0, lpjCount: res.lpjCount ?? 0 });
            });
            return;
        }

        // Step 2: confirmed delete
        startTransition(async () => {
            const res = await bulkDeleteScheduledPracticum(buildInput());
            setPreview(null);
            if (res.success) {
                setResult({ type: 'success', text: `Berhasil menghapus ${res.deleted} jadwal.` });
            } else {
                setResult({ type: 'error', text: res.error || 'Gagal menghapus jadwal' });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <CalendarX className="w-5 h-5 text-red-600" />
                        Hapus Jadwal Massal
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Mata Kuliah */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah *</label>
                        <select
                            required
                            value={selectedCourseId}
                            onChange={(e) => changed(setSelectedCourseId)(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Pilih mata kuliah</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ruangan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                        <select
                            value={selectedRoomId}
                            onChange={(e) => changed(setSelectedRoomId)(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Semua ruangan</option>
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Hari */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Hari Praktikum *</label>
                            <button
                                type="button"
                                onClick={() => changed(setDaysOfWeek)(allDaysSelected ? [] : DAY_OPTIONS.map((d) => d.value))}
                                className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                                {allDaysSelected ? 'Batal pilih semua' : 'Pilih semua'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {DAY_OPTIONS.map((d) => (
                                <button
                                    type="button"
                                    key={d.value}
                                    onClick={() => toggleDay(d.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        daysOfWeek.includes(d.value)
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Periode */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                            <input
                                type="date"
                                required
                                value={periodStart}
                                onChange={(e) => changed(setPeriodStart)(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
                            <input
                                type="date"
                                required
                                value={periodEnd}
                                onChange={(e) => changed(setPeriodEnd)(e.target.value)}
                                min={periodStart}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Sistem akan menghapus semua jadwal mata kuliah tersebut pada hari yang dipilih dalam rentang tanggal. Klik &quot;Cek Jadwal&quot; untuk melihat jumlahnya sebelum menghapus.
                    </p>

                    {preview && (
                        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100 space-y-1">
                            <div className="flex items-center gap-2 font-semibold">
                                <AlertTriangle className="w-4 h-4" />
                                {preview.count} jadwal akan dihapus permanen.
                            </div>
                            {(preview.reportCount > 0 || preview.lpjCount > 0) && (
                                <p>
                                    Termasuk {preview.reportCount > 0 && `${preview.reportCount} berita acara`}
                                    {preview.reportCount > 0 && preview.lpjCount > 0 && ' dan '}
                                    {preview.lpjCount > 0 && `${preview.lpjCount} dokumen LPJ`} yang terkait jadwal tersebut.
                                </p>
                            )}
                        </div>
                    )}

                    {result && (
                        <div className={`p-3 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {result.text}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            {isPending
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                                : preview ? `Ya, Hapus ${preview.count} Jadwal` : 'Cek Jadwal'}
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                            {result?.type === 'success' ? 'Tutup' : 'Batal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
