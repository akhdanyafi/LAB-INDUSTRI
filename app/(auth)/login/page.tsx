'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { login } from '@/features/auth/actions';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);

    // Check if user just registered
    const justRegistered = searchParams.get('registered') === 'true';
    const callbackUrl = searchParams.get('callbackUrl');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await login({ email, password });
            if (res?.error) {
                setError(res.error);
            } else {
                // Redirect to callback URL if provided, otherwise to dashboard
                router.push(callbackUrl || '/dashboard');
            }
        } catch (err: any) {
            setError('Login gagal. Periksa kembali kredensial Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Background Utama: #F3F4F6
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-4 font-sans">

            {/* Card Container: #FFFFFF */}
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Header Section */}
                <div className="p-8 pb-0 text-center">
                    {/* Logo Box (Branding) */}
                    <div className="mx-auto w-fit rounded-xl overflow-hidden shadow-md mb-4">
                        <Image
                            src="/fst-icon.png"
                            alt="Logo Lab Informatika"
                            width={120}
                            height={120}
                            className="object-contain w-auto h-auto max-w-[120px] max-h-[120px]"
                        />
                    </div>

                    {/* Text Utama: #0F4C81 */}
                    <h1 className="text-2xl font-bold text-[#0F4C81] mb-2 tracking-tight">
                        Selamat Datang
                    </h1>
                    {/* Text Sekunder: #6B7280 */}
                    <p className="text-[#6B7280] text-sm">
                        Portal Lab Teknik Industri<br />Universitas Al Azhar Indonesia
                    </p>
                </div>

                <div className="p-8 pt-6">
                    {/* Success Registration Notice */}
                    {justRegistered && (
                        <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="text-green-800 text-sm">
                                <p className="font-semibold">Pendaftaran Berhasil!</p>
                                <p className="mt-1">Akun Anda sedang menunggu validasi dari Admin. Silakan coba login kembali setelah akun diverifikasi.</p>
                            </div>
                        </div>
                    )}

                    {/* Error State: Danger Red #EF4444 */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-lg">
                            <div className="text-[#EF4444] text-sm font-medium">
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Email/NIM */}
                        <div>
                            <label className="block text-sm font-semibold text-[#1F2937] mb-2">
                                Email Universitas atau NIM
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F4C81] transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 text-[#1F2937] placeholder-gray-400 focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 outline-none transition-all"
                                    placeholder="nama@uai.ac.id atau NIM"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-[#1F2937]">
                                    Password
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F4C81] transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 text-[#1F2937] placeholder-gray-400 focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
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

                        {/* Submit Button: Primary #0F4C81 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0F4C81] hover:bg-[#1A365D] text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Masuk ke Portal'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <div className="text-gray-500 mb-2">
                            Belum punya akun?{' '}
                            <Link href="/register" className="text-[#0F4C81] font-medium hover:underline">
                                Ajukan Pembuatan Akun
                            </Link>
                        </div>
                        <p className="text-gray-400 text-xs">
                            Lupa password? Hubungi admin untuk reset password manual
                        </p>
                    </div>
                </div>

                {/* Footer Card */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0F4C81] font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0F4C81]" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
