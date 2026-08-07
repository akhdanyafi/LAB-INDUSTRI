'use client';

import { useCallback, useEffect, useState } from 'react';
import { Newspaper, Tag, ArrowUpRight, ImageOff, ChevronLeft, ChevronRight, X, CalendarDays, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewportPortal from '@/components/shared/ViewportPortal';

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

/** Durasi tiap slide sebelum berpindah otomatis */
const SLIDE_DURATION = 6000;

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
    title = 'Informasi Terkini',
    subtitle = 'Informasi terkait kegiatan program studi dan informasi menarik lainnya',
}: HitsInfoSectionProps) {
    const total = items?.length ?? 0;
    const [active, setActive] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const [detailItem, setDetailItem] = useState<HitsInfoItem | null>(null);

    const goTo = useCallback((index: number) => {
        setDirection(index > active ? 1 : -1);
        setActive((index + total) % total);
    }, [active, total]);

    const next = useCallback(() => {
        setDirection(1);
        setActive((prev) => (prev + 1) % total);
    }, [total]);

    const prev = useCallback(() => {
        setDirection(-1);
        setActive((current) => (current - 1 + total) % total);
    }, [total]);

    // Auto-play — berhenti saat pointer/fokus berada di dalam slider atau popup terbuka
    useEffect(() => {
        if (total <= 1 || paused || detailItem) return;
        const timer = setInterval(next, SLIDE_DURATION);
        return () => clearInterval(timer);
    }, [total, paused, detailItem, next]);

    const headerIcon = (
        <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
        >
            <Newspaper className="w-4 h-4 text-white" />
        </div>
    );

    // Data belum ada — section tetap tampil dengan pesan kosong
    if (!items || total === 0) {
        return (
            <section
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'white',
                    border: '1px solid #E8F0FE',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px -4px rgba(15,76,129,0.06)',
                }}
            >
                <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid #F0F6FF' }}>
                    {headerIcon}
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold truncate" style={{ color: '#0F172A' }}>{title}</h2>
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{subtitle}</p>
                    </div>
                </div>
                <div className={`flex flex-col items-center justify-center text-center gap-2 ${compact ? 'py-8' : 'py-14'}`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#F1F6FE' }}>
                        <Inbox className="w-5 h-5" style={{ color: '#94A3B8' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#64748B' }}>Tidak ada informasi saat ini</p>
                </div>
            </section>
        );
    }

    const item = items[active];
    const accent = item.categoryColor || '#2563EB';
    const dateLabel = formatDate(item.createdAt);

    const slideVariants = {
        enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
        center: { opacity: 1, x: 0 },
        exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
    };

    const navButton = (onClick: () => void, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: '#F1F6FE', border: '1px solid #E2EBF9', color: '#334155' }}
        >
            {icon}
        </button>
    );

    return (
        <section
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'white',
                border: '1px solid #E8F0FE',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px -4px rgba(15,76,129,0.06)',
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F0F6FF' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                    {headerIcon}
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold truncate" style={{ color: '#0F172A' }}>{title}</h2>
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{subtitle}</p>
                    </div>
                </div>

                {total > 1 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold tabular-nums hidden sm:block" style={{ color: '#94A3B8' }}>
                            {String(active + 1).padStart(2, '0')}
                            <span style={{ color: '#CBD5E1' }}> / {String(total).padStart(2, '0')}</span>
                        </span>
                        {navButton(prev, 'Informasi sebelumnya', <ChevronLeft className="w-4 h-4" />)}
                        {navButton(next, 'Informasi berikutnya', <ChevronRight className="w-4 h-4" />)}
                    </div>
                )}
            </div>

            <div className={compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}>
                {/* Semua slide ditumpuk pada satu sel grid agar tinggi kartu tidak melompat saat berganti */}
                <div className="grid" style={{ gridTemplateAreas: '"stack"' }}>
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={item.id}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={{ gridArea: 'stack' }}
                        >
                            <SlideCard item={item} accent={accent} dateLabel={dateLabel} compact={compact} onOpenDetail={() => setDetailItem(item)} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Indikator progres — sekaligus tombol lompat ke slide tertentu */}
                {total > 1 && (
                    <div className="flex items-center gap-1.5 mt-4">
                        {items.map((entry, index) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => goTo(index)}
                                aria-label={`Ke informasi ${index + 1}`}
                                className="h-1 flex-1 rounded-full overflow-hidden transition-opacity hover:opacity-80"
                                style={{ background: '#E8EFFA' }}
                            >
                                {index === active ? (
                                    <motion.span
                                        key={`${entry.id}-progress-${paused}`}
                                        className="block h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.55)})` }}
                                        initial={{ width: '0%' }}
                                        animate={{ width: paused ? '35%' : '100%' }}
                                        transition={{ duration: paused ? 0.3 : SLIDE_DURATION / 1000, ease: 'linear' }}
                                    />
                                ) : (
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: index < active ? '100%' : '0%', background: '#CBD8EC' }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <HitsDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
        </section>
    );
}

function SlideCard({
    item,
    accent,
    dateLabel,
    compact,
    onOpenDetail,
}: {
    item: HitsInfoItem;
    accent: string;
    dateLabel: string;
    compact: boolean;
    onOpenDetail: () => void;
}) {
    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onOpenDetail}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDetail();
                }
            }}
            className={`group grid grid-cols-1 sm:grid-cols-2 items-center rounded-2xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 ${compact ? 'gap-3 p-3' : 'gap-4 sm:gap-6 p-4 sm:p-5'}`}
            style={{
                background: `linear-gradient(135deg, ${hexToRgba(accent, 0.05)} 0%, #F8FAFD 55%)`,
                border: '1px solid #EEF4FC',
            }}
        >
            {/* Kolom kiri — foto dengan titik fokus */}
            <div
                className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                style={{ boxShadow: `0 2px 6px rgba(15,23,42,0.08), 0 16px 32px -18px ${hexToRgba(accent, 0.6)}` }}
            >
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.04]"
                        style={{ objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%` }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#94A3B8' }}>
                        <ImageOff className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Kolom kanan — konten */}
            <div className="flex flex-col justify-center gap-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    {item.categoryName && (
                        <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ color: accent, background: hexToRgba(accent, 0.12) }}
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
                    className={`font-bold leading-snug ${compact ? 'text-sm line-clamp-2' : 'text-lg sm:text-xl line-clamp-3'}`}
                    style={{ color: '#0F172A' }}
                >
                    {item.title}
                </h3>

                {item.description && (
                    <p
                        className={`${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-4'} leading-relaxed`}
                        style={{ color: '#64748B' }}
                    >
                        {item.description}
                    </p>
                )}

                <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mt-0.5 transition-all group-hover:gap-2.5"
                    style={{ color: accent, background: hexToRgba(accent, 0.1) }}
                >
                    Lihat detail <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
            </div>
        </article>
    );
}

