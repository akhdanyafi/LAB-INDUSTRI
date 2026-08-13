'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tag, X, Check } from 'lucide-react';
import { addHitsCategory, updateHitsCategory, deleteHitsCategory } from '../actions';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';

export interface HitsCategory {
    id: number;
    name: string;
    color: string;
}

const PRESET_COLORS = [
    '#2563EB', '#0F4C81', '#8B5CF6', '#EC4899',
    '#EF4444', '#F97316', '#F59E0B', '#10B981',
    '#14B8A6', '#64748B',
];

export default function HitsCategoryManager({ categories }: { categories: HitsCategory[] }) {
    const { showAlert, showConfirm } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#2563EB');
    const [editingId, setEditingId] = useState<number | null>(null);

    const resetForm = () => {
        setName('');
        setColor('#2563EB');
        setEditingId(null);
    };

    const handleEdit = (category: HitsCategory) => {
        setEditingId(category.id);
        setName(category.name);
        setColor(category.color || '#2563EB');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showAlert({ title: 'Peringatan', message: 'Nama kategori wajib diisi', type: 'warning' });
            return;
        }

        setIsLoading(true);
        try {
            if (editingId) {
                await updateHitsCategory(editingId, name, color);
            } else {
                await addHitsCategory(name, color);
            }
            window.location.reload();
        } catch (error: unknown) {
            const { title, message } = translateError(error, 'Gagal menyimpan kategori');
            showAlert({ title, message, type: 'error' });
            setIsLoading(false);
        }
    };

    const handleDelete = async (category: HitsCategory) => {
        const confirmed = await showConfirm({
            title: 'Hapus Kategori',
            message: `Hapus kategori "${category.name}"? Informasi yang memakai kategori ini tidak ikut terhapus, hanya kategorinya dikosongkan.`,
            type: 'danger',
            confirmText: 'Hapus',
        });
        if (!confirmed) return;

        try {
            await deleteHitsCategory(category.id);
            window.location.reload();
        } catch (error: unknown) {
            const { title, message } = translateError(error, 'Gagal menghapus kategori');
            showAlert({ title, message, type: 'error' });
        }
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#2563EB]" />
                Kelola Kategori Informasi
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                Tambah jenis informasi baru dan atur warna label yang tampil di beranda.
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Contoh: Mahasiswa Berprestasi"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warna Label</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={e => setColor(e.target.value)}
                            className="w-11 h-10 rounded-lg border border-gray-200 cursor-pointer bg-white p-1"
                        />
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {PRESET_COLORS.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setColor(preset)}
                                    title={preset}
                                    className="w-6 h-6 rounded-md border border-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                                    style={{ background: preset }}
                                >
                                    {color.toLowerCase() === preset.toLowerCase() && (
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {editingId ? 'Simpan' : 'Tambah'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-slate-50 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </form>

            {categories.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Belum ada kategori. Tambahkan minimal satu kategori.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full border"
                            style={{
                                borderColor: `${category.color}55`,
                                background: `${category.color}14`,
                            }}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: category.color }} />
                            <span className="text-sm font-semibold" style={{ color: category.color }}>
                                {category.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleEdit(category)}
                                className="p-1 rounded-full hover:bg-white/70 text-gray-500"
                                title="Edit kategori"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(category)}
                                className="p-1 rounded-full hover:bg-white/70 text-red-500"
                                title="Hapus kategori"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
