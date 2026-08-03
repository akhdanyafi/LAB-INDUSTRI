'use client';

import { useState, useEffect } from 'react';
import { Clock, Upload, Users, Building2, GraduationCap } from 'lucide-react';
import CalendarView from '@/components/shared/CalendarView';
import { createRoomBooking, getLecturers } from '@/features/bookings/actions';
import TimeSelect from '@/components/shared/TimeSelect';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';

interface Room {
    id: number;
    name: string;
    location: string;
    capacity: number;
}

interface Booking {
    id: number;
    startTime: Date;
    endTime: Date;
    purpose: string;
    status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Selesai' | 'Terlambat' | null;
    room: {
        id: number;
        name: string;
    };
}

interface Lecturer {
    identifier: string;
    fullName: string;
}

interface PracticumSchedule {
    id: number;
    roomId: number;
    roomName: string | null;
    courseName: string | null;
    courseCode: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    scheduledDate: Date;
}

interface RoomBookingClientProps {
    rooms: Room[];
    calendarBookings: Booking[];
    practicumSchedules?: PracticumSchedule[];
    userId: string;
    userRole?: string;
}

// Organization options
const ORGANISASI_OPTIONS = [
    'Pribadi',
    'HMIF',
    'Panitia Fortex',
    'Ketua Kelompok MK',
    'Lainnya',
];

// Purpose templates (same as attendance)
const PURPOSE_TEMPLATES = [
    'Penelitian/Riset',
    'Kegiatan belajar mandiri / kelompok',
    'Rapat HIMA / organisasi',
    'Praktikum atau persiapan tugas',
    'Kehadiran di area laboratorium',
    'Lainnya',
];

