'use client';

import { useEffect, useState } from 'react';
import { Loader2, PenLine } from 'lucide-react';
import { getReportSignaturesForReview, type ReviewSignatures } from '@/features/practicum-reports/actions';

/** Tanda tangan di halaman approval: TTD asprak pengisi + nama dosen pengampu MK. */
export default function ReportSignaturesPanel({ reportId }: { reportId: number; status?: string | null }) {
    const [data, setData] = useState<ReviewSignatures | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        getReportSignaturesForReview(reportId).then((res) => {
            if (!alive) return;
            if (res.success && res.data) setData(res.data);
            else setError(res.error ?? 'Gagal memuat tanda tangan');
        });
        return () => { alive = false; };
    }, [reportId]);

    const box = 'flex h-24 items-center justify-center rounded-lg border border-gray-200 bg-white p-2';

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700"><PenLine className="h-4 w-4 text-blue-500" />Tanda Tangan</h4>
            {error ? <p className="text-sm text-red-600">{error}</p> : !data ? (
                <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Memuat…</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-gray-500">Asisten Praktikum</p>
                        <p className="mb-1.5 text-sm font-medium text-slate-800">{data.asprak.name}</p>
                        <div className={box}>
                            {data.asprak.signature
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={data.asprak.signature} alt={`Tanda tangan ${data.asprak.name}`} className="max-h-full max-w-full object-contain" />
                                : <span className="text-xs text-amber-700">Belum ditandatangani asprak</span>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Dosen Pengampu</p>
                        <p className="mb-1.5 text-sm font-medium text-slate-800">{data.lecturer.name || '—'}</p>
                        <div className={box}>
                            <span className="px-2 text-center text-xs text-gray-500">Ditandatangani langsung oleh dosen pada PDF berita acara</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
