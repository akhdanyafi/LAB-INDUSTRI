'use client';

import { useState, useTransition, useMemo } from 'react';
import { BookOpen, Plus, Trash2, Edit, Upload, X, Search, FileText, ExternalLink, LayoutGrid, List as ListIcon } from 'lucide-react';
import { createModule, updateModule, deleteModule } from '@/features/practicum/actions';
import type { PracticumModuleWithCourse } from '@/features/practicum/types';
import type { CourseWithLecturer } from '@/features/courses/types';
import { translateError } from '@/lib/error';

interface ModuleManagerProps {
    modules: PracticumModuleWithCourse[];
    courses: CourseWithLecturer[];
}

export default function ModuleManager({ modules, courses }: ModuleManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingModule, setEditingModule] = useState<PracticumModuleWithCourse | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCourseId, setFilterCourseId] = useState('');

    // Pagination & View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 12;

    // Filtered modules
    const filteredModules = useMemo(() => {
        return modules.filter(m => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!m.name.toLowerCase().includes(query)) return false;
            }
            if (filterCourseId) {
                if (m.courseId !== parseInt(filterCourseId)) return false;
            }
            return true;
        });
    }, [modules, searchQuery, filterCourseId]);

    // Apply pagination
    const totalPages = Math.ceil(filteredModules.length / perPage);
    const paginatedModules = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredModules.slice(startIndex, startIndex + perPage);
    }, [filteredModules, currentPage, perPage]);

    // Navigate back to page 1 if search/filter changes
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    };

    const handleCourseFilterChange = (val: string) => {
        setFilterCourseId(val);
        setCurrentPage(1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran file maksimal 2MB');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
        }
    };

    const normalizeLink = (raw: string): string => {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const courseId = formData.get('courseId') as string;
        const moduleLink = normalizeLink((formData.get('moduleLink') as string) || '');

        startTransition(async () => {
            try {
                let filePath: string | undefined;

                // Upload file if selected
                if (selectedFile) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', selectedFile);
                    uploadFormData.append('folder', 'practicum');

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (!uploadRes.ok) {
                        throw new Error('Gagal mengupload file');
                    }

                    const uploadData = await uploadRes.json();
                    filePath = uploadData.path;
                }

                if (editingModule) {
                    await updateModule(editingModule.id, {
                        name,
                        description: description || undefined,
                        courseId: courseId ? parseInt(courseId) : undefined,
                        filePath: filePath || undefined,
                        moduleLink,
                    });
                    setMessage({ type: 'success', text: 'Modul berhasil diperbarui!' });
                } else {
                    await createModule({
                        name,
                        description: description || undefined,
                        courseId: courseId ? parseInt(courseId) : undefined,
                        filePath,
                        moduleLink,
                    });
                    setMessage({ type: 'success', text: 'Modul berhasil ditambahkan!' });
                }

                setShowForm(false);
                setEditingModule(null);
                setSelectedFile(null);
            } catch (error) {
                const { message } = translateError(error, 'Gagal menyimpan modul');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus modul ini?')) return;
        startTransition(async () => {
            try {
                await deleteModule(id);
                setMessage({ type: 'success', text: 'Modul berhasil dihapus!' });
            } catch (error) {
                const { message } = translateError(error, 'Gagal menghapus modul');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleEdit = (module: PracticumModuleWithCourse) => {
        setEditingModule(module);
        setShowForm(true);
        setSelectedFile(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modul Praktikum</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola modul praktikum laboratorium</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingModule(null); }}
                    className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Modul
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingModule ? 'Edit Modul' : 'Tambah Modul Baru'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingModule(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Modul *</label>
                                <input
                                    name="name"
                                    required
                                    defaultValue={editingModule?.name || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Modul 1 - Dasar Kriptografi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah</label>
                                <select
                                    name="courseId"
                                    defaultValue={editingModule?.courseId || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">-- Pilih Mata Kuliah --</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingModule ? 'File (Opsional - biarkan kosong jika tidak ingin mengubah)' : 'File'}
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-2 text-[#0F4C81]">
                                            <FileText className="w-5 h-5" />
                                            <span className="text-sm">{selectedFile.name}</span>
                                        </div>
                                    ) : editingModule?.filePath ? (
                                        <div className="text-sm text-gray-500">
                                            File saat ini: {editingModule.filePath.split('/').pop()}
                                            <br />
                                            <span className="text-xs">Klik untuk mengganti</span>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Klik atau drag file ke sini</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX (Maks. 2MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Modul (Opsional)</label>
                                <input
                                    name="moduleLink"
                                    type="url"
                                    defaultValue={editingModule?.moduleLink || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="https://drive.google.com/..."
                                />
                                <p className="text-xs text-gray-400 mt-1">Bisa isi link Google Drive, OneDrive, GitBook, atau URL lainnya.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    defaultValue={editingModule?.description || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Deskripsi modul..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-[#0F4C81] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? 'Menyimpan...' : editingModule ? 'Simpan Perubahan' : 'Tambah Modul'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingModule(null); }}
                                    className="text-gray-500 hover:text-gray-700 px-6 py-2 rounded-lg text-sm font-medium"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari modul..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                        />
                    </div>
                    <select
                        value={filterCourseId}
                        onChange={(e) => handleCourseFilterChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 min-w-0 w-full sm:min-w-[11.25rem] sm:w-auto"
                    >
                        <option value="">Semua Mata Kuliah</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500">
                    Menampilkan {filteredModules.length > 0 ? (currentPage - 1) * perPage + 1 : 0}-{Math.min(currentPage * perPage, filteredModules.length)} dari {filteredModules.length} modul
                </p>
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`} title="Tampilan Grid">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`} title="Tampilan List">
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Module Content */}
            {filteredModules.length === 0 ? (
                <div className="bg-white text-center py-12 rounded-xl border border-gray-100 shadow-sm text-gray-500">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">
                        {searchQuery || filterCourseId ? 'Tidak ada modul yang sesuai filter.' : 'Belum ada modul praktikum.'}
                    </p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Nama Modul</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Mata Kuliah</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Akses Modul</th>
                                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedModules.map((module) => (
                                    <tr key={module.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-[#0F4C81]" />
                                                <div className="font-medium text-gray-900">{module.name}</div>
                                            </div>
                                            {module.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{module.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {module.courseName ? (
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {module.courseCode} - {module.courseName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {module.filePath || module.moduleLink ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {module.filePath && (
                                                        <a
                                                            href={module.filePath}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[#0F4C81] hover:underline hover:text-blue-800 text-xs font-medium bg-blue-50/50 px-2 py-1 rounded"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Lihat File
                                                        </a>
                                                    )}
                                                    {module.moduleLink && (
                                                        <a
                                                            href={module.moduleLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-medium bg-emerald-50 px-2 py-1 rounded"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Buka Link
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Tidak ada file</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(module)}
                                                    className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(module.id)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedModules.map((module) => (
                        <div key={module.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#0F4C81]" />
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{module.name}</h3>
                                </div>
                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleEdit(module)}
                                        className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(module.id)}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {module.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{module.description}</p>
                            )}
                            <div className="flex items-end justify-between mt-4 top-auto">
                                <div>
                                    {module.courseName && (
                                        <div className="mb-2">
                                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {module.courseCode} - {module.courseName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {module.filePath && (
                                            <a
                                                href={module.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-[#0F4C81] hover:text-blue-800 bg-blue-50/50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                File
                                            </a>
                                        )}
                                        {module.moduleLink && (
                                            <a
                                                href={module.moduleLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        ← Sebelumnya
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) pageNum = i + 1;
                        else if (currentPage <= 4) pageNum = i + 1;
                        else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                        else pageNum = currentPage - 3 + i;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${pageNum === currentPage
                                    ? 'bg-[#0F4C81] text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Selanjutnya →
                    </button>
                </div>
            )}
        </div>
    );
}