function HitsDetailModal({ item, onClose }: { item: HitsInfoItem | null; onClose: () => void }) {
    useEffect(() => {
        if (!item) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [item, onClose]);

    if (!item) return null;

    const accent = item.categoryColor || '#2563EB';
    const dateLabel = formatDate(item.createdAt);

    return (
        <ViewportPortal>
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-label={item.title}
                >
                    <div className="relative w-full aspect-video bg-slate-100">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                style={{ objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%` }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: '#94A3B8' }}>
                                <ImageOff className="w-8 h-8" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup"
                            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', color: 'white' }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {item.categoryName && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                    style={{ color: accent, background: hexToRgba(accent, 0.12) }}
                                >
                                    <Tag className="w-3 h-3" />
                                    {item.categoryName}
                                </span>
                            )}
                            {dateLabel && (
                                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: '#94A3B8' }}>
                                    <CalendarDays className="w-3 h-3" />
                                    {dateLabel}
                                </span>
                            )}
                        </div>

                        <h3 className="text-lg font-bold leading-snug" style={{ color: '#0F172A' }}>
                            {item.title}
                        </h3>

                        {item.description && (
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#475569' }}>
                                {item.description}
                            </p>
                        )}

                        {item.link && (
                            <a
                                href={item.link}
                                target={item.link.startsWith('http') ? '_blank' : undefined}
                                rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full w-fit mt-1 transition-all hover:gap-2.5"
                                style={{ color: 'white', background: accent }}
                            >
                                Kunjungi tautan <ArrowUpRight className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </motion.div>
            </div>
        </ViewportPortal>
    );
}