export default function RoomBookingClient({ rooms, calendarBookings, practicumSchedules = [], userId, userRole }: RoomBookingClientProps) {
    const { showAlert } = useAlert();
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    // New state fields
    const [organisasi, setOrganisasi] = useState('Pribadi');
    const [customOrganisasi, setCustomOrganisasi] = useState('');
    const [jumlahPeserta, setJumlahPeserta] = useState('1');
    const [dosenPembimbing, setDosenPembimbing] = useState('');
    const [suratFile, setSuratFile] = useState<File | null>(null);
    const [suratVerified, setSuratVerified] = useState<boolean | null>(null);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch lecturers on mount
    useEffect(() => {
        fetchLecturers();
    }, []);

    const fetchLecturers = async () => {
        try {
            const data = await getLecturers();
            setLecturers(data);
        } catch (error) {
            console.error('Failed to fetch lecturers:', error);
        }
    };

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert('Surat permohonan harus dalam format PDF.');
                e.target.value = '';
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran file maksimal 2MB');
                e.target.value = '';
                return;
            }
            setSuratFile(file);
            setSuratVerified(null); // Reset verification state
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const roomId = parseInt(formData.get('roomId') as string);
            const date = formData.get('date') as string;
            const startTimeVal = formData.get('startTime') as string;
            const endTimeVal = formData.get('endTime') as string;

            const startDateTime = new Date(`${date}T${startTimeVal}`);
            const endDateTime = new Date(`${date}T${endTimeVal}`);

            // Handle file upload if provided
            let suratPermohonanPath: string | undefined;
            let isVerified = false;
            if (suratFile) {
                // Create FormData for file upload
                const uploadFormData = new FormData();
                uploadFormData.append('file', suratFile);
                uploadFormData.append('folder', 'surat-permohonan');

                const uploadRes = await fetch('/api/upload?verify=true&type=suratPermohonan', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    suratPermohonanPath = uploadData.path;
                    isVerified = uploadData.verification?.valid === true;
                    setSuratVerified(isVerified);

                    // Log OCR usage for debugging
                    if (uploadData.verification?.ocrUsed) {
                        console.log(`[RoomBooking] OCR was used. Method: ${uploadData.verification.extractionMethod}, Score: ${uploadData.verification.score}%`);
                    }
                }
            }

            // Get final organisasi
            const finalOrganisasi = organisasi === 'Lainnya' ? customOrganisasi : organisasi;

            // Get final purpose (custom or selected)
            const finalPurpose = selectedPurpose === 'Lainnya' ? customPurpose : selectedPurpose;

            const result = await createRoomBooking({
                userId,
                roomId,
                startTime: startDateTime,
                endTime: endDateTime,
                purpose: finalPurpose,
                organisasi: finalOrganisasi,
                jumlahPeserta: parseInt(jumlahPeserta) || 1,
                suratPermohonan: suratPermohonanPath,
                suratVerified: isVerified,
                dosenPembimbing: dosenPembimbing || undefined,
            });

            if (!result?.success) {
                const { title, message } = translateError(result?.error, 'Gagal mengajukan booking.');
                showAlert({ title, message, type: 'error' });
                return;
            }

            // Show success message
            const statusMessage = suratPermohonanPath && isVerified
                ? 'Booking berhasil! Surat terverifikasi, pengajuan langsung disetujui.'
                : suratPermohonanPath && !isVerified
                    ? 'Booking berhasil diajukan! Surat tidak dapat diverifikasi otomatis dan akan divalidasi manual oleh admin.'
                    : 'Booking berhasil diajukan! Mohon tunggu validasi dari admin.';
            showAlert({ title: 'Berhasil', message: statusMessage, type: 'success' });

            // Reset form
            setSelectedPurpose('');
            setCustomPurpose('');
            setStartTime('');
            setEndTime('');
            setOrganisasi('Pribadi');
            setCustomOrganisasi('');
            setJumlahPeserta('1');
            setDosenPembimbing('');
            setSuratFile(null);
            setSuratVerified(null);
            // Reset file input
            const fileInput = document.getElementById('suratPermohonan') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error) {
            console.error(error);
            const { title, message } = translateError(error, 'Gagal mengajukan booking.');
            showAlert({ title, message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Calendar (Sidebar - 4 cols) */}
            <div className="lg:col-span-4 order-2 lg:order-1">
                <div className="lg:sticky lg:top-6">
                    <CalendarView
                        rooms={rooms}
                        bookings={calendarBookings}
                        practicumSchedules={practicumSchedules}
                        title="Cek Ketersediaan"
                        onDateSelect={handleDateSelect}
                        className="w-full min-h-[450px]"
                    />
                </div>
            </div>

            {/* Right Column: Booking Form (Main Content - 8 cols) */}
            <div className="lg:col-span-8 order-1 lg:order-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[450px]">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                        <Clock className="w-6 h-6 text-primary" />
                        Form Pengajuan Booking
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* PERUBAHAN 2: Internal Grid pada Form
                        Manfaatkan lebar baru dengan membagi input menjadi 2 kolom.
                    */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Kolom Kiri Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                                    <select
                                        name="roomId"
                                        required
                                        value={selectedRoomId}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                        className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Pilih Ruangan</option>
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>{room.name} - {room.location}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Building2 className="w-4 h-4" /> Organisasi/Unit
                                    </label>
                                    <select
                                        value={organisasi}
                                        onChange={(e) => setOrganisasi(e.target.value)}
                                        className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                            placeholder="Masukkan nama organisasi..."
                                            className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Users className="w-4 h-4" /> Jumlah Peserta
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={jumlahPeserta}
                                        onChange={(e) => setJumlahPeserta(e.target.value)}
                                        className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Kolom Kanan Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu</label>
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <input
                                            name="date"
                                            type="date"
                                            required
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <div className="flex gap-2 items-center">
                                            <TimeSelect
                                                name="startTime"
                                                value={startTime}
                                                onChange={setStartTime}
                                                required
                                            />
                                            <span className="text-gray-400 font-medium">-</span>
                                            <TimeSelect
                                                name="endTime"
                                                value={endTime}
                                                onChange={setEndTime}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {userRole !== 'Dosen' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <GraduationCap className="w-4 h-4" /> Dosen Pembimbing
                                        </label>
                                        <select
                                            value={dosenPembimbing}
                                            onChange={(e) => setDosenPembimbing(e.target.value)}
                                            className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Dosen Pembimbing Saya</option>
                                            {lecturers.map(lecturer => (
                                                <option key={lecturer.identifier} value={lecturer.fullName}>{lecturer.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Area Full Width (Bawah) */}
                        <div className="space-y-4 border-t pt-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keperluan</label>
                                <select
                                    value={selectedPurpose}
                                    onChange={(e) => setSelectedPurpose(e.target.value)}
                                    className="w-full max-w-full truncate px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                        className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Upload className="w-4 h-4" /> Surat Permohonan (Opsional)
                                </label>
                                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        id="suratPermohonan"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0F4C81] file:text-white hover:file:bg-[#0F4C81]/90"
                                    />
                                </div>
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <span className="text-lg">💡</span> Upload surat permohonan PDF untuk auto-approval (akan diverifikasi otomatis) — Maks. 2MB
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#0F4C81] text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-[#0F4C81]/20 hover:bg-[#0F4C81]/90 transition-all disabled:opacity-50 hover:-translate-y-0.5"
                            >
                                {isSubmitting ? 'Sedang Memproses...' : 'Ajukan Booking Ruangan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
