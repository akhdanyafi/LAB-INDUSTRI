'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/features/users/register';
import { checkPreRegisteredUser } from '@/features/users/enrollment';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface Lecturer {
    identifier: string;
    fullName: string;
}

interface RegisterFormProps {
    lecturers: Lecturer[];
}

interface PreRegisteredData {
    fullName: string;
    batch: number | null;
    studyType: 'Reguler' | 'Hybrid' | null;
    programStudi: string | null;
    dosenPembimbing: string | null;
}

export default function RegisterForm({ lecturers }: RegisterFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingNIM, setIsCheckingNIM] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [preRegistered, setPreRegistered] = useState<PreRegisteredData | null>(null);

    // State-controlled form values for auto-fill
    const [fullName, setFullName] = useState('');
    const [batch, setBatch] = useState('');
    const [studyType, setStudyType] = useState('');
    const [programStudi, setProgramStudi] = useState('Informatika');
    const [dosenPembimbing, setDosenPembimbing] = useState('');

    // Check NIM when user finishes typing
    const handleNIMChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const nim = e.target.value.trim();

        if (nim.length < 5) {
            setPreRegistered(null);
            return;
        }

        setIsCheckingNIM(true);
        try {
            const data = await checkPreRegisteredUser(nim);
            if (data) {
                setPreRegistered(data);
                // Auto-fill form fields using state
                setFullName(data.fullName);
                if (data.batch) setBatch(data.batch.toString());
                if (data.studyType) setStudyType(data.studyType);
                if (data.programStudi) setProgramStudi(data.programStudi);
                if (data.dosenPembimbing) setDosenPembimbing(data.dosenPembimbing);
            } else {
                setPreRegistered(null);
            }
        } catch (err) {
            console.error('Error checking NIM:', err);
        } finally {
            setIsCheckingNIM(false);
        }
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const result = await register(formData);

        if (result.success) {
            router.push('/login?registered=true');
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Pendaftaran Akun</h1>
                    <p className="text-gray-500 mt-2">Buat akun baru untuk mengakses laboratorium</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                {preRegistered && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Data ditemukan! Form sudah terisi otomatis.</span>
                    </div>
                )}

                <form action={handleSubmit} className="space-y-4">
                    {/* NIM - First field to enable auto-fill */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
                        <div className="relative">
                            <input
                                name="identifier"
                                type="text"
                                required
                                onChange={handleNIMChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                                placeholder="Contoh: 0102521001"
                            />
                            {isCheckingNIM && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Masukkan NIM untuk mengecek data pre-registrasi</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => !preRegistered && setFullName(e.target.value)}
                            readOnly={!!preRegistered}
                            className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all ${preRegistered ? 'bg-gray-50 text-gray-600' : ''}`}
                            placeholder="Contoh: Budi Santoso"
                        />
                        {preRegistered && (
                            <p className="text-xs text-green-600 mt-1">Nama sesuai data pre-registrasi</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
                            <select
                                name="batch"
                                required
                                value={batch}
                                onChange={(e) => setBatch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="">Pilih Tahun</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={String(year)}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                            <select
                                name="studyType"
                                required
                                value={studyType}
                                onChange={(e) => setStudyType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="">Pilih Tipe</option>
                                <option value="Reguler">Reguler</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
                            <input
                                name="programStudi"
                                type="text"
                                required
                                value={programStudi}
                                onChange={(e) => setProgramStudi(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                                placeholder="Contoh: Informatika"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pembimbing <span className="text-red-500">*</span></label>
                            <select
                                name="dosenPembimbing"
                                required
                                value={dosenPembimbing}
                                onChange={(e) => setDosenPembimbing(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="">Pilih Dosen</option>
                                {lecturers.map(lecturer => (
                                    <option key={lecturer.identifier} value={lecturer.fullName}>
                                        {lecturer.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                            placeholder="nama@student.uai.ac.id"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F4C81] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F4C81] transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0F4C81] text-white py-2.5 rounded-lg font-medium hover:bg-[#0F4C81]/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Mendaftar...
                            </>
                        ) : (
                            'Daftar'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-[#0F4C81] font-medium hover:underline">
                        Masuk disini
                    </Link>
                </div>
            </div>
        </div>
    );
}
