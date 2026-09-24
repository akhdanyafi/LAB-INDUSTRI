'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, X, ListChecks } from 'lucide-react';
import { upsertEvaluationQuestion, deleteEvaluationQuestion } from '@/features/evaluation/actions';
import type { EvaluationQuestion, EvaluationQuestionType } from '@/features/evaluation/types';

interface EvaluationQuestionManagerProps {
    initialQuestions: EvaluationQuestion[];
}

interface FormState {
    id?: number;
    question: string;
    type: EvaluationQuestionType;
    order: number;
    isActive: boolean;
}

const emptyForm: FormState = { question: '', type: 'Rating', order: 0, isActive: true };

export default function EvaluationQuestionManager({ initialQuestions }: EvaluationQuestionManagerProps) {
    const [questions, setQuestions] = useState<EvaluationQuestion[]>(initialQuestions);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const sorted = [...questions].sort((a, b) => a.order - b.order);

    const resetForm = () => {
        setForm(emptyForm);
        setShowForm(false);
        setError(null);
    };

    const handleEdit = (q: EvaluationQuestion) => {
        setForm({ id: q.id, question: q.question, type: q.type, order: q.order, isActive: q.isActive });
        setShowForm(true);
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!form.question.trim()) {
            setError('Pertanyaan harus diisi');
            return;
        }

        startTransition(async () => {
            const result = await upsertEvaluationQuestion(form);
            if (result.success) {
                if (form.id) {
                    setQuestions((prev) => prev.map((q) => (q.id === form.id ? { ...q, ...form, id: form.id! } : q)));
                } else {
                    // Simple client-side placeholder id; real list is refreshed via revalidatePath on next navigation
                    setQuestions((prev) => [...prev, { ...form, id: Math.max(0, ...prev.map((p) => p.id)) + 1, createdAt: new Date() }]);
                }
                resetForm();
            } else {
                setError(result.error || 'Gagal menyimpan pertanyaan');
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus pertanyaan ini?')) return;
        startTransition(async () => {
            const result = await deleteEvaluationQuestion(id);
            if (result.success) {
                setQuestions((prev) => prev.filter((q) => q.id !== id));
            } else {
                setError(result.error || 'Gagal menghapus pertanyaan');
            }
        });
    };

    const handleToggleActive = (q: EvaluationQuestion) => {
        startTransition(async () => {
            const result = await upsertEvaluationQuestion({
                id: q.id,
                question: q.question,
                type: q.type,
                order: q.order,
                isActive: !q.isActive,
            });
            if (result.success) {
                setQuestions((prev) => prev.map((p) => (p.id === q.id ? { ...p, isActive: !p.isActive } : p)));
            } else {
                setError(result.error || 'Gagal mengubah status pertanyaan');
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-800">Pertanyaan Evaluasi</h3>
                </div>
                {!showForm && (
                    <button
                        type="button"
                        onClick={() => { setForm(emptyForm); setShowForm(true); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tambah Pertanyaan
                    </button>
                )}
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                            {form.id ? 'Ubah Pertanyaan' : 'Pertanyaan Baru'}
                        </span>
                        <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pertanyaan</label>
                        <textarea
                            rows={2}
                            value={form.question}
                            onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                            placeholder="Contoh: Bagaimana kejelasan penyampaian materi asisten praktikum?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipe</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as EvaluationQuestionType }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            >
                                <option value="Rating">Rating (1-5)</option>
                                <option value="Teks">Teks</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Urutan</label>
                            <input
                                type="number"
                                value={form.order}
                                onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                        />
                        Aktif (ditampilkan di form evaluasi mahasiswa)
                    </label>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {sorted.length === 0 && (
                    <p className="text-sm text-gray-500">Belum ada pertanyaan evaluasi.</p>
                )}
                {sorted.map((q) => (
                    <div key={q.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-white">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-400">#{q.order}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type === 'Rating' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {q.type}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleActive(q)}
                                    disabled={isPending}
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${q.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {q.isActive ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </div>
                            <p className="text-sm text-slate-700">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleEdit(q)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(q.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
