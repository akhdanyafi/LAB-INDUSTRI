'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MousePointerClick } from 'lucide-react';

interface HitsFocalPickerProps {
    imageUrl: string;
    initialFocalX?: number;
    initialFocalY?: number;
    onChange: (x: number, y: number) => void;
}

/**
 * Pemilih titik fokus gambar dengan bingkai rasio 16:9 —
 * area di dalam bingkai persis sama dengan potongan yang tampil di beranda.
 */
export default function HitsFocalPicker({
    imageUrl,
    initialFocalX = 50,
    initialFocalY = 50,
    onChange,
}: HitsFocalPickerProps) {
    const [focalX, setFocalX] = useState(initialFocalX);
    const [focalY, setFocalY] = useState(initialFocalY);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onChange(focalX, focalY);
    }, [focalX, focalY, onChange]);

    const updateFocalPoint = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!containerRef.current) return;

        if (e.type === 'touchmove') e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();

        let clientX: number;
        let clientY: number;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const percentX = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
        const percentY = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));

        setFocalX(percentX);
        setFocalY(percentY);
    }, []);

    const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        updateFocalPoint(e);
    }, [updateFocalPoint]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent | TouchEvent) => updateFocalPoint(e);
        const handleEnd = () => setIsDragging(false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, updateFocalPoint]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
                <p className="flex items-center gap-1.5">
                    <MousePointerClick className="w-4 h-4 text-[#2563EB]" />
                    Klik &amp; geser pada gambar untuk mengatur area yang tampil (rasio 16:9).
                </p>
                <div className="font-mono bg-slate-50 px-2 py-1 rounded text-xs">
                    X: {focalX}% | Y: {focalY}%
                </div>
            </div>

            <div
                ref={containerRef}
                onMouseDown={handleInteractionStart}
                onTouchStart={handleInteractionStart}
                className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-crosshair select-none touch-none aspect-video w-full max-w-xl"
            >
                <img
                    src={imageUrl}
                    alt="Pratinjau area fokus"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{ objectPosition: `${focalX}% ${focalY}%` }}
                    draggable={false}
                />

                {/* Garis bantu rule-of-thirds */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/70" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/70" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/70" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/70" />
                </div>

                {/* Penanda titik fokus */}
                <div
                    className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none z-10"
                    style={{ left: `${focalX}%`, top: `${focalY}%` }}
                >
                    <div className="absolute inset-0 border-2 border-white rounded-full shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" />
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {[
                    { label: 'Kiri Atas', x: 25, y: 25 },
                    { label: 'Tengah', x: 50, y: 50 },
                    { label: 'Kanan Atas', x: 75, y: 25 },
                    { label: 'Bawah', x: 50, y: 80 },
                ].map(preset => (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => { setFocalX(preset.x); setFocalY(preset.y); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-600 font-medium"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
