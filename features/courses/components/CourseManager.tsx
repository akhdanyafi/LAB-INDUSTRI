'use client';

import { useState, useTransition, useMemo } from 'react';
import { GraduationCap, Plus, Trash2, Edit, X, Search, User, LayoutGrid, List as ListIcon } from 'lucide-react';
import { createCourse, updateCourse, deleteCourse, assignLecturerToCourse } from '@/features/courses/actions';
import type { CourseWithLecturer } from '@/features/courses/types';
import { translateError } from '@/lib/error';

interface Lecturer {
    identifier: string;
    fullName: string;
}

interface CourseManagerProps {
    courses: CourseWithLecturer[];
    lecturers: Lecturer[];
    readOnly?: boolean;
}

export default function CourseManager({ courses, lecturers, readOnly = false }: CourseManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseWithLecturer | null>(null);
    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSemester, setFilterSemester] = useState('');

    // Pagination & View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 12;

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!c.name.toLowerCase().includes(query) && !c.code.toLowerCase().includes(query)) {
                    return false;
                }
            }
            if (filterSemester && c.semester !== filterSemester) {
                return false;
            }
            return true;
        });
    }, [courses, searchQuery, filterSemester]);

    // Apply pagination
    const totalPages = Math.ceil(filteredCourses.length / perPage);
    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return filteredCourses.slice(startIndex, startIndex + perPage);
    }, [filteredCourses, currentPage, perPage]);

    // Navigate back to page 1 if search/filter changes
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    };

    const handleSemesterFilterChange = (val: string) => {
        setFilterSemester(val);
        setCurrentPage(1);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const code = formData.get('code') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const sks = parseInt(formData.get('sks') as string) || 3;
        const semester = formData.get('semester') as 'Ganjil' | 'Genap' | '';
        const lecturerId = formData.get('lecturerId') as string;

        startTransition(async () => {
            try {
                const result = editingCourse
                    ? await updateCourse(editingCourse.id, {
                        code, name,
                        description: description || undefined,
                        sks, semester: semester || undefined,
                        lecturerId: lecturerId ? lecturerId : null,
                    })
                    : await createCourse({
                        code, name,
                        description: description || undefined,
                        sks, semester: semester || undefined,
                        lecturerId: lecturerId ? lecturerId : undefined,
                    });

                if (result?.error) {
                    const { message } = translateError(result.error, 'Gagal menyimpan mata kuliah');
                    setMessage({ type: 'error', text: message });
                    return;
                }

                setMessage({ type: 'success', text: editingCourse ? 'Mata kuliah berhasil diperbarui!' : 'Mata kuliah berhasil ditambahkan!' });
                setShowForm(false);
                setEditingCourse(null);
            } catch (error) {
                const { message } = translateError(error, 'Gagal menyimpan mata kuliah');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus mata kuliah ini?')) return;
        startTransition(async () => {
            try {
                const result = await deleteCourse(id);
                if (result?.error) {
                    const { message } = translateError(result.error, 'Gagal menghapus mata kuliah');
                    setMessage({ type: 'error', text: message });
                    return;
                }
                setMessage({ type: 'success', text: 'Mata kuliah berhasil dihapus!' });
            } catch (error) {
                const { message } = translateError(error, 'Gagal menghapus mata kuliah');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleEdit = (course: CourseWithLecturer) => {
        setEditingCourse(course);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mata Kuliah</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola daftar mata kuliah dan dosen pengajar</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => { setShowForm(true); setEditingCourse(null); }}
                        className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Mata Kuliah
                    </button>
                )}
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
                                {editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingCourse(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode MK *</label>
                                    <input
                                        name="code"
                                        required
                                        defaultValue={editingCourse?.code || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                        placeholder="IF201"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKS</label>
                                    <input
                                        name="sks"
                                        type="number"
                                        min={1}
                                        max={6}
                                        defaultValue={editingCourse?.sks || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Kuliah *</label>
                                <input
                                    name="name"
                                    required
                                    defaultValue={editingCourse?.name || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                    placeholder="Basis Data"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select
                                    name="semester"
                                    defaultValue={editingCourse?.semester || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                >
                                    <option value="">-- Pilih Semester --</option>
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dosen Pengajar</label>
                                <select
                                    name="lecturerId"
                                    defaultValue={editingCourse?.lecturerId || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                >
                                    <option value="">-- Belum ditentukan --</option>
                                    {lecturers.map(l => (
                                        <option key={l.identifier} value={l.identifier}>{l.fullName} ({l.identifier})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    defaultValue={editingCourse?.description || ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                                    placeholder="Deskripsi mata kuliah..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-[#0F4C81] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? 'Menyimpan...' : editingCourse ? 'Simpan Perubahan' : 'Tambah'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingCourse(null); }}
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
                            placeholder="Cari kode atau nama mata kuliah..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                        />
                    </div>
                    <select
                        value={filterSemester}
                        onChange={(e) => handleSemesterFilterChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 min-w-0 w-full sm:min-w-[11.25rem] sm:w-auto"
                    >
                        <option value="">Semua Semester</option>
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                    </select>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500">
                    Menampilkan {filteredCourses.length > 0 ? (currentPage - 1) * perPage + 1 : 0}-{Math.min(currentPage * perPage, filteredCourses.length)} dari {filteredCourses.length} mata kuliah
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

            {/* Course Content */}
            {filteredCourses.length === 0 ? (
                <div className="bg-white text-center py-12 rounded-xl border border-gray-100 shadow-sm text-gray-500">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">
                        {searchQuery || filterSemester ? 'Tidak ada mata kuliah yang sesuai pencarian/filter.' : 'Belum ada mata kuliah.'}
                    </p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Kode</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Nama</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">SKS</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Semester</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Dosen</th>
                                    {!readOnly && <th className="text-center px-6 py-3 font-semibold text-gray-600">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-700">
                                                {course.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-[#0F4C81]" />
                                                <span className="font-medium text-gray-900">{course.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{course.sks}</td>
                                        <td className="px-6 py-4 text-gray-600">{course.semester || '-'}</td>
                                        <td className="px-6 py-4">
                                            {course.lecturerName ? (
                                                <span className="inline-flex items-center gap-1 text-gray-700">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {course.lecturerName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Belum ditentukan</span>
                                            )}
                                        </td>
                                        {!readOnly && (
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(course)}
                                                        className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(course.id)}
                                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCourses.map((course) => (
                        <div key={course.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1" title={course.name}>{course.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5 flex gap-1.5 items-center">
                                            <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">{course.code}</span>
                                            <span>•</span>
                                            <span className={`inline-flex px-1.5 py-0.5 rounded font-medium ${course.semester === 'Ganjil' ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700'}`}>
                                                {course.semester || 'Tanpa Semester'}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{course.sks || '-'} SKS</p>
                                    </div>
                                </div>
                                {!readOnly && (
                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                        <button onClick={() => handleEdit(course)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                {course.lecturerName ? (
                                    <span className="text-xs text-gray-600 truncate" title={course.lecturerName}>{course.lecturerName}</span>
                                ) : (
                                    <span className="text-xs text-gray-400">Dosen belum ditentukan</span>
                                )}
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
