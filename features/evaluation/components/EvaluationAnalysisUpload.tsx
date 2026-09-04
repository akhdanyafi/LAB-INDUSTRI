'use client';

import { useRef, useState, useTransition } from 'react';
import { FileUp, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import { uploadEvaluationAnalysis, deleteEvaluationAnalysis } from '@/features/evaluation/actions';
import type { EvaluationAnalysis } from '@/features/evaluation/types';

interface EvaluationAnalysisUploadProps {
    courseId: number;
    initialAnalyses: EvaluationAnalysis[];
}

export default function EvaluationAnalysisUpload({ courseId, initialAnalyses }: EvaluationAnalysisUploadProps) {
    const [analyses, setAnalyses] = useState(initialAnalyses);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await uploadEvaluationAnalysis(courseId, fd);
            if (result.success) {
                formRef.current?.reset();
                window.location.reload();
            } else {
                setError(result.error || 'Gagal mengunggah hasil analisis');
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus hasil analisis ini?')) return;
        startTransition(async () => {
            const result = await deleteEvaluationAnalysis(id, courseId);
            if (result.success) {
                setAnalyses((prev) => prev.filter((a) => a.id !== id));
            } else {
                setError(result.error || 'Gagal menghapus hasil analisis');
            }
        });
    };

    return (
        <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Hasil Analisis Kuesioner</p>

            {error && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">{error}</div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-start">
                <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.png,.jpg,.jpeg"
                    className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <input
                    type="text"
                    name="note"
                    placeholder="Catatan singkat (opsional)"
                    className="flex-1 w-full sm:w-auto px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                    Unggah
                </button>
            </form>

            {analyses.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada hasil analisis yang diunggah.</p>
            ) : (
                <ul className="space-y-1.5">
                    {analyses.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{a.fileName}</p>
                                    <p className="text-[11px] text-gray-400 truncate">
                                        {a.uploaderName || a.uploadedBy}
                                        {a.note ? ` — ${a.note}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <a
                                    href={a.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    title="Unduh"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(a.id)}
                                    disabled={isPending}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Hapus"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
