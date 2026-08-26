import { getSession, hasPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCoursesByLecturerId } from '@/features/courses/actions';
import { getEvaluationConfigForCourse, getCourseEvaluationResults } from '@/features/evaluation/actions';
import EvaluationToggle from '@/features/evaluation/components/EvaluationToggle';
import EvaluationResultsView from '@/features/evaluation/components/EvaluationResultsView';
import { ClipboardList } from 'lucide-react';

export default async function LecturerManageEvaluationPage() {
    const session = await getSession();
    if (!session || !hasPermission(session, 'evaluation.manage')) {
        redirect('/lecturer/dashboard');
    }

    const courses = await getCoursesByLecturerId(session.user.identifier);

    const coursesWithData = await Promise.all(
        courses.map(async (course) => {
            const config = await getEvaluationConfigForCourse(course.id);
            const results = await getCourseEvaluationResults(course.id).catch(() => null);
            return { course, config, results };
        })
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Evaluasi Praktikum</h1>
                <p className="text-sm text-gray-500">Buka/tutup kuesioner evaluasi dan lihat hasilnya untuk mata kuliah yang Anda ampu.</p>
            </div>

            {coursesWithData.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>Anda belum mengampu mata kuliah apapun.</p>
                </div>
            )}

            <div className="space-y-4">
                {coursesWithData.map(({ course, config, results }) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <p className="font-semibold text-slate-800">{course.code} - {course.name}</p>
                            <EvaluationToggle courseId={course.id} initialIsOpen={config?.isOpen ?? false} />
                        </div>
                        {results && <EvaluationResultsView results={results} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
