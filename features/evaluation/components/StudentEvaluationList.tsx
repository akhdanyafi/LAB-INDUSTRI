'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardList, X } from 'lucide-react';
import EvaluationForm from './EvaluationForm';
import type { EvaluationQuestion, OpenEvaluationForStudent } from '@/features/evaluation/types';

interface StudentEvaluationListProps {
    openEvaluations: OpenEvaluationForStudent[];
    questions: EvaluationQuestion[];
}

export default function StudentEvaluationList({ openEvaluations, questions }: StudentEvaluationListProps) {
    const [active, setActive] = useState<OpenEvaluationForStudent | null>(null);
    const [submittedIds, setSubmittedIds] = useState<number[]>([]);

    if (openEvaluations.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>Belum ada kuesioner evaluasi praktikum yang dibuka saat ini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {openEvaluations.map((ev) => {
                const done = ev.hasSubmitted || submittedIds.includes(ev.courseId);
                return (
                    <div key={ev.courseId} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                        <div>
                            <p className="font-medium text-slate-800">{ev.courseCode} - {ev.courseName}</p>
                        </div>
                        {done ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Sudah diisi
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setActive(ev)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Isi Evaluasi
                            </button>
                        )}
                    </div>
                );
            })}

            {active && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                        <button
                            type="button"
                            onClick={() => setActive(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <EvaluationForm
                            courseId={active.courseId}
                            courseCode={active.courseCode}
                            courseName={active.courseName}
                            questions={questions}
                            onSuccess={() => {
                                setSubmittedIds((prev) => [...prev, active.courseId]);
                                setActive(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
