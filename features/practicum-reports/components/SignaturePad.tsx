'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, Upload } from 'lucide-react';

const WIDTH = 600;
const HEIGHT = 220;
const MAX_UPLOAD = 5 * 1024 * 1024;

/**
 * Isian tanda tangan: digambar langsung (mouse / jari) atau unggah gambar.
 * Hasilnya data URL PNG (latar transparan untuk gambar tangan) yang dikirim bersama form.
 */
export default function SignaturePad({ value, onChange }: { value: string | null; onChange: (dataUrl: string | null) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const drawn = useRef(false);
    const [mode, setMode] = useState<'gambar' | 'unggah'>('gambar');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111827';
    }, [mode]);

    const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: ((e.clientX - rect.left) / rect.width) * WIDTH, y: ((e.clientY - rect.top) / rect.height) * HEIGHT };
    };

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const ctx = e.currentTarget.getContext('2d');
        if (!ctx) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        const p = point(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 0.1, p.y + 0.1);
        ctx.stroke();
    };
    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const ctx = e.currentTarget.getContext('2d');
        if (!ctx) return;
        const p = point(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        drawn.current = true;
    };
    const end = () => {
        if (!drawing.current) return;
        drawing.current = false;
        if (drawn.current && canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
    };

    const clear = () => {
        const c = canvasRef.current;
        c?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
        drawn.current = false;
        setError(null);
        onChange(null);
    };

    const upload = (file: File | undefined) => {
        setError(null);
        if (!file) return;
        if (!/^image\/(png|jpeg)$/.test(file.type)) return setError('Gunakan gambar PNG atau JPG.');
        if (file.size > MAX_UPLOAD) return setError('Ukuran gambar maksimal 5 MB.');
        const img = new Image();
        img.onload = () => {
            // Perkecil agar ringan disimpan (lebar maks. 600 px), tetap PNG.
            const scale = Math.min(1, WIDTH / img.width, HEIGHT / img.height);
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
            onChange(c.toDataURL('image/png'));
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => setError('Gambar tidak bisa dibaca.');
        img.src = URL.createObjectURL(file);
    };

    return (
        <div className="space-y-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-sm">
                {([['gambar', 'Gambar langsung', PenLine], ['unggah', 'Unggah gambar', Upload]] as const).map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => { setMode(id); clear(); }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${mode === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Icon className="h-4 w-4" />{label}
                    </button>
                ))}
            </div>

            {mode === 'gambar' ? (
                <div className="space-y-1">
                    <canvas
                        ref={canvasRef}
                        width={WIDTH}
                        height={HEIGHT}
                        onPointerDown={start}
                        onPointerMove={move}
                        onPointerUp={end}
                        onPointerLeave={end}
                        className="w-full touch-none rounded-xl border-2 border-dashed border-gray-300 bg-white"
                        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{value ? 'Tanda tangan siap dikirim.' : 'Tanda tangani di dalam kotak dengan mouse atau jari.'}</span>
                        <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100">
                            <Eraser className="h-3.5 w-3.5" />Ulangi
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:border-blue-300">
                        <Upload className="h-5 w-5 text-blue-600" />
                        <span>{value ? 'Ganti gambar tanda tangan' : 'Pilih gambar tanda tangan (PNG/JPG, latar putih/transparan)'}</span>
                        <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
                    </label>
                    {value && (
                        <div className="flex items-end justify-between gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={value} alt="Pratinjau tanda tangan" className="max-h-28 rounded-lg border border-gray-200 bg-white p-2" />
                            <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
                                <Eraser className="h-3.5 w-3.5" />Hapus
                            </button>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
