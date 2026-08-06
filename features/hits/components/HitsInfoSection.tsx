'use client';

import Link from 'next/link';
import { Flame, Tag, ArrowUpRight, ImageOff } from 'lucide-react';

export interface HitsInfoItem {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    focalX: number;
    focalY: number;
    link: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    createdAt: Date | string | null;
}

interface HitsInfoSectionProps {
    items: HitsInfoItem[];
    /** Tampilan ringkas untuk dashboard role */
    compact?: boolean;
    title?: string;
    subtitle?: string;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDate(value: Date | string | null): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function hexToRgba(hex: string | null, alpha: number): string {
    const fallback = '#2563EB';
    const value = (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) ? hex : fallback;
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HitsInfoSection({
    items,
    compact = false,
    title = 'Informasi Hits',
    subtitle = 'Kegiatan program studi & mahasiswa berprestasi',
}: HitsInfoSectionProps) {
    if (!items || items.length === 0) return null;

    return (
        <section
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'white',
                border: '1px solid #E8F0FE',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px -4px rgba(15,76,129,0.06)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0F6FF' }}>
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}
                    >
                        <Flame className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: '#0F172A' }}>{title}</h2>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{subtitle}</p>
                    </div>
                </div>
            </div>

            <div className={compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}>
                <div className={compact ? 'flex flex-col gap-3' : 'flex flex-col gap-4'}>
                    {items.map((item) => {
                        const badgeColor = item.categoryColor || '#2563EB';
                        const dateLabel = formatDate(item.createdAt);

                        const card = (
                            <article
                                className={`group grid grid-cols-1 sm:grid-cols-2 items-center rounded-2xl transition-all ${compact ? 'gap-3 p-3' : 'gap-4 sm:gap-5 p-4 sm:p-5'}`}
                                style={{ background: '#F8FAFD', border: '1px solid #EEF4FC' }}
                            >
                                {/* Foto 16:9 dengan titik fokus — berdiri sendiri, seluruh sudutnya rounded */}
                                <div
                                    className="relative w-full aspect-video overflow-hidden rounded-2xl bg-slate-100"
                                    style={{ boxShadow: '0 2px 6px rgba(15,23,42,0.08), 0 10px 24px -12px rgba(15,76,129,0.18)' }}
                                >
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-[1.03]"
                                            style={{ objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%` }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ color: '#94A3B8' }}>
                                            <ImageOff className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Konten kanan */}
                                <div className="flex flex-col justify-center gap-2 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.categoryName && (
                                            <span
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                                style={{ color: badgeColor, background: hexToRgba(badgeColor, 0.12) }}
                                            >
                                                <Tag className="w-3 h-3" />
                                                {item.categoryName}
                                            </span>
                                        )}
                                        {dateLabel && (
                                            <span className="text-[11px]" style={{ color: '#94A3B8' }}>{dateLabel}</span>
                                        )}
                                    </div>

                                    <h3
                                        className={`font-bold leading-snug ${compact ? 'text-sm line-clamp-2' : 'text-base sm:text-lg line-clamp-2'}`}
                                        style={{ color: '#0F172A' }}
                                    >
                                        {item.title}
                                    </h3>

                                    {item.description && (
                                        <p
                                            className={`${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'} leading-relaxed`}
                                            style={{ color: '#64748B' }}
                                        >
                                            {item.description}
                                        </p>
                                    )}

                                    {item.link && (
                                        <span
                                            className="inline-flex items-center gap-1 text-xs font-semibold mt-0.5"
                                            style={{ color: badgeColor }}
                                        >
                                            Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
                                        </span>
                                    )}
                                </div>
                            </article>
                        );

                        return (
                            <div key={item.id}>
                                {item.link ? (
                                    <Link
                                        href={item.link}
                                        target={item.link.startsWith('http') ? '_blank' : undefined}
                                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="block"
                                    >
                                        {card}
                                    </Link>
                                ) : (
                                    card
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
