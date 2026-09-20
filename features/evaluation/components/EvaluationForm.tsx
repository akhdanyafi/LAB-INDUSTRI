'use client';

import { useState, useTransition } from 'react';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { submitCourseEvaluation } from '@/features/evaluation/actions';
import type { EvaluationQuestion } from '@/features/evaluation/types';

interface EvaluationFormProps {
    courseId: number;
    courseCode: string;
    courseName: string;
    questions: EvaluationQuestion[];
    onSuccess?: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function EvaluationForm({ courseId, courseCode, courseName, questions, onSuccess }: EvaluationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [ratings, setRatings] = useState<Record<number, number>>({});

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const fd = new FormData(e.currentTarget);
        const answers: Record<string, string | number> = {};

        for (const q of questions) {
            if (q.type === 'Rating') {
                const value = ratings[q.id];
                if (!value) {
                    setError(`Pertanyaan "${q.question}" harus dijawab`);
                    return;
                }
                answers[String(q.id)] = value;
            } else {
                const text = String(fd.get(`question-${q.id}`) || '').trim();
                if (!text) {
                    setError(`Pertanyaan "${q.question}" harus dijawab`);
                    return;
                }
                answers[String(q.id)] = text;
            }
        }

        startTransition(async () => {
            const result = await submitCourseEvaluation(courseId, answers);
            if (result.success) {
                setSubmitted(true);
                onSuccess?.();
            } else {
                setError(result.error || 'Gagal mengirim evaluasi');
            }
        });
    };

    if (submitted) {
        return (
            <div className="p-6 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                    <p className="font-semibold text-green-800">Terima kasih!</p>
                    <p className="text-sm text-green-700">Evaluasi untuk {courseCode} - {courseName} berhasil dikirim.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="p-2 bg-blue-100 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Evaluasi Praktikum</h3>
                    <p className="text-sm text-blue-600">{courseCode} - {courseName}</p>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                </div>
            )}

            {questions.length === 0 && (
                <p className="text-sm text-gray-500">Belum ada pertanyaan evaluasi yang tersedia.</p>
            )}

            <div className="space-y-5">
                {questions.map((q) => (
                    <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {q.question} <span className="text-red-500">*</span>
                        </label>

                        {q.type === 'Rating' ? (
                            <div className="flex flex-wrap gap-2">
                                {RATING_OPTIONS.map((value) => (
                                    <label
                                        key={value}
                                        className={`
                                            flex items-center justify-center w-11 h-11 rounded-xl border cursor-pointer transition-all text-sm font-semibold
                                            ${ratings[q.id] === value
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${q.id}`}
                                            value={value}
                                            checked={ratings[q.id] === value}
                                            onChange={() => setRatings((prev) => ({ ...prev, [q.id]: value }))}
                                            className="sr-only"
                                        />
                                        {value}
                                    </label>
                                ))}
                                <span className="ml-2 self-center text-xs text-gray-400">1 = Sangat Kurang, 5 = Sangat Baik</span>
                            </div>
                        ) : (
                            <textarea
                                name={`question-${q.id}`}
                                rows={3}
                                maxLength={2000}
                                placeholder="Tuliskan jawaban Anda..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                            />
                        )}
                    </div>
                ))}
            </div>

            {questions.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isPending ? 'Mengirim...' : 'Kirim Evaluasi'}
                    </button>
                </div>
            )}
        </form>
    );
}
