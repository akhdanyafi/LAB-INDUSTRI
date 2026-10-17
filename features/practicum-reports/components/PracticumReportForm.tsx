'use client';

import { useEffect, useState, useTransition } from 'react';
import { X, FileText, Users, Calendar, Clock, MapPin, User, UserPlus, BookOpen } from 'lucide-react';
import { createPracticumReport, getAsprakPartnerOptions, getReportModuleOptions, updatePracticumReport } from '@/features/practicum-reports/actions';
import type { ScheduledPracticumWithDetails } from '@/features/scheduled-practicum/types';
import type { AsprakPartnerOption, PracticumCondition, PracticumReport } from '@/features/practicum-reports/types';
import ViewportPortal from '@/components/shared/ViewportPortal';
import SignaturePad from './SignaturePad';

interface PracticumReportFormProps {
    isOpen: boolean;
    onClose: () => void;
    /** Isi berita acara baru untuk jadwal ini. */
    schedule?: ScheduledPracticumWithDetails;
    /** Edit berita acara yang sudah ada (selama belum disetujui). */
    report?: PracticumReport;
    onSuccess?: (message?: string) => void;
}

const OTHER_MODULE = '__lainnya__';

const CONDITION_OPTIONS_LIST: { value: PracticumCondition; label: string }[] = [
    { value: 'Lancar', label: 'Lancar' },
    { value: 'Kurang Lancar', label: 'Kurang Lancar' },
    { value: 'Terkendala', label: 'Terkendala' },
];

