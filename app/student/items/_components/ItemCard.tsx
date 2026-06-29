'use client';

import { useState, useEffect } from 'react';
import { Box, MapPin, Tag, Calendar, Clock, Building2, GraduationCap, Upload, Check, Hash } from 'lucide-react';
import { createLoanRequest, getLecturersForLoan } from '@/features/loans/actions';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/providers/AlertProvider';
import TimeSelect from '@/components/shared/TimeSelect';

// Organization options
const ORGANISASI_OPTIONS = [
    'Pribadi',
    'HMIF',
    'Panitia Fortex',
    'Ketua Kelompok MK',
    'Lainnya',
];

// Purpose templates
const PURPOSE_TEMPLATES = [
    'Penelitian/Riset',
    'Kegiatan belajar mandiri / kelompok',
    'Rapat HIMA / organisasi',
    'Praktikum atau persiapan tugas',
    'Kehadiran di area laboratorium',
    'Lainnya',
];

// Software options for PC/Server
const SOFTWARE_OPTIONS = [
    'Web Server',
    'Database Server',
    'GPU Server',
    'Lego',
    'Visual Studio Code',
    'Python',
    'Ollama',
    'Virtual Box',
    'Anydesk',
];

// Categories that require software selection
const PC_SERVER_CATEGORIES = ['PC', 'Server', 'Komputer', 'Laptop'];

interface Lecturer {
    identifier: string;
    fullName: string;
}

