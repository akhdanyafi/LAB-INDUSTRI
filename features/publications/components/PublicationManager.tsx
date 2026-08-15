'use client';

import { useState, useTransition, useMemo } from 'react';
import { BookOpen, Plus, Trash2, ExternalLink, FileText, Upload, X, Search, Edit, Eye, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPublication, deletePublication, updatePublication } from '@/features/publications/actions';
import LikeButton from './LikeButton';
import { translateError } from '@/lib/error';

interface Publication {
    id: number;
    title: string;
    authorName: string;
    abstract?: string | null;
    keywords?: string | null;
    link?: string | null;
    filePath?: string | null;
    viewCount: number;
    publishYear?: number | null;
    publishMonth?: number | null;
    publishDay?: number | null;
    createdAt?: Date | null;
    uploaderName?: string | null;
}

interface Props {
    publications: Publication[];
    userId: string;
}

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatPublishDate(year?: number | null, month?: number | null, day?: number | null): string {
    if (!year) return '-';
    let str = String(year);
    if (month) {
        str = MONTHS[month - 1] + ' ' + str;
        if (day) str = day + ' ' + str;
    }
    return str;
}

export default function PublicationManager({ publications, userId }: Props) {
    const [activeTab, setActiveTab] = useState<'upload' | 'all'>('all');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterKeyword, setFilterKeyword] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });

    // Extract all unique keywords from publications
    const allKeywords = useMemo(() => {
        const keywordSet = new Set<string>();
        publications.forEach(pub => {
            if (pub.keywords) {
                try {
                    const kws = JSON.parse(pub.keywords);
                    kws.forEach((kw: string) => keywordSet.add(kw));
                } catch { }
            }
        });
        return Array.from(keywordSet).sort();
    }, [publications]);

    // Extract all unique years from publications
    const allYears = useMemo(() => {
        const yearSet = new Set<number>();
        publications.forEach(pub => {
            if (pub.publishYear) yearSet.add(pub.publishYear);
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [publications]);

    // Filtered publications
    const filteredPublications = useMemo(() => {
        return publications.filter(pub => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!pub.title.toLowerCase().includes(query) && !pub.authorName.toLowerCase().includes(query)) {
                    return false;
                }
            }
            if (filterKeyword && pub.keywords) {
                if (!pub.keywords.includes(filterKeyword)) {
                    return false;
                }
            } else if (filterKeyword && !pub.keywords) {
                return false;
            }
            if (filterYear && pub.publishYear !== Number(filterYear)) {
                return false;
            }
            if (filterMonth && pub.publishMonth !== Number(filterMonth)) {
                return false;
            }
            return true;
        });
    }, [publications, searchQuery, filterKeyword, filterYear, filterMonth]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    // Reset page when filters change
    const totalPages = Math.ceil(filteredPublications.length / perPage);
    const paginatedPublications = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredPublications.slice(start, start + perPage);
    }, [filteredPublications, currentPage, perPage]);

    // Reset to page 1 when filters change
    const resetPage = () => setCurrentPage(1);

    // Edit state
    const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingPublication) return;

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const authorName = formData.get('authorName') as string;
        const abstract = formData.get('abstract') as string;
        const link = formData.get('link') as string;
        const keywordsRaw = formData.get('keywords') as string;
        const publishYear = formData.get('publishYear') as string;
        const publishMonth = formData.get('publishMonth') as string;
        const publishDay = formData.get('publishDay') as string;

        let keywords = keywordsRaw;
        if (keywordsRaw && !keywordsRaw.startsWith('[')) {
            keywords = JSON.stringify(keywordsRaw.split(',').map(k => k.trim()).filter(Boolean));
        }

        startTransition(async () => {
            try {
                await updatePublication(editingPublication.id, {
                    title,
                    authorName,
                    abstract: abstract || undefined,
                    link: link || undefined,
                    keywords: keywords || undefined,
                    publishYear: publishYear ? parseInt(publishYear) : undefined,
                    publishMonth: publishMonth ? parseInt(publishMonth) : null,
                    publishDay: publishDay ? parseInt(publishDay) : null,
                });
                setMessage({ type: 'success', text: 'Publikasi berhasil diperbarui!' });
                setEditingPublication(null);
            } catch (error) {
                const { message } = translateError(error, 'Gagal memperbarui publikasi');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus publikasi ini?')) return;
        startTransition(async () => {
            try {
                await deletePublication(id);
                setMessage({ type: 'success', text: 'Publikasi dihapus' });
            } catch (error) {
                const { message } = translateError(error, 'Gagal menghapus publikasi');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    const handleDirectPublish = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const authorName = formData.get('authorName') as string;
        const abstract = formData.get('abstract') as string;
        const link = formData.get('link') as string;
        const keywordsRaw = formData.get('keywords') as string;
        const publishYear = formData.get('publishYear') as string;
        const publishMonth = formData.get('publishMonth') as string;
        const publishDay = formData.get('publishDay') as string;

        const keywords = keywordsRaw
            ? JSON.stringify(keywordsRaw.split(',').map(k => k.trim()).filter(Boolean))
            : undefined;

        startTransition(async () => {
            try {
                let filePath: string | undefined;

                if (selectedFile) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', selectedFile);
                    uploadFormData.append('folder', 'publications');

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

                await createPublication({
                    uploaderId: userId,
                    title,
                    authorName,
                    abstract: abstract || undefined,
                    link: link || undefined,
                    keywords,
                    filePath,
                    publishYear: publishYear ? parseInt(publishYear) : undefined,
                    publishMonth: publishMonth ? parseInt(publishMonth) : undefined,
                    publishDay: publishDay ? parseInt(publishDay) : undefined,
                });
                setMessage({ type: 'success', text: 'Publikasi berhasil ditambahkan!' });
                setSelectedFile(null);
                (e.target as HTMLFormElement).reset();
            } catch (error) {
                const { message } = translateError(error, 'Gagal menambahkan publikasi');
                setMessage({ type: 'error', text: message });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'all'
                        ? 'bg-white text-[#0F4C81] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Semua Publikasi
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload'
                        ? 'bg-white text-[#0F4C81] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Upload Publikasi
                </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#0F4C81]" />
                        Upload Publikasi
                    </h2>

                    <form onSubmit={handleDirectPublish} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Publikasi *</label>
                            <input name="title" required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penulis *</label>
                            <input name="authorName" required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>

                        {/* Date fields: Year (required conceptually), Month, Day (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Publikasi</label>
                            <input type="number" name="publishYear" min="1900" max="2099" placeholder="cth: 2025" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                                <select name="publishMonth" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                                    <option value="">- Opsional -</option>
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                                <input type="number" name="publishDay" min="1" max="31" placeholder="- Opsional -" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link (opsional)</label>
                            <input type="url" name="link" placeholder="https://..." className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Kunci (pisahkan dengan koma)</label>
                            <input name="keywords" placeholder="AI, Machine Learning, Data Science" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>

                        {/* File Upload */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">File Publikasi (PDF)</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                                {selectedFile ? (
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#0F4C81]" />
                                            <span className="text-sm text-gray-700">{selectedFile.name}</span>
                                            <span className="text-xs text-gray-400">
                                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center cursor-pointer py-4">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Klik untuk upload file PDF</span>
                                        <span className="text-xs text-gray-400 mt-1">Maks. 2MB</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        alert('File terlalu besar (maks. 2MB)');
                                                        return;
                                                    }
                                                    setSelectedFile(file);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Abstrak</label>
                            <textarea name="abstract" rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={isPending} className="bg-[#0F4C81] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                                {isPending ? 'Mengupload...' : 'Publikasikan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* All Publications Tab */}
            {activeTab === 'all' && (
                <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari judul atau penulis..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                />
                            </div>
                            <select
                                value={filterKeyword}
                                onChange={(e) => { setFilterKeyword(e.target.value); resetPage(); }}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Semua Kata Kunci</option>
                                {allKeywords.map(kw => (
                                    <option key={kw} value={kw}>{kw}</option>
                                ))}
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => { setFilterYear(e.target.value); resetPage(); }}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Semua Tahun</option>
                                {allYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={filterMonth}
                                onChange={(e) => { setFilterMonth(e.target.value); resetPage(); }}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Semua Bulan</option>
                                {MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            {/* View Toggle */}
                            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan Grid"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan List"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Toolbar: Count + Per Page */}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                Menampilkan {Math.min((currentPage - 1) * perPage + 1, filteredPublications.length)}-{Math.min(currentPage * perPage, filteredPublications.length)} dari {filteredPublications.length} publikasi
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>Per halaman:</span>
                                {[10, 20, 50, 100].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => { setPerPage(n); setCurrentPage(1); }}
                                        className={`px-2 py-1 rounded ${perPage === n ? 'bg-[#0F4C81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Publications */}
                    {filteredPublications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>Tidak ada publikasi yang sesuai filter.</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* List View */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                                            <th className="px-6 py-3 font-medium">Judul</th>
                                            <th className="px-4 py-3 font-medium">Penulis</th>
                                            <th className="px-4 py-3 font-medium">Kata Kunci</th>
                                            <th className="px-4 py-3 font-medium">Tahun</th>
                                            <th className="px-4 py-3 font-medium text-center">Views</th>
                                            <th className="px-4 py-3 font-medium text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedPublications.map((pub) => {
                                            let pubKeywords: string[] = [];
                                            if (pub.keywords) { try { pubKeywords = JSON.parse(pub.keywords); } catch { } }
                                            return (
                                                <tr key={pub.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900 line-clamp-1">{pub.title}</div>
                                                        {pub.abstract && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{pub.abstract}</p>}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{pub.authorName}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {pubKeywords.slice(0, 2).map((kw, idx) => (
                                                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{kw}</span>
                                                            ))}
                                                            {pubKeywords.length > 2 && <span className="text-xs text-gray-400">+{pubKeywords.length - 2}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500">
                                                        {formatPublishDate(pub.publishYear, pub.publishMonth, pub.publishDay)}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm text-gray-500 flex items-center justify-center gap-1">
                                                            <Eye className="w-3 h-3" />{pub.viewCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {(pub.link || pub.filePath) && (
                                                                <a href={pub.link || pub.filePath || '#'} target="_blank" rel="noopener noreferrer" className="text-[#0F4C81] hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            <button onClick={() => setEditingPublication(pub)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(pub.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedPublications.map((pub) => {
                                const keywords = pub.keywords ? (() => {
                                    try { return JSON.parse(pub.keywords); } catch { return []; }
                                })() : [];

                                return (
                                    <div key={pub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-[#0F4C81]" />
                                                {pub.publishYear && (
                                                    <span className="text-xs text-gray-500">
                                                        {formatPublishDate(pub.publishYear, pub.publishMonth, pub.publishDay)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setEditingPublication(pub)}
                                                    className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pub.id)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{pub.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{pub.authorName}</p>
                                        {pub.abstract && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{pub.abstract}</p>
                                        )}
                                        {keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {keywords.slice(0, 3).map((kw: string, idx: number) => (
                                                    <span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                        {kw}
                                                    </span>
                                                ))}
                                                {keywords.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{keywords.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {pub.viewCount}
                                                </span>
                                                <LikeButton
                                                    publicationId={pub.id}
                                                    userId={userId}
                                                />
                                            </div>
                                            {(pub.link || pub.filePath) && (
                                                <a
                                                    href={pub.link || pub.filePath || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-[#0F4C81] hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Lihat
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" /> Sebelumnya
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
                                        className={`px-3 py-2 rounded-lg text-sm ${pageNum === currentPage
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
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Selanjutnya <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingPublication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Publikasi</h3>
                            <button
                                onClick={() => setEditingPublication(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
                                    <input
                                        name="title"
                                        required
                                        defaultValue={editingPublication.title}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Penulis *</label>
                                    <input
                                        name="authorName"
                                        required
                                        defaultValue={editingPublication.authorName}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Date fields */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Publikasi</label>
                                    <input
                                        type="number" name="publishYear" min="1900" max="2099"
                                        defaultValue={editingPublication.publishYear || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                                        <select name="publishMonth" defaultValue={editingPublication.publishMonth || ''} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                                            <option value="">- Opsional -</option>
                                            {MONTHS.map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                                        <input type="number" name="publishDay" min="1" max="31" defaultValue={editingPublication.publishDay || ''} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                                    <input
                                        name="link"
                                        defaultValue={editingPublication.link || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Kunci</label>
                                    <input
                                        name="keywords"
                                        defaultValue={(() => {
                                            if (!editingPublication.keywords) return '';
                                            try {
                                                const kws = JSON.parse(editingPublication.keywords);
                                                return Array.isArray(kws) ? kws.join(', ') : editingPublication.keywords;
                                            } catch {
                                                return editingPublication.keywords;
                                            }
                                        })()}
                                        placeholder="AI, Machine Learning, Data Science"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Abstrak</label>
                                    <textarea
                                        name="abstract"
                                        rows={3}
                                        defaultValue={editingPublication.abstract || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-[#0F4C81] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingPublication(null)}
                                    className="text-gray-500 hover:text-gray-700 px-6 py-2 rounded-lg text-sm font-medium"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
