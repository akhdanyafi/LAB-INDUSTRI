'use client';

import { useState, useTransition } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, MessageSquare, Users, Trash2 } from 'lucide-react';
import { deleteEvaluationResponse } from '@/features/evaluation/actions';
import type { EvaluationResults } from '@/features/evaluation/types';

interface EvaluationResultsViewProps {
    results: EvaluationResults;
    canDelete?: boolean;
}

const BAR_COLOR = '#2563EB';

export default function EvaluationResultsView({ results, canDelete = true }: EvaluationResultsViewProps) {
    const [respondents, setRespondents] = useState(results.respondents);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const ratingQuestions = results.questions.filter((q) => q.type === 'Rating' && q.average !== null);
    const chartData = ratingQuestions.map((q) => ({
        name: q.question.length > 24 ? `${q.question.slice(0, 24)}…` : q.question,
        fullQuestion: q.question,
        value: Number((q.average ?? 0).toFixed(2)),
    }));

    const handleDelete = (responseId: number) => {
        if (!confirm('Hapus jawaban mahasiswa ini? Mereka bisa mengisi ulang selama kuesioner masih Buka.')) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteEvaluationResponse(responseId, results.courseId);
            if (result.success) {
                setRespondents((prev) => prev.filter((r) => r.responseId !== responseId));
            } else {
                setError(result.error || 'Gagal menghapus jawaban');
            }
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{results.totalRespondents} mahasiswa telah mengisi evaluasi</span>
            </div>

            {results.questions.length === 0 && (
                <p className="text-sm text-gray-500">Belum ada pertanyaan evaluasi.</p>
            )}

            {chartData.length > 0 && (
                <div className="p-4 rounded-xl border border-gray-100 bg-white">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grafik Rata-rata Rating</p>
                    <div style={{ height: Math.max(120, chartData.length * 44) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} width={160} />
                                <Tooltip
                                    formatter={(value?: number) => [`${value ?? 0} / 5`, 'Rata-rata']}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullQuestion ?? ''}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((_, idx) => (
                                        <Cell key={idx} fill={BAR_COLOR} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {results.questions.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl border border-gray-100 bg-white">
                        <p className="text-sm font-medium text-slate-800 mb-2">{q.question}</p>

                        {q.type === 'Rating' ? (
                            q.average !== null ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${(q.average / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-blue-700 w-24 shrink-0 text-right">
                                        {q.average.toFixed(2)} / 5
                                    </span>
                                    <span className="text-xs text-gray-400 shrink-0">({q.ratingCount} jawaban)</span>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <BarChart3 className="w-3.5 h-3.5" /> Belum ada jawaban
                                </p>
                            )
                        ) : q.textAnswers.length > 0 ? (
                            <ul className="space-y-2 mt-2">
                                {q.textAnswers.map((answer, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                        <span>{answer}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Belum ada jawaban
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-white">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daftar Responden</p>
                {error && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">{error}</div>
                )}
                {respondents.length === 0 ? (
                    <p className="text-xs text-gray-400">Belum ada mahasiswa yang mengisi.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {respondents.map((r) => (
                            <li key={r.responseId} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{r.studentName || r.studentIdentifier}</p>
                                    <p className="text-[11px] text-gray-400">
                                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString('id-ID') : '-'}
                                    </p>
                                </div>
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(r.responseId)}
                                        disabled={isPending}
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                                        title="Hapus jawaban responden ini"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
