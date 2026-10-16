'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PenLine, Save, Trash2, X } from 'lucide-react';
import ViewportPortal from '@/components/shared/ViewportPortal';
import { getPracticumReportSignature, savePracticumReportSignature } from '@/features/practicum-reports/actions';
import type { PracticumReport } from '@/features/practicum-reports/types';
import SignaturePad from './SignaturePad';

/**
 * Sisipkan / ganti tanda tangan asprak pengisi pada berita acara yang sudah dikirim —
 * baik sudah diverifikasi admin maupun belum (status tidak berubah).
 */
export default function ReportSignatureModal({ report, onClose }: { report: PracticumReport; onClose: () => void }) {
    const router = useRouter();
    const [current, setCurrent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [next, setNext] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, start] = useTransition();

    useEffect(() => {
        let alive = true;
        getPracticumReportSignature(report.id).then((res) => {
            if (!alive) return;
            if (res.success) setCurrent(res.signature ?? null);
            else setError(res.error ?? 'Gagal memuat tanda tangan');
            setLoading(false);
        });
        return () => { alive = false; };
    }, [report.id]);

    const save = (value: string | null) => start(async () => {
        setError(null);
        const res = await savePracticumReportSignature(report.id, value);
        if (!res.success) return setError(res.error ?? 'Gagal menyimpan tanda tangan');
        router.refresh();
        onClose();
    });

    return (
        <ViewportPortal>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-100 p-2"><PenLine className="h-5 w-5 text-blue-600" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Tanda Tangan Berita Acara</h3>
                                <p className="text-sm text-blue-600">{report.courseCode} - {report.courseName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-4 p-5">
                        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                        <p className="text-xs text-gray-500">
                            Status berita acara ({report.status || 'Pending'}) tidak berubah. Tanda tangan langsung dipakai di PDF berita acara.
                        </p>
                        {loading ? (
                            <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Memuat…</p>
                        ) : (
                            <>
                                {current && (
                                    <div className="flex items-end justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-gray-600">Tanda tangan saat ini</p>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={current} alt="Tanda tangan saat ini" className="max-h-24 rounded-lg border border-gray-200 bg-white p-2" />
                                        </div>
                                        <button type="button" disabled={pending} onClick={() => confirm('Hapus tanda tangan dari berita acara ini?') && save(null)}
                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-3.5 w-3.5" />Hapus
                                        </button>
                                    </div>
                                )}
                                <div>
                                    <p className="mb-2 text-sm font-medium text-gray-700">{current ? 'Ganti tanda tangan' : 'Tanda tangan Asisten Praktikum'}</p>
                                    <SignaturePad value={next} onChange={setNext} />
                                </div>
                            </>
                        )}
                        <div className="flex gap-3 border-t border-gray-100 pt-4">
                            <button type="button" disabled={!next || pending} onClick={() => save(next)}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan Tanda Tangan
                            </button>
                            <button type="button" onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700">Batal</button>
                        </div>
                    </div>
                </div>
            </div>
        </ViewportPortal>
    );
}
