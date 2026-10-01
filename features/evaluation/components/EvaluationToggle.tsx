'use client';

import { useState, useTransition } from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toggleCourseEvaluation } from '@/features/evaluation/actions';

interface EvaluationToggleProps {
    courseId: number;
    initialIsOpen: boolean;
}

export default function EvaluationToggle({ courseId, initialIsOpen }: EvaluationToggleProps) {
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleToggle = () => {
        const next = !isOpen;
        setError(null);

        startTransition(async () => {
            const result = await toggleCourseEvaluation(courseId, next);
            if (result.success) {
                setIsOpen(next);
            } else {
                setError(result.error || 'Gagal mengubah status evaluasi');
            }
        });
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${isOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isOpen ? (
                    <ToggleRight className="w-4 h-4" />
                ) : (
                    <ToggleLeft className="w-4 h-4" />
                )}
                {isOpen ? 'Kuesioner Dibuka' : 'Kuesioner Ditutup'}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}
