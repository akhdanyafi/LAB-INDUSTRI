'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, UserCheck, MapPin, Target, GraduationCap } from 'lucide-react';
import { checkIn, getRooms, getLecturers } from '../actions';
import { getCurrentDateTime } from '@/lib/formatters';
import { PURPOSE_TEMPLATES } from '../types';
import type { AttendanceRecord } from '../types';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData?: {
        identifier: string;
        role: string;
        dosenPembimbing?: string;
    };
}

interface Room {
    id: number;
    name: string;
    location: string;
}

interface Lecturer {
    identifier: string;
    fullName: string;
}

type ModalState = 'form' | 'loading' | 'success' | 'error';

export default function AttendanceModal({ isOpen, onClose, userData }: AttendanceModalProps) {
    const [nim, setNim] = useState(userData?.identifier || '');
    const [roomId, setRoomId] = useState<number>(0);
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [customPurpose, setCustomPurpose] = useState('');
    const [dosenPenanggungJawab, setDosenPenanggungJawab] = useState(userData?.dosenPembimbing || '');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [modalState, setModalState] = useState<ModalState>('form');
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [checkInTime, setCheckInTime] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch rooms and lecturers when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchRooms();
            fetchLecturers();
        }
    }, [isOpen]);

    const fetchRooms = async () => {
        try {
            const roomList = await getRooms();
            setRooms(roomList);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const fetchLecturers = async () => {
        try {
            const lecturerList = await getLecturers();
            setLecturers(lecturerList);
        } catch (error) {
            console.error('Failed to fetch lecturers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalState('loading');
        setErrorMessage('');

        // Determine final purpose (custom or selected)
        const finalPurpose = selectedPurpose === 'Lainnya' ? customPurpose : selectedPurpose;

        // Pass dosenPenanggungJawab (empty string if not selected, will use user's dosenPembimbing)
        const result = await checkIn(nim, roomId, finalPurpose, dosenPenanggungJawab || undefined);

        if (result.success && result.data) {
            setAttendance(result.data);
            setCheckInTime(getCurrentDateTime());
            setModalState('success');
        } else {
            setErrorMessage(result.error || 'Terjadi kesalahan');
            setModalState('error');
        }
    };

    const handleClose = () => {
        setNim('');
        setRoomId(0);
        setSelectedPurpose('');
        setCustomPurpose('');
        setDosenPenanggungJawab('');
        setModalState('form');
        setAttendance(null);
        setCheckInTime('');
        setErrorMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0F4C81] to-[#1E6BB8] px-6 py-4 flex items-center justify-between sticky top-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-6 h-6" />
                        Absen Masuk Lab
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {modalState === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* NIM Input (Hidden if logged in user data is provided) */}
                            {!userData && (
                                <div>
                                    <label htmlFor="nim" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nomor Induk Mahasiswa / Dosen
                                    </label>
                                    <input
                                        id="nim"
                                        type="text"
                                        value={nim}
                                        onChange={(e) => setNim(e.target.value)}
                                        placeholder="Masukkan NIM atau ID Anda"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all text-lg"
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Room Selection */}
                            <div>
                                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Pilih Ruangan
                                </label>
                                <select
                                    id="room"
                                    value={roomId}
                                    onChange={(e) => setRoomId(Number(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all text-gray-700 bg-white"
                                    required
                                >
                                    <option value={0} disabled>-- Pilih Ruangan --</option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} - {room.location}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Purpose Selection */}
                            <div>
                                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Tujuan
                                </label>
                                <select
                                    id="purpose"
                                    value={selectedPurpose}
                                    onChange={(e) => setSelectedPurpose(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all text-gray-700 bg-white"
                                    required
                                >
                                    <option value="" disabled>-- Pilih Tujuan --</option>
                                    {PURPOSE_TEMPLATES.map((purpose) => (
                                        <option key={purpose} value={purpose}>
                                            {purpose}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Purpose Input (shown when "Lainnya" selected) */}
                            {selectedPurpose === 'Lainnya' && (
                                <div className="animate-in slide-in-from-top duration-200">
                                    <label htmlFor="customPurpose" className="block text-sm font-medium text-gray-700 mb-2">
                                        Tujuan Lainnya
                                    </label>
                                    <input
                                        id="customPurpose"
                                        type="text"
                                        value={customPurpose}
                                        onChange={(e) => setCustomPurpose(e.target.value)}
                                        placeholder="Tuliskan tujuan Anda..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            )}

                            {/* Dosen Penanggung Jawab Selection (Hidden for Lecturer role) */}
                            {userData?.role !== 'Dosen' && (
                                <div>
                                    <label htmlFor="dosenPenanggungJawab" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Dosen Penanggung Jawab
                                    </label>
                                    <select
                                        id="dosenPenanggungJawab"
                                        value={dosenPenanggungJawab}
                                        onChange={(e) => setDosenPenanggungJawab(e.target.value)}
                                        className="w-full max-w-full truncate px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all text-gray-700 bg-white"
                                    >
                                        <option value="">Dosen Pembimbing Saya / Tidak Memiliki</option>
                                        {lecturers.map((lecturer) => (
                                            <option key={lecturer.identifier} value={lecturer.fullName}>
                                                {lecturer.fullName}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan untuk menggunakan dosen pembimbing Anda</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white py-3 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg"
                            >
                                Absen Sekarang
                            </button>
                        </form>
                    )}

                    {modalState === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-[#0F4C81] animate-spin mb-4" />
                            <p className="text-gray-600">Memproses absensi...</p>
                        </div>
                    )}

                    {modalState === 'success' && attendance && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Absen Berhasil!</h3>
                                <p className="text-gray-600">Selamat datang di Lab Teknik Industri</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-500 text-sm">Nama</span>
                                    <span className="font-semibold text-gray-800">{attendance.user?.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-500 text-sm">NIM</span>
                                    <span className="font-semibold text-gray-800">{attendance.user?.identifier}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-500 text-sm">Ruangan</span>
                                    <span className="font-semibold text-gray-800">{attendance.room?.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-500 text-sm">Tujuan</span>
                                    <span className="font-semibold text-gray-800">{attendance.purpose}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-500 text-sm">Dosen Penanggung Jawab</span>
                                    <span className="font-semibold text-gray-800">{attendance.dosenPenanggungJawab}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 text-sm">Waktu Check-in</span>
                                    <span className="font-semibold text-gray-800 text-right text-sm">
                                        {checkInTime}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all"
                            >
                                Selesai
                            </button>
                        </div>
                    )}

                    {modalState === 'error' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    <AlertCircle className="w-12 h-12 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-red-600 mb-2">Gagal Absen</h3>
                                <p className="text-gray-600">{errorMessage}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModalState('form')}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                                >
                                    Coba Lagi
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
