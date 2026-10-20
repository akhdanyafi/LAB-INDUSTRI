'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IdCard, Landmark, Upload, Loader2, ClipboardCheck } from 'lucide-react';
import { updateAsprakProfile } from '@/features/users/actions';
import { formatDateWIB } from '@/lib/timezone';

interface AsprakData {
    photoPath?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
}

interface ReportItem {
    id: number;
    courseName: string;
    courseCode: string;
    roomName: string;
    practicumDate: Date | string | null;
    status: string | null;
    createdAt: Date | string | null;
}

interface Props {
    data: AsprakData;
    reports: ReportItem[];
}

const STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Diverifikasi': 'bg-green-100 text-green-800',
    'Ditolak': 'bg-red-100 text-red-800',
};

export default function AsprakProfileExtras({ data, reports }: Props) {
    const router = useRouter();
    const [photoPath, setPhotoPath] = useState<string | null>(data.photoPath ?? null);
    const [bankName, setBankName] = useState(data.bankName ?? '');
    const [bankAccountNumber, setBankAccountNumber] = useState(data.bankAccountNumber ?? '');
    const [bankAccountName, setBankAccountName] = useState(data.bankAccountName ?? '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', 'pas-foto');
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok || !json.path) throw new Error(json.error || 'Gagal mengunggah foto');
            setPhotoPath(json.path);
        } catch (err: any) {
            setError(err.message || 'Gagal mengunggah foto');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            const result = await updateAsprakProfile({
                photoPath,
                bankName: bankName || null,
                bankAccountNumber: bankAccountNumber || null,
                bankAccountName: bankAccountName || null,
            });
            if (!result.success) throw new Error(result.error || 'Gagal menyimpan');
            setSuccess('Data Asisten Praktikum berhasil disimpan.');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-6 space-y-6 w-full">
            {/* Biodata Asprak */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <IdCard className="w-5 h-5 text-[#0F4C81]" />
                    <h2 className="text-lg font-semibold text-slate-800">Data Asisten Praktikum</h2>
                </div>

                {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl">{error}</div>}
                {success && <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 rounded-xl">{success}</div>}

                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Pas Foto */}
                    <div className="shrink-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pas Foto</label>
                        <div className="w-32 h-40 rounded-xl border border-gray-200 bg-slate-50 overflow-hidden flex items-center justify-center relative">
                            {photoPath ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photoPath} alt="Pas foto" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-400 text-center px-2">Belum ada foto</span>
                            )}
                        </div>
                        <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F4C81] bg-[#0F4C81]/10 hover:bg-[#0F4C81]/20 rounded-lg cursor-pointer transition-colors">
                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                            <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhoto} className="hidden" />
                        </label>
                    </div>

                    {/* Rekening */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Landmark className="w-4 h-4" /> Nama Bank
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Contoh: BSI, BCA, Mandiri"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                            <input
                                type="text"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="Nomor rekening"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                            <input
                                type="text"
                                value={bankAccountName}
                                onChange={(e) => setBankAccountName(e.target.value)}
                                placeholder="Nama sesuai buku tabungan"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-[#0F4C81] text-white text-sm font-semibold rounded-xl hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Simpan Data
                    </button>
                </div>
            </div>

            {/* List Berita Acara */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#0F4C81]" />
                    <h2 className="text-lg font-semibold text-slate-800">Berita Acara yang Sudah Diisi</h2>
                </div>
                {reports.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-gray-500">Belum ada berita acara yang diisi.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {reports.map((r) => (
                            <li key={r.id} className="px-6 py-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{r.courseName} <span className="text-gray-400 font-normal">({r.courseCode})</span></p>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span>{r.roomName}</span>
                                        <span>Praktikum: {formatDateWIB(r.practicumDate)}</span>
                                    </div>
                                </div>
                                <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status || 'Pending'] || 'bg-slate-100 text-slate-600'}`}>
                                    {r.status || 'Pending'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
