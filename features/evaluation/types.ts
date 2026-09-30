/**
 * Evaluation (Form Evaluasi Praktikum) Types
 */

export type EvaluationQuestionType = 'Rating' | 'Teks';

export interface EvaluationQuestion {
    id: number;
    question: string;
    type: EvaluationQuestionType;
    order: number;
    isActive: boolean;
    createdAt: Date | null;
}

export interface EvaluationConfig {
    id: number;
    courseId: number;
    isOpen: boolean;
    openedBy: string | null;
    openedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface EvaluationResponse {
    id: number;
    courseId: number;
    studentIdentifier: string;
    answers: Record<string, string | number>;
    submittedAt: Date | null;
}

export interface UpsertQuestionInput {
    id?: number;
    question: string;
    type: EvaluationQuestionType;
    order: number;
    isActive: boolean;
}

export interface SubmitEvaluationInput {
    courseId: number;
    answers: Record<string, string | number>;
}

export interface OpenEvaluationForStudent {
    courseId: number;
    courseCode: string;
    courseName: string;
    hasSubmitted: boolean;
}

export interface EvaluationQuestionResult {
    id: number;
    question: string;
    type: EvaluationQuestionType;
    order: number;
    // For 'Rating' questions
    average: number | null;
    ratingCount: number;
    // For 'Teks' questions
    textAnswers: string[];
}

export interface EvaluationRespondent {
    responseId: number;
    studentIdentifier: string;
    studentName: string | null;
    submittedAt: Date | null;
}

export interface EvaluationResults {
    courseId: number;
    totalRespondents: number;
    questions: EvaluationQuestionResult[];
    respondents: EvaluationRespondent[];
}

export interface EvaluationAnalysis {
    id: number;
    courseId: number;
    uploadedBy: string;
    uploaderName: string | null;
    fileName: string;
    filePath: string;
    note: string | null;
    createdAt: Date | null;
}

export interface ManagedCourse {
    courseId: number;
    courseCode: string;
    courseName: string;
}
