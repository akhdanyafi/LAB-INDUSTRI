'use client';

import { BarChart3, MessageSquare, Users } from 'lucide-react';
import type { EvaluationResults } from '@/features/evaluation/types';

interface EvaluationResultsViewProps {
    results: EvaluationResults;
}

export default function EvaluationResultsView({ results }: EvaluationResultsViewProps) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{results.totalRespondents} mahasiswa telah mengisi evaluasi</span>
            </div>

            {results.questions.length === 0 && (
                <p className="text-sm text-gray-500">Belum ada pertanyaan evaluasi.</p>
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
        </div>
    );
}
