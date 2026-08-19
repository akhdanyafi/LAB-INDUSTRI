'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Upload } from 'lucide-react';
import { adminManualBooking } from '@/features/bookings/actions';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';
import TimeSelect from '@/components/shared/TimeSelect';

const PURPOSE_TEMPLATES = [
    'Penelitian/Riset',
    'Kegiatan belajar mandiri / kelompok',
    'Rapat HIMA / organisasi',
    'Praktikum atau persiapan tugas',
    'Kehadiran di area laboratorium',
    'Lainnya',
];

const ORGANISASI_OPTIONS = [
    'Pribadi',
    'HMIF',
    'Panitia Fortex',
    'Ketua Kelompok MK',
    'Lainnya',
];

interface ManualBookingButtonProps {
    rooms: { id: number; name: string; capacity: number }[];
    lecturers: { identifier: string; fullName: string; }[];
    adminId: string;
}

export default function ManualBookingButton({ rooms, lecturers, adminId }: ManualBookingButtonProps) {
    const { showAlert } = useAlert();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New States
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    const [dosenPembimbing, setDosenPembimbing] = useState('');
    const [customDosen, setCustomDosen] = useState('');
    const [organisasi, setOrganisasi] = useState('Pribadi');
    const [customOrganisasi, setCustomOrganisasi] = useState('');
    const [jumlahPeserta, setJumlahPeserta] = useState<number>(1);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [suratFile, setSuratFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                showAlert({ title: 'Format Tidak Valid', message: 'Surat permohonan harus dalam format PDF.', type: 'error' });
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
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            // Upload surat permohonan if exists
            let suratPath: string | undefined;
            if (suratFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', suratFile);
                uploadFormData.append('folder', 'surat-permohonan');

                const uploadRes = await fetch('/api/upload?type=suratPermohonan', {
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

            const result = await adminManualBooking({
                identifier: formData.get('identifier') as string,
                fullName: formData.get('fullName') as string,
                phoneNumber: formData.get('phoneNumber') as string || undefined,
                dosenPembimbing: finalDosen || undefined,
                roomId: parseInt(formData.get('roomId') as string),
                startTime: new Date(`${formData.get('startDate')}T${formData.get('startTime')}`),
                endTime: new Date(`${formData.get('endDate')}T${formData.get('endTime')}`),
                purpose: finalPurpose,
                jumlahPeserta: jumlahPeserta,
                organisasi: finalOrganisasi,
                suratPermohonan: suratPath,
                validatorId: adminId
            });

            if (!result?.success) {
                const { title, message } = translateError(result?.error, 'Gagal memproses booking');
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
            setJumlahPeserta(1);
            setStartTime('');
            setEndTime('');
            setSuratFile(null);
            showAlert({ title: 'Berhasil', message: 'Booking manual berhasil diproses', type: 'success' });
        } catch (error: any) {
            const { title, message } = translateError(error, 'Gagal memproses booking');
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
                Booking Manual
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Form Booking Manual</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Kolom Kiri: Data Pemesan */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Data Pemesan</h4>
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

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Peserta *</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={jumlahPeserta}
                                                        onChange={(e) => setJumlahPeserta(parseInt(e.target.value))}
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-200"
                                                        required
                                                    />
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
                                    </div>

                                    {/* Kolom Kanan: Detail Booking */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 pb-2 border-b">Detail Booking</h4>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Ruangan *</label>
                                                <select required name="roomId" className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white">
                                                    <option value="">Pilih Ruangan</option>
                                                    {rooms.map(room => (
                                                        <option key={room.id} value={room.id}>{room.name} ({room.capacity} org)</option>
                                                    ))}
                                                </select>
                                            </div>

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
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Selesai *</label>
                                                    <input type="date" required name="endDate" className="w-full px-3 py-1.5 rounded-md border text-sm bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Jam Selesai *</label>
                                                    <TimeSelect name="endTime" value={endTime} onChange={setEndTime} required />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                    <Upload className="w-4 h-4" /> Surat Permohonan (Opsional)
                                                </label>
                                                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handleFileChange}
                                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:border file:border-gray-200 hover:file:bg-gray-50 cursor-pointer"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Upload surat permohonan (format .pdf, maks. 2MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="bg-[#0F4C81] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 flex items-center shadow-lg shadow-[#0F4C81]/20">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Proses Booking'}
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
