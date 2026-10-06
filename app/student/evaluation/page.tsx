import { getOpenEvaluationsForStudent, getEvaluationQuestions, getManagedEvaluationCourses } from '@/features/evaluation/actions';
import StudentEvaluationList from '@/features/evaluation/components/StudentEvaluationList';
import AsprakEvaluationManager from '@/features/evaluation/components/AsprakEvaluationManager';

export default async function StudentEvaluationPage() {
    const [openEvaluations, questions, managedCourses] = await Promise.all([
        getOpenEvaluationsForStudent(),
        getEvaluationQuestions(),
        getManagedEvaluationCourses().catch(() => []),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Evaluasi Praktikum</h1>
                <p className="text-sm text-gray-500">Isi kuesioner evaluasi untuk mata kuliah yang sedang membuka pengisian.</p>
            </div>

            <StudentEvaluationList openEvaluations={openEvaluations} questions={questions} />

            <AsprakEvaluationManager managedCourses={managedCourses} />
        </div>
    );
}
