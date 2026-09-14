'use client';

import { useState } from 'react';
import {
    Upload, Image as ImageIcon, Crop, Loader2, Pencil, Trash2,
    Eye, EyeOff, Flame,
} from 'lucide-react';
import { addHitsInfo, updateHitsInfo, deleteHitsInfo } from '../actions';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';
import HitsFocalPicker from './HitsFocalPicker';
import HitsCategoryManager, { HitsCategory } from './HitsCategoryManager';

export interface HitsInfoAdminItem {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    focalX: number;
    focalY: number;
    link: string | null;
    isPublished: boolean;
    displayOrder: number;
    categoryId: number | null;
    categoryName: string | null;
    categoryColor: string | null;
}

interface HitsManagerProps {
    initialInfos: HitsInfoAdminItem[];
    categories: HitsCategory[];
}

const EMPTY_FORM = {
    title: '',
    description: '',
    link: '',
    categoryId: '',
    focalX: 50,
    focalY: 50,
    isPublished: true,
    displayOrder: 0,
};

export default function HitsManager({ initialInfos, categories }: HitsManagerProps) {
    const { showAlert, showConfirm } = useAlert();
    const [infos, setInfos] = useState(initialInfos);
    const [editingInfo, setEditingInfo] = useState<HitsInfoAdminItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isFocalPickerOpen, setIsFocalPickerOpen] = useState(false);

    const handleEdit = (info: HitsInfoAdminItem) => {
        setEditingInfo(info);
        setFormData({
            title: info.title,
            description: info.description || '',
            link: info.link || '',
            categoryId: info.categoryId ? String(info.categoryId) : '',
            focalX: info.focalX ?? 50,
            focalY: info.focalY ?? 50,
            isPublished: info.isPublished,
            displayOrder: info.displayOrder ?? 0,
        });
        setPreviewUrl(info.imageUrl);
        setSelectedFile(null);
        setIsFocalPickerOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingInfo(null);
        setFormData(EMPTY_FORM);
        setPreviewUrl('');
        setSelectedFile(null);
        setIsFocalPickerOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showAlert({ title: 'Ukuran Terlalu Besar', message: 'Ukuran file maksimal 2MB', type: 'error' });
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setIsFocalPickerOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('link', formData.link);
            data.append('categoryId', formData.categoryId);
            data.append('focalX', String(formData.focalX));
            data.append('focalY', String(formData.focalY));
            data.append('isPublished', String(formData.isPublished));
            data.append('displayOrder', String(formData.displayOrder));

            if (selectedFile) data.append('file', selectedFile);

            if (editingInfo) {
                await updateHitsInfo(editingInfo.id, data);
            } else {
                if (!selectedFile) {
                    showAlert({ title: 'Peringatan', message: 'Mohon pilih foto terlebih dahulu', type: 'warning' });
                    setIsLoading(false);
                    return;
                }
                await addHitsInfo(data);
            }
            window.location.reload();
        } catch (error: unknown) {
            const { title, message } = translateError(error, 'Gagal menyimpan informasi');
            showAlert({ title, message, type: 'error' });
            setIsLoading(false);
        }
    };

    const handleDelete = async (info: HitsInfoAdminItem) => {
        const confirmed = await showConfirm({
            title: 'Hapus Informasi',
            message: `Hapus informasi "${info.title}"?`,
            type: 'danger',
            confirmText: 'Hapus',
        });
        if (!confirmed) return;

        try {
            await deleteHitsInfo(info.id);
            setInfos(infos.filter(i => i.id !== info.id));
            showAlert({ title: 'Berhasil', message: 'Informasi berhasil dihapus', type: 'success' });
        } catch (error: unknown) {
            const { title, message } = translateError(error, 'Gagal menghapus informasi');
            showAlert({ title, message, type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Form */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#2563EB]" />
                    {editingInfo ? 'Edit Informasi Hits' : 'Tambah Informasi Hits'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Informasi kegiatan program studi maupun mahasiswa berprestasi yang tampil di beranda dan dashboard pengguna.
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Informasi</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Contoh: Mahasiswa Informatika Juara 1 Hackathon Nasional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori / Jenis Informasi</label>
                        <select
                            value={formData.categoryId}
                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                            <option value="">— Tanpa Kategori —</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Kategori bisa ditambah/diubah pada panel di bawah.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Tampil</label>
                        <input
                            type="number"
                            value={formData.displayOrder}
                            onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-gray-500 mt-1">Angka lebih kecil tampil lebih dulu.</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editingInfo ? 'Foto (Opsional) — biarkan kosong jika tidak diubah' : 'Foto (rasio tampil 16:9)'}
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-white transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                required={!editingInfo}
                            />
                            {previewUrl ? (
                                <div className="relative w-full max-w-md mx-auto aspect-video">
                                    <img
                                        src={previewUrl}
                                        alt="Pratinjau"
                                        className="w-full h-full object-cover rounded-xl"
                                        style={{ objectPosition: `${formData.focalX}% ${formData.focalY}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl text-white text-sm font-medium">
                                        Ganti Foto
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Klik atau drag foto ke sini</p>
                                    <p className="text-xs text-gray-400 mt-1">Maksimal 2MB — akan dipotong otomatis ke rasio 16:9</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {previewUrl && !isFocalPickerOpen && (
                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={() => setIsFocalPickerOpen(true)}
                                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/5 rounded-xl font-medium transition-colors"
                            >
                                <Crop className="w-5 h-5" /> Atur / Crop Area Foto (16:9)
                            </button>
                        </div>
                    )}

                    {previewUrl && isFocalPickerOpen && (
                        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-semibold text-slate-900">Menyesuaikan Potongan Foto</label>
                                <button
                                    type="button"
                                    onClick={() => setIsFocalPickerOpen(false)}
                                    className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm hover:bg-slate-50 font-medium"
                                >
                                    Selesai
                                </button>
                            </div>
                            <HitsFocalPicker
                                imageUrl={previewUrl}
                                initialFocalX={formData.focalX}
                                initialFocalY={formData.focalY}
                                onChange={(x, y) => setFormData(prev => ({ ...prev, focalX: x, focalY: y }))}
                            />
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Informasi</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 h-28 resize-none"
                            placeholder="Ringkasan informasi yang tampil di samping foto..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link / URL (Opsional)</label>
                        <input
                            type="url"
                            value={formData.link}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="https://instagram.com/p/..."
                        />
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer py-2">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            Tampilkan di beranda &amp; dashboard
                        </label>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50 w-full md:w-auto flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingInfo ? 'Simpan Perubahan' : 'Tambah Informasi'}
                        </button>
                        {editingInfo && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-slate-50 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors font-medium w-full md:w-auto"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Kategori */}
            <HitsCategoryManager categories={categories} />

            {/* Daftar informasi */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Daftar Informasi ({infos.length})
                </h3>

                {infos.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                        Belum ada informasi hits.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {infos.map(info => (
                            <div key={info.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                                <div className="relative w-full aspect-video bg-slate-50">
                                    <img
                                        src={info.imageUrl}
                                        alt={info.title}
                                        className="w-full h-full object-cover"
                                        style={{ objectPosition: `${info.focalX}% ${info.focalY}%` }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(info)}
                                            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-sm transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(info)}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                        {info.categoryName && (
                                            <span
                                                className="text-[11px] font-semibold px-2 py-1 rounded-full text-white shadow-sm"
                                                style={{ background: info.categoryColor || '#2563EB' }}
                                            >
                                                {info.categoryName}
                                            </span>
                                        )}
                                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm ${info.isPublished ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                            {info.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {info.isPublished ? 'Tampil' : 'Draft'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{info.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{info.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