export default function PracticumReportForm({ isOpen, onClose, schedule, report, onSuccess }: PracticumReportFormProps) {
    const isEdit = !!report;
    // Informasi jadwal: dari jadwal (isi baru) atau dari snapshot berita acara (edit).
    const info = report
        ? {
            id: report.scheduledPracticumId, courseCode: report.courseCode, courseName: report.courseName, lecturerName: report.lecturerName,
            roomName: report.roomName, date: report.practicumDate, startTime: report.startTime, endTime: report.endTime,
        }
        : {
            id: schedule!.id, courseCode: schedule!.courseCode, courseName: schedule!.courseName, lecturerName: (schedule as ScheduledPracticumWithDetails & { lecturerName?: string | null }).lecturerName ?? null,
            roomName: schedule!.roomName, date: schedule!.scheduledDate, startTime: schedule!.startTime, endTime: schedule!.endTime,
        };
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [condition, setCondition] = useState<PracticumCondition | ''>(report?.condition ?? '');
    // Modul yang digunakan saat mengajar
    const [moduleOptions, setModuleOptions] = useState<{ id: number; name: string }[]>([]);
    const [moduleChoice, setModuleChoice] = useState<string>(report?.moduleId ? String(report.moduleId) : report?.moduleTitle ? OTHER_MODULE : '');
    const [moduleTitle, setModuleTitle] = useState(report && !report.moduleId ? report.moduleTitle ?? '' : '');
    const [modulesLoading, setModulesLoading] = useState(true);
    const [partnerOptions, setPartnerOptions] = useState<AsprakPartnerOption[]>([]);
    const [partnerLoading, setPartnerLoading] = useState(true);
    const [signature, setSignature] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        getAsprakPartnerOptions()
            .then((opts) => { if (!cancelled) setPartnerOptions(opts); })
            .catch(() => { if (!cancelled) setPartnerOptions([]); })
            .finally(() => { if (!cancelled) setPartnerLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        getReportModuleOptions(info.id)
            .then((res) => {
                if (cancelled) return;
                setModuleOptions(res.options);
                // Pilihan awal: modul pada jadwal (isi baru); bila MK tidak punya modul → tulis sendiri.
                setModuleChoice((c) => c || (res.defaultModuleId && res.options.some((o) => o.id === res.defaultModuleId)
                    ? String(res.defaultModuleId) : res.options.length ? '' : OTHER_MODULE));
            })
            .catch(() => { if (!cancelled) setModuleChoice((c) => c || OTHER_MODULE); })
            .finally(() => { if (!cancelled) setModulesLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, info.id]);

    if (!isOpen) return null;

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const fd = new FormData(e.currentTarget);
        if (!moduleChoice || (moduleChoice === OTHER_MODULE && !moduleTitle.trim())) {
            setError('Pilih atau tuliskan modul yang digunakan.');
            return;
        }
        const moduleFields = moduleChoice === OTHER_MODULE
            ? { moduleId: null, moduleTitle: moduleTitle.trim() }
            : { moduleId: Number(moduleChoice), moduleTitle: null };

        const fields = {
            batch: fd.get('batch') as string,
            attendeeCount: parseInt(fd.get('attendeeCount') as string),
            condition: fd.get('condition') as PracticumCondition,
            description: fd.get('description') as string,
            issues: (fd.get('issues') as string) || undefined,
            followUp: (fd.get('followUp') as string) || undefined,
            partnerId: (fd.get('partnerId') as string) || null,
            ...moduleFields,
        };

        if (report) {
            startTransition(async () => {
                const result = await updatePracticumReport(report.id, fields);
                if (result.success) {
                    onSuccess?.(result.resubmitted ? 'Berita acara diperbarui dan diajukan ulang (status kembali Pending).' : 'Berita acara berhasil diperbarui!');
                    onClose();
                } else {
                    setError(result.error || 'Gagal memperbarui berita acara');
                }
            });
            return;
        }

        const data = {
            scheduledPracticumId: schedule!.id,
            courseName: info.courseName || '',
            courseCode: info.courseCode || '',
            lecturerName: info.lecturerName || null,
            roomName: info.roomName || '',
            practicumDate: new Date(info.date),
            startTime: info.startTime,
            endTime: info.endTime,
            ...moduleFields,
            batch: fd.get('batch') as string,
            attendeeCount: parseInt(fd.get('attendeeCount') as string),
            condition: fd.get('condition') as PracticumCondition,
            description: fd.get('description') as string,
            issues: (fd.get('issues') as string) || undefined,
            followUp: (fd.get('followUp') as string) || undefined,
            partnerId: (fd.get('partnerId') as string) || null,
            assistantSignature: signature,
        };

        startTransition(async () => {
            const result = await createPracticumReport(data);
            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || 'Gagal menyimpan berita acara');
            }
        });
    };

    return (
        <ViewportPortal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Berita Acara Praktikum' : 'Isi Berita Acara Praktikum'}</h3>
                            <p className="text-sm text-blue-600">{info.courseCode} - {info.courseName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Info dari Jadwal (Read-only) */}
                    <div className="bg-white rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Informasi Jadwal (Otomatis)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Matakuliah:</span>
                                <span className="font-medium text-gray-900">{info.courseCode} - {info.courseName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Dosen Pengampu:</span>
                                <span className="font-medium text-gray-900">{info.lecturerName || '-'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Hari/Tanggal:</span>
                                <span className="font-medium text-gray-900">{formatDate(info.date)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Waktu:</span>
                                <span className="font-medium text-gray-900">{info.startTime} - {info.endTime}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm md:col-span-2">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-500">Ruang Lab:</span>
                                <span className="font-medium text-gray-900">{info.roomName}</span>
                            </div>
                        </div>
                    </div>

                    {isEdit && report?.status === 'Ditolak' && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            Berita acara ini ditolak{report.rejectionReason ? `: “${report.rejectionReason}”` : ''}. Setelah disimpan, berita acara diajukan ulang (status kembali Pending).
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Modul yang digunakan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modul yang Digunakan <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={moduleChoice}
                                    onChange={(e) => setModuleChoice(e.target.value)}
                                    disabled={modulesLoading}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-gray-50"
                                >
                                    <option value="">{modulesLoading ? 'Memuat daftar modul...' : '— Pilih modul —'}</option>
                                    {moduleOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    <option value={OTHER_MODULE}>Lainnya (tulis sendiri)</option>
                                </select>
                            </div>
                            {moduleChoice === OTHER_MODULE && (
                                <input
                                    value={moduleTitle}
                                    onChange={(e) => setModuleTitle(e.target.value)}
                                    maxLength={255}
                                    placeholder="Judul modul/materi yang digunakan"
                                    className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                />
                            )}
                            <p className="text-xs text-gray-500 mt-1">Modul praktikum MK ini yang dipakai saat mengajar; ditulis di berita acara sebagai Judul Materi/Modul.</p>
                        </div>

                        {/* Partner Asprak */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Partner Asisten Praktikum (Opsional)
                            </label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    name="partnerId"
                                    defaultValue={report?.partnerId ?? ''}
                                    disabled={partnerLoading}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-gray-50"
                                >
                                    <option value="">{partnerLoading ? 'Memuat daftar asprak...' : '— Tanpa partner —'}</option>
                                    {partnerOptions.map((opt) => (
                                        <option key={opt.identifier} value={opt.identifier}>
                                            {opt.fullName} ({opt.identifier})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Maksimal 2 asprak per berita acara (Anda + 1 partner). Hanya mahasiswa ber-role Asisten Praktikum.
                            </p>
                        </div>

                        {/* Angkatan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Angkatan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="batch"
                                required
                                defaultValue={report?.batch ?? ''}
                                placeholder="Contoh: 2023, 2022-2023"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>

                        {/* Jumlah Mahasiswa Hadir */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Mahasiswa Hadir <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="attendeeCount"
                                    required
                                    defaultValue={report?.attendeeCount ?? ''}
                                    min="0"
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                />
                            </div>
                        </div>

                        {/* Kondisi Praktikum */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kondisi Praktikum <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {CONDITION_OPTIONS_LIST.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`
                                            flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all
                                            ${condition === opt.value
                                                ? opt.value === 'Lancar'
                                                    ? 'bg-green-50 border-green-500 text-green-700'
                                                    : opt.value === 'Kurang Lancar'
                                                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                                        : 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="condition"
                                            value={opt.value}
                                            required
                                            checked={condition === opt.value}
                                            onChange={(e) => setCondition(e.target.value as PracticumCondition)}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                            ${condition === opt.value
                                                ? opt.value === 'Lancar'
                                                    ? 'border-green-500'
                                                    : opt.value === 'Kurang Lancar'
                                                        ? 'border-yellow-500'
                                                        : 'border-red-500'
                                                : 'border-gray-300'
                                            }
                                        `}>
                                            {condition === opt.value && (
                                                <div className={`w-2 h-2 rounded-full
                                                    ${opt.value === 'Lancar'
                                                        ? 'bg-green-500'
                                                        : opt.value === 'Kurang Lancar'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }
                                                `} />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Deskripsi Pelaksanaan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi Singkat Pelaksanaan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                required
                                defaultValue={report?.description ?? ''}
                                rows={3}
                                maxLength={2000}
                                placeholder="Deskripsikan secara singkat bagaimana pelaksanaan praktikum hari ini..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                            />
                        </div>

                        {/* Kendala */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kendala (Opsional)
                            </label>
                            <textarea
                                name="issues"
                                defaultValue={report?.issues ?? ''}
                                rows={2}
                                maxLength={2000}
                                placeholder="Tuliskan kendala yang dihadapi selama praktikum (jika ada)..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                            />
                        </div>

                        {/* Tindak Lanjut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tindak Lanjut (Opsional)
                            </label>
                            <textarea
                                name="followUp"
                                defaultValue={report?.followUp ?? ''}
                                rows={2}
                                maxLength={2000}
                                placeholder="Tuliskan tindak lanjut yang diperlukan (jika ada)..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                            />
                        </div>

                        {/* Tanda tangan (saat edit: lewat tombol Tambah/Ubah TTD di daftar) */}
                        {!isEdit && <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanda Tangan Asisten Praktikum (bisa nanti)
                            </label>
                            <p className="mb-2 text-xs text-gray-500">
                                Tanda tangan Anda sebagai pengisi berita acara (Asisten Praktikum yang namanya paling atas), dibubuhkan di PDF berita acara.
                                Boleh dikosongkan dulu — bisa disisipkan kapan saja lewat tombol &quot;Tambah TTD&quot; di daftar Berita Acara, baik sudah disetujui admin maupun belum.
                            </p>
                            <SignaturePad value={signature} onChange={setSignature} />
                        </div>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Berita Acara'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </ViewportPortal>
    );
}
