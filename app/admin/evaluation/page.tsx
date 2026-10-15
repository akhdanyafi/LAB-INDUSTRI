import { getCourses } from '@/features/courses/actions';
import {
    getEvaluationConfigForCourse,
    getCourseEvaluationResults,
    getAllEvaluationQuestionsAdmin,
    getEvaluationAnalyses,
} from '@/features/evaluation/actions';
import EvaluationToggle from '@/features/evaluation/components/EvaluationToggle';
import EvaluationResultsView from '@/features/evaluation/components/EvaluationResultsView';
import EvaluationQuestionManager from '@/features/evaluation/components/EvaluationQuestionManager';
import EvaluationAnalysisUpload from '@/features/evaluation/components/EvaluationAnalysisUpload';

export default async function AdminEvaluationPage() {
    const [courses, questions] = await Promise.all([
        getCourses(),
        getAllEvaluationQuestionsAdmin(),
    ]);

    const coursesWithData = await Promise.all(
        courses.map(async (course) => {
            const config = await getEvaluationConfigForCourse(course.id);
            const results = await getCourseEvaluationResults(course.id).catch(() => null);
            const analyses = await getEvaluationAnalyses(course.id);
            return { course, config, results, analyses };
        })
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Evaluasi Praktikum</h1>
                <p className="text-sm text-gray-500">Kelola pertanyaan kuesioner, buka/tutup evaluasi, dan lihat hasil per mata kuliah.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <EvaluationQuestionManager initialQuestions={questions} />
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Status per Mata Kuliah</h2>
                {coursesWithData.length === 0 && (
                    <p className="text-sm text-gray-500">Belum ada mata kuliah.</p>
                )}
                {coursesWithData.map(({ course, config, results, analyses }) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <p className="font-semibold text-slate-800">{course.code} - {course.name}</p>
                            <EvaluationToggle courseId={course.id} initialIsOpen={config?.isOpen ?? false} />
                        </div>
                        {results && <EvaluationResultsView results={results} />}
                        <EvaluationAnalysisUpload courseId={course.id} initialAnalyses={analyses} />
                    </div>
                ))}
            </div>
        </div>
    );
}