export default function ItemCard({ item, userId, variant = 'grid', role = 'student', initialOpen = false, onEdit, onDelete, onStatusChange }: { item: any; userId: string; variant?: 'grid' | 'list', role?: 'student' | 'lecturer' | 'admin', initialOpen?: boolean, onEdit?: () => void, onDelete?: () => void, onStatusChange?: (status: string) => void }) {
    const { showAlert } = useAlert();
    const [showModal, setShowModal] = useState(initialOpen);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Form state
    const [returnDate, setReturnDate] = useState('');
    const [loanDate, setLoanDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [organisasi, setOrganisasi] = useState('Pribadi');
    const [customOrganisasi, setCustomOrganisasi] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    const [dosenPembimbing, setDosenPembimbing] = useState('');
    const [suratFile, setSuratFile] = useState<File | null>(null);
    const [suratVerified, setSuratVerified] = useState<boolean | null>(null);
    const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
    const [customSoftware, setCustomSoftware] = useState('');
    const [hasCustomSoftware, setHasCustomSoftware] = useState(false);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);

    // Check if item is PC/Server category
    const isPCServerCategory = PC_SERVER_CATEGORIES.some(
        cat => item.category.name.toLowerCase().includes(cat.toLowerCase())
    );

    // Fetch lecturers
    useEffect(() => {
        getLecturersForLoan().then(setLecturers);
    }, []);

    const handleSoftwareToggle = (software: string) => {
        setSelectedSoftware(prev =>
            prev.includes(software)
                ? prev.filter(s => s !== software)
                : [...prev, software]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Only allow PDF for surat izin
            if (file.type !== 'application/pdf') {
                showAlert({ title: 'Format Tidak Valid', message: 'Surat izin harus dalam format PDF', type: 'error' });
                e.target.value = '';
                return;
            }
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                showAlert({ title: 'Ukuran Terlalu Besar', message: 'Ukuran file maksimal 2MB', type: 'error' });
                e.target.value = '';
                return;
            }
            setSuratFile(file);
            setSuratVerified(null);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Handle file upload if provided
            let suratIzinPath: string | undefined;
            let isVerified = false;
            if (suratFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', suratFile);
                uploadFormData.append('folder', 'surat-izin');

                const uploadRes = await fetch('/api/upload?verify=true&type=suratIzin', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    suratIzinPath = uploadData.path;
                    isVerified = uploadData.verification?.valid === true;
                    setSuratVerified(isVerified);

                    // Log OCR usage for debugging
                    if (uploadData.verification?.ocrUsed) {
                        console.log(`[ItemCard] OCR was used. Method: ${uploadData.verification.extractionMethod}, Score: ${uploadData.verification.score}%`);
                    }
                }
            }

            // Get final values
            const finalOrganisasi = organisasi === 'Lainnya' ? customOrganisasi : organisasi;
            const finalPurpose = selectedPurpose === 'Lainnya' ? customPurpose : selectedPurpose;

            // Combine software selections
            const finalSoftware = [...selectedSoftware];
            if (hasCustomSoftware && customSoftware.trim()) {
                finalSoftware.push(customSoftware.trim());
            }

            // Build start/end datetime
            const startDateTime = loanDate && startTime
                ? new Date(`${loanDate}T${startTime}`)
                : undefined;
            const endDateTime = loanDate && endTime
                ? new Date(`${loanDate}T${endTime}`)
                : undefined;

            const res = await createLoanRequest({
                studentId: userId,
                itemId: item.id,
                returnPlanDate: new Date(returnDate),
                organisasi: finalOrganisasi,
                startTime: startDateTime,
                endTime: endDateTime,
                purpose: finalPurpose,
                suratIzin: suratIzinPath,
                suratVerified: isVerified,
                dosenPembimbing: dosenPembimbing || undefined,
                software: isPCServerCategory && finalSoftware.length > 0 ? finalSoftware : undefined,
            });

            if (res?.error) {
                showAlert({ title: 'Gagal', message: res.error, type: 'error' });
                return;
            }

            // Show success message
            const statusMessage = suratIzinPath && isVerified
                ? 'Permintaan peminjaman berhasil! Surat izin terverifikasi, peminjaman langsung disetujui.'
                : suratIzinPath && !isVerified
                    ? 'Permintaan peminjaman berhasil dikirim! Surat izin tidak dapat diverifikasi otomatis dan akan divalidasi manual oleh admin.'
                    : 'Permintaan peminjaman berhasil dikirim! Mohon tunggu validasi dari admin.';
            await showAlert({ title: 'Berhasil', message: statusMessage, type: 'success' });

            setShowModal(false);
            resetForm();
            router.refresh();
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'Gagal mengirim permintaan', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setReturnDate('');
        setLoanDate('');
        setStartTime('');
        setEndTime('');
        setOrganisasi('Pribadi');
        setCustomOrganisasi('');
        setSelectedPurpose('');
        setCustomPurpose('');
        setDosenPembimbing('');
        setSuratFile(null);
        setSuratVerified(null);
        setSelectedSoftware([]);
        setCustomSoftware('');
        setHasCustomSoftware(false);
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minReturnDate = tomorrow.toISOString().split('T')[0];

    return (
        <>
            {variant === 'list' ? (
                <button
                    onClick={() => setShowModal(true)}
                    className="text-sm font-medium text-white bg-[#0F4C81] hover:bg-[#0F4C81]/90 px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                >
                    Pinjam
                </button>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Box className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                                {item.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span>{item.category.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{item.room.name}</span>
                            </div>
                            {typeof item.quantity === 'number' && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Hash className="w-4 h-4 text-gray-400" />
                                    <span>Jumlah: {item.quantity}</span>
                                </div>
                            )}
                        </div>

                        {role === 'admin' ? (
                            <div className="flex gap-2">
                                <select
                                    defaultValue={item.status || 'Tersedia'}
                                    onChange={(e) => onStatusChange?.(e.target.value)}
                                    className={`flex-1 text-xs font-medium px-2 py-2 rounded-lg border-0 cursor-pointer text-center ${item.status === 'Tersedia' ? 'bg-green-50 text-green-700' :
                                        item.status === 'Dipinjam' ? 'bg-orange-50 text-orange-700' :
                                            'bg-gray-50 text-gray-700'
                                        }`}
                                    disabled={item.status === 'Dipinjam'}
                                >
                                    <option value="Tersedia">Tersedia</option>
                                    <option value="Maintenance">Maintenance</option>
                                    {item.status === 'Dipinjam' && <option value="Dipinjam">Dipinjam</option>}
                                </select>
                                <button
                                    onClick={onEdit}
                                    className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full bg-[#0F4C81] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors"
                            >
                                Ajukan Peminjaman
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Enhanced Loan Request Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Box className="w-6 h-6 text-[#0F4C81]" />
                            Ajukan Peminjaman
                        </h3>

                        {/* Item Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.category.name} • {item.room.name}</p>
                        </div>

                        <form onSubmit={handleRequest} className="space-y-4">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Organisasi */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Building2 className="w-4 h-4" /> Organisasi/Unit
                                    </label>
                                    <select
                                        value={organisasi}
                                        onChange={(e) => setOrganisasi(e.target.value)}
                                        className="w-full max-w-full truncate px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
                                            placeholder="Nama organisasi..."
                                            className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                            required
                                        />
                                    )}
                                </div>

                                {/* Dosen Pembimbing */}
                                {role === 'student' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <GraduationCap className="w-4 h-4" /> Dosen Pembimbing
                                        </label>
                                        <select
                                            value={dosenPembimbing}
                                            onChange={(e) => setDosenPembimbing(e.target.value)}
                                            className="w-full max-w-full truncate px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        >
                                            <option value="">-- Pilih Dosen --</option>
                                            {lecturers.map(lecturer => (
                                                <option key={lecturer.identifier} value={lecturer.fullName}>
                                                    {lecturer.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Tanggal Peminjaman */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Tanggal Peminjaman
                                    </label>
                                    <input
                                        type="date"
                                        value={loanDate}
                                        onChange={(e) => setLoanDate(e.target.value)}
                                        min={today}
                                        required
                                        className="w-full max-w-full truncate px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                    />
                                </div>

                                {/* Tanggal Pengembalian */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Tanggal Pengembalian
                                    </label>
                                    <input
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        min={loanDate || minReturnDate}
                                        required
                                        className="w-full max-w-full truncate px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                    />
                                </div>

                                {/* Waktu Mulai */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Waktu Mulai
                                    </label>
                                    <TimeSelect
                                        value={startTime}
                                        onChange={setStartTime}
                                        required
                                    />
                                </div>

                                {/* Waktu Selesai */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Waktu Selesai
                                    </label>
                                    <TimeSelect
                                        value={endTime}
                                        onChange={setEndTime}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Keperluan (Full Width) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keperluan/Tujuan</label>
                                <select
                                    value={selectedPurpose}
                                    onChange={(e) => setSelectedPurpose(e.target.value)}
                                    className="w-full max-w-full truncate px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                    required
                                >
                                    <option value="" disabled>-- Pilih Keperluan --</option>
                                    {PURPOSE_TEMPLATES.map(purpose => (
                                        <option key={purpose} value={purpose}>{purpose}</option>
                                    ))}
                                </select>
                                {selectedPurpose === 'Lainnya' && (
                                    <textarea
                                        value={customPurpose}
                                        onChange={(e) => setCustomPurpose(e.target.value)}
                                        rows={2}
                                        placeholder="Jelaskan keperluan Anda..."
                                        className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        required
                                    />
                                )}
                            </div>

                            {/* Software Selection (Only for PC/Server) */}
                            {isPCServerCategory && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <label className="block text-sm font-medium text-blue-800 mb-3">
                                        🖥️ Software yang Diperlukan
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {SOFTWARE_OPTIONS.map(software => (
                                            <label
                                                key={software}
                                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${selectedSoftware.includes(software)
                                                    ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                                                    : 'bg-white border-gray-200 hover:border-[#0F4C81]'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSoftware.includes(software)}
                                                    onChange={() => handleSoftwareToggle(software)}
                                                    className="sr-only"
                                                />
                                                {selectedSoftware.includes(software) && (
                                                    <Check className="w-4 h-4 flex-shrink-0" />
                                                )}
                                                <span className="text-xs font-medium">{software}</span>
                                            </label>
                                        ))}

                                        {/* Lainnya checkbox */}
                                        <label
                                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${hasCustomSoftware
                                                ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                                                : 'bg-white border-gray-200 hover:border-[#0F4C81]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={hasCustomSoftware}
                                                onChange={() => setHasCustomSoftware(!hasCustomSoftware)}
                                                className="sr-only"
                                            />
                                            {hasCustomSoftware && (
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                            )}
                                            <span className="text-xs font-medium">Lainnya</span>
                                        </label>
                                    </div>

                                    {hasCustomSoftware && (
                                        <input
                                            type="text"
                                            value={customSoftware}
                                            onChange={(e) => setCustomSoftware(e.target.value)}
                                            placeholder="Nama software lainnya..."
                                            className="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        />
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Upload className="w-4 h-4" /> Surat Izin/Permohonan
                                    <span className="text-xs text-gray-400 font-normal ml-1">(Opsional)</span>
                                </label>
                                <div className="flex items-center gap-4 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0F4C81] file:text-white hover:file:bg-[#0F4C81]/90"
                                    />
                                </div>
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    💡 Upload surat izin PDF untuk auto-approval (akan diverifikasi otomatis) — Maks. 2MB
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#0F4C81] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Mengirim...' : 'Kirim Permintaan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
