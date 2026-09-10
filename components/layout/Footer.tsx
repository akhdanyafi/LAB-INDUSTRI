import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone, Globe, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0F4C81] text-white border-t border-blue-800">
            {/* --- Main Footer Content --- */}
            <div className="container mx-auto px-4 py-8 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">

                    {/* Kolom 1: Identitas & Deskripsi */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-white flex items-center justify-center p-1">
                                <Image
                                    src="/fst-icon.png"
                                    alt="Logo Lab Informatika"
                                    width={48}
                                    height={48}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl leading-none">Lab Teknik Industri</h3>
                                <span className="text-xs text-blue-200 uppercase tracking-wider">Universitas Al Azhar Indonesia</span>
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
                            Pusat pengembangan keahlian praktis, riset, dan inovasi teknologi bagi mahasiswa Teknik Industri UAI. Melayani peminjaman alat, ruang lab, dan dukungan praktikum.
                        </p>
                        <div className="flex gap-4 pt-2">
                            {/* Social Icons: Hover effect menggunakan warna Aksen #F59E0B */}
                            <a href="https://www.instagram.com/if.uai/" className="text-blue-200 hover:text-[#F59E0B] transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="https://www.linkedin.com/school/universitasalazharindonesia/" className="text-blue-200 hover:text-[#F59E0B] transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="https://if.uai.ac.id" target="_blank" className="text-blue-200 hover:text-[#F59E0B] transition-colors"><Globe className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Kolom 2: Tautan Cepat (Navigasi) */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-[#F59E0B]"></span> {/* Garis Aksen */}
                            Akses Cepat
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/login" className="text-blue-100 hover:text-[#F59E0B] hover:pl-1 transition-all">
                                    Dashboard & Peminjaman
                                </Link>
                            </li>
                            <li>
                                <a href="#calendar" className="text-blue-100 hover:text-[#F59E0B] hover:pl-1 transition-all">
                                    Jadwal Laboratorium
                                </a>
                            </li>
                            <li>
                                <a href="#sop" className="text-blue-100 hover:text-[#F59E0B] hover:pl-1 transition-all">
                                    SOP & Tata Tertib
                                </a>
                            </li>
                            <li>
                                <Link href="/publications" className="text-blue-100 hover:text-[#F59E0B] hover:pl-1 transition-all">
                                    Publikasi Mahasiswa
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-blue-100 hover:text-[#F59E0B] hover:pl-1 transition-all">
                                    Login Portal
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Kontak & Lokasi */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-[#F59E0B]"></span>
                            Hubungi Kami
                        </h4>
                        <ul className="space-y-4 text-sm text-blue-100">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                                <span>
                                    Komplek Masjid Agung Al Azhar,<br />
                                    Jl. Sisingamangaraja, Kebayoran Baru,<br />
                                    Jakarta Selatan 12110
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-[#F59E0B] shrink-0" />
                                <a href="mailto:lab.industri@uai.ac.id" className="hover:text-white hover:underline decoration-[#F59E0B]">
                                    lab.industri@uai.ac.id
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-[#F59E0B] shrink-0" />
                                <span>(021) 727 92753</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- Bottom Footer: Copyright --- */}
            <div className="bg-[#0A365C] py-6 border-t border-white/5">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-300">
                    <p>&copy; {currentYear} Teknik Industri Universitas Al Azhar Indonesia. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}