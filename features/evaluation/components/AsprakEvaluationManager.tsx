'use client';

/**
 * Panel pengelolaan evaluasi praktikum untuk mahasiswa yang punya permission
 * 'practicum.manage' (LAB-INDUSTRI tidak punya role terpisah "Asisten
 * Praktikum" — komponen ini dirender untuk SIAPAPUN mahasiswa yang daftar
 * `getManagedEvaluationCourses()`-nya tidak kosong, bukan berdasarkan nama
 * role tertentu, konsisten dengan desain `canManageCourse` yang
 * permission-based).
 */

import { useEffect, useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { getEvaluationConfigForCourse, getCourseEvaluationResults, getEvaluationAnalyses } from '@/features/evaluation/actions';
import EvaluationToggle from './EvaluationToggle';
import EvaluationResultsView from './EvaluationResultsView';
import EvaluationAnalysisUpload from './EvaluationAnalysisUpload';
import type { ManagedCourse, EvaluationResults, EvaluationAnalysis } from '@/features/evaluation/types';

interface AsprakEvaluationManagerProps {
    managedCourses: ManagedCourse[];
}

export default function AsprakEvaluationManager({ managedCourses }: AsprakEvaluationManagerProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    if (managedCourses.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Kelola Evaluasi Mata Kuliah Anda</h2>
            </div>
            <div className="space-y-3">
                {managedCourses.map((c) => (
                    <CourseManagerCard
                        key={c.courseId}
                        course={c}
                        expanded={expandedId === c.courseId}
                        onToggleExpand={() => setExpandedId((prev) => (prev === c.courseId ? null : c.courseId))}
                    />
                ))}
            </div>
        </div>
    );
}

function CourseManagerCard({ course, expanded, onToggleExpand }: { course: ManagedCourse; expanded: boolean; onToggleExpand: () => void }) {
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [results, setResults] = useState<EvaluationResults | null>(null);
    const [analyses, setAnalyses] = useState<EvaluationAnalysis[]>([]);
    const [isLoading, startTransition] = useTransition();

    useEffect(() => {
        if (!expanded || results) return;
        startTransition(async () => {
            const [config, res, an] = await Promise.all([
                getEvaluationConfigForCourse(course.courseId),
                getCourseEvaluationResults(course.courseId).catch(() => null),
                getEvaluationAnalyses(course.courseId),
            ]);
            setIsOpen(config?.isOpen ?? false);
            setResults(res);
            setAnalyses(an);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded]);

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
                type="button"
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <p className="font-medium text-slate-800 text-sm">{course.courseCode} - {course.courseName}</p>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expanded && (
                <div className="p-4 border-t border-gray-100 space-y-4">
                    {isLoading && !results ? (
                        <p className="text-xs text-gray-400">Memuat...</p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <span className="text-xs text-gray-500">Status kuesioner</span>
                                <EvaluationToggle courseId={course.courseId} initialIsOpen={isOpen ?? false} />
                            </div>
                            {results && <EvaluationResultsView results={results} />}
                            <EvaluationAnalysisUpload courseId={course.courseId} initialAnalyses={analyses} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
