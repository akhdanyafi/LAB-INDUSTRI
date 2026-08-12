'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Search, Upload } from 'lucide-react';
import { adminManualLoan } from '@/features/loans/actions';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';
import TimeSelect from '@/components/shared/TimeSelect';

const PURPOSE_TEMPLATES = [
    'Praktikum dan Tugas Akhir',
    'Penelitian/Riset',
    'Kegiatan kemahasiswaan (HIMA/BEM/dll)',
    'Keperluan pribadi / project luar',
    'Lainnya',
];

const ORGANISASI_OPTIONS = [
    'Pribadi',
    'HMIF',
    'Panitia Fortex',
    'Ketua Kelompok MK',
    'Lainnya',
];

interface ManualLoanButtonProps {
    items: { id: number; name: string; qrCode: string; category: { name: string | null } | null }[];
    lecturers: { identifier: string; fullName: string; }[];
    adminId: string;
}

export default function ManualLoanButton({ items, lecturers, adminId }: ManualLoanButtonProps) {
    const { showAlert } = useAlert();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [itemSearch, setItemSearch] = useState('');

    // New States
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    const [dosenPembimbing, setDosenPembimbing] = useState('');
    const [customDosen, setCustomDosen] = useState('');
    const [organisasi, setOrganisasi] = useState('Pribadi');
    const [customOrganisasi, setCustomOrganisasi] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [suratFile, setSuratFile] = useState<File | null>(null);

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.qrCode.toLowerCase().includes(itemSearch.toLowerCase())
    ).slice(0, 10);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                showAlert({ title: 'Format Tidak Valid', message: 'Surat izin harus dalam format PDF.', type: 'error' });
                e.target.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showAlert({ title: 'Ukuran Terlalu Besar', message: 'Ukuran file maksimal 2MB', type: 'error' });
                e.target.value = '';
                return;
            }
            setSuratFile(file);
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (selectedItemIds.length === 0) {
            showAlert({ title: 'Peringatan', message: 'Pilih minimal 1 alat', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            // Upload surat izin if exists
            let suratPath: string | undefined;
            if (suratFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', suratFile);
                uploadFormData.append('folder', 'surat-izin');

                const uploadRes = await fetch('/api/upload?type=suratIzin', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    suratPath = uploadData.path;
                }
            }

            const finalDosen = dosenPembimbing === 'Lainnya' ? customDosen : dosenPembimbing;
            const finalPurpose = selectedPurpose === 'Lainnya' ? customPurpose : selectedPurpose;
            const finalOrganisasi = organisasi === 'Lainnya' ? customOrganisasi : organisasi;

            const startDateTime = new Date(`${formData.get('startDate')}T${formData.get('startTime')}`);
            const endDateTime = new Date(`${formData.get('endDate')}T${formData.get('endTime')}`);

            const result = await adminManualLoan({
                identifier: formData.get('identifier') as string,
                fullName: formData.get('fullName') as string,
                phoneNumber: formData.get('phoneNumber') as string || undefined,
                dosenPembimbing: finalDosen || undefined,
                itemIds: selectedItemIds,
                returnPlanDate: new Date(formData.get('endDate') as string), // Use endDate as returnPlanDate
                startTime: startDateTime,
                endTime: endDateTime,
                purpose: finalPurpose,
                organisasi: finalOrganisasi,
                suratIzin: suratPath,
                validatorId: adminId
            });

            if (!result?.success) {
                const { title, message } = translateError(result?.error, 'Gagal memproses peminjaman');
                showAlert({ title, message, type: 'error' });
                return;
            }
            setIsOpen(false);

            // Reset state
            setSelectedPurpose('');
            setCustomPurpose('');
            setDosenPembimbing('');
            setCustomDosen('');
            setOrganisasi('Pribadi');
            setCustomOrganisasi('');
            setStartTime('');
            setEndTime('');
            setSuratFile(null);
            setSelectedItemIds([]);
            showAlert({ title: 'Berhasil', message: 'Peminjaman manual berhasil diproses', type: 'success' });
        } catch (error: any) {
            const { title, message } = translateError(error, 'Gagal memproses peminjaman');
            showAlert({ title, message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Peminjaman Manual
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Form Peminjaman Manual</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Kolom Kiri: Data Peminjam & Detail */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Data Peminjam</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">NIM / Identifier *</label>
                                                    <input required name="identifier" className="w-full px-4 py-2 rounded-lg border border-gray-200" placeholder="010252..." />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                                                    <input required name="fullName" className="w-full px-4 py-2 rounded-lg border border-gray-200" placeholder="Budi Santoso" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                                                    <input name="phoneNumber" className="w-full px-4 py-2 rounded-lg border border-gray-200" placeholder="0812..." />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pembimbing</label>
                                                    <select
                                                        value={dosenPembimbing}
                                                        onChange={(e) => setDosenPembimbing(e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
                                                    >
                                                        <option value="">Pilih Dosen</option>
                                                        <option value="Lainnya">Lainnya (Ketik Manual)</option>
                                                        {lecturers.map(l => (
                                                            <option key={l.identifier} value={l.fullName}>{l.fullName}</option>
                                                        ))}
                                                    </select>
                                                    {dosenPembimbing === 'Lainnya' && (
                                                        <input
                                                            type="text"
                                                            value={customDosen}
                                                            onChange={(e) => setCustomDosen(e.target.value)}
                                                            placeholder="Ketik nama dosen / PIC..."
                                                            className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Rencana & Keperluan</h4>
                                            <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-gray-50">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Mulai *</label>
                                                    <input type="date" required name="startDate" className="w-full px-3 py-1.5 rounded-md border text-sm bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Jam Mulai *</label>
                                                    <TimeSelect name="startTime" value={startTime} onChange={setStartTime} required />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Rencana Kembali *</label>
                                                    <input type="date" required name="endDate" className="w-full px-3 py-1.5 rounded-md border text-sm bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Jam Selesai *</label>
                                                    <TimeSelect name="endTime" value={endTime} onChange={setEndTime} required />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Keperluan *</label>
                                                <select
                                                    value={selectedPurpose}
                                                    onChange={(e) => setSelectedPurpose(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
                                                    required
                                                >
                                                    <option value="" disabled>-- Pilih Keperluan --</option>
                                                    {PURPOSE_TEMPLATES.map((purpose) => (
                                                        <option key={purpose} value={purpose}>{purpose}</option>
                                                    ))}
                                                </select>
                                                {selectedPurpose === 'Lainnya' && (
                                                    <textarea
                                                        value={customPurpose}
                                                        onChange={(e) => setCustomPurpose(e.target.value)}
                                                        rows={2}
                                                        placeholder="Jelaskan detail keperluan..."
                                                        className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200"
                                                        required
                                                    />
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Organisasi / Unit *</label>
                                                <select
                                                    value={organisasi}
                                                    onChange={(e) => setOrganisasi(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
                                                >
                                                    {ORGANISASI_OPTIONS.map(org => (
                                                        <option key={org} value={org}>{org}</option>
                                                    ))}
                                                </select>
                                                {organisasi === 'Lainnya' && (
                                                    <input
                                                        type="text"
                                                        value={customOrganisasi}
                                                        onChange={(e) => setCustomOrganisasi(e.target.value)}
                                                        placeholder="Ketik organisasi..."
                                                        className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200"
                                                        required
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolom Kanan: Pilih Alat & Berkas */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Detail Alat yang Dipinjam</h4>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Alat (Multiselect) *</label>
                                                <div className="flex gap-2 mb-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={itemSearch}
                                                            onChange={e => setItemSearch(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                                            placeholder="Cari alat berdasarkan nama / kode..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto p-2 bg-gray-50/50">
                                                    {filteredItems.map(item => (
                                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm rounded cursor-pointer transition-all">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedItemIds.includes(item.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedItemIds(prev => [...prev, item.id]);
                                                                    else setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                                                                }}
                                                                className="w-4 h-4 text-[#0F4C81] rounded focus:ring-[#0F4C81]"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium">{item.name}</p>
                                                                <p className="text-xs text-gray-500">{item.qrCode} ({item.category?.name})</p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                    {filteredItems.length === 0 && (
                                                        <div className="text-center p-4 text-gray-500 text-sm">
                                                            Tidak ada alat yang cocok.
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 font-medium">Terpilih: <span className="text-[#0F4C81]">{selectedItemIds.length}</span> alat</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Berkas Tambahan</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Upload className="w-4 h-4" /> Surat Izin Peminjaman (Opsional)
                                                </label>
                                                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handleFileChange}
                                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:border file:border-gray-200 hover:file:bg-gray-50 cursor-pointer"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Upload surat izin (format .pdf, maks. 2MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="bg-[#0F4C81] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 flex items-center shadow-lg shadow-[#0F4C81]/20">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Proses Peminjaman'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
