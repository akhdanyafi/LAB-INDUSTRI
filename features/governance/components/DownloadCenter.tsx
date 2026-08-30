'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Download, FileText, FileCheck, FileSignature, ClipboardList, Search, X, Calendar, User } from 'lucide-react';

interface DownloadDocument {
    id: number;
    title: string;
    filePath: string;
    coverPath: string | null;
    type: string;
    createdAt: Date | null;
    uploaderName: string | null;
}

interface DownloadCenterProps {
    documents: DownloadDocument[];
}

type FilterType = 'all' | 'SOP' | 'LPJ Bulanan' | 'Template Surat' | 'Template Berita Acara';

const typeConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
    'SOP': { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    'LPJ Bulanan': { icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    'Template Surat': { icon: FileSignature, color: 'text-purple-600', bg: 'bg-purple-50' },
    'Template Berita Acara': { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
};

export default function DownloadCenter({ documents }: DownloadCenterProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDocuments = useMemo(() => {
        let docs = documents;
        if (filter !== 'all') docs = docs.filter(d => d.type === filter);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            docs = docs.filter(d => d.title.toLowerCase().includes(query));
        }
        return docs;
    }, [documents, filter, searchQuery]);

    const counts = useMemo(() => ({
        all: documents.length,
        SOP: documents.filter(d => d.type === 'SOP').length,
        'LPJ Bulanan': documents.filter(d => d.type === 'LPJ Bulanan').length,
        'Template Surat': documents.filter(d => d.type === 'Template Surat').length,
        'Template Berita Acara': documents.filter(d => d.type === 'Template Berita Acara').length,
    }), [documents]);

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pusat Download</h1>
                <p className="text-gray-500 text-sm mt-1">Download template, SOP, surat, dan dokumen lainnya</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {([
                    { key: 'all', label: 'Semua', icon: Download },
                    { key: 'SOP', label: 'SOP', icon: FileCheck },
                    { key: 'LPJ Bulanan', label: 'LPJ Bulanan', icon: FileText },
                    { key: 'Template Surat', label: 'Template Surat', icon: FileSignature },
                    { key: 'Template Berita Acara', label: 'Template Berita Acara', icon: ClipboardList },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === key
                                ? 'bg-[#0F4C81] text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari dokumen..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {(searchQuery || filter !== 'all') && (
                <p className="text-sm text-gray-500">Menampilkan {filteredDocuments.length} dari {documents.length} dokumen</p>
            )}

            {/* Document Grid */}
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-gray-600 font-medium text-lg">Tidak ada dokumen</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        {searchQuery ? 'Coba ubah kata pencarian' : 'Belum ada dokumen yang diupload'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc) => {
                        const config = typeConfig[doc.type] || typeConfig['SOP'];
                        const Icon = config.icon;
                        return (
                            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                {doc.coverPath && (
                                    <div className="relative h-32 bg-gray-100 overflow-hidden">
                                        <Image src={doc.coverPath} alt={doc.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                            <Icon className="w-3 h-3" />
                                            {doc.type}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-3">{doc.title}</h3>
                                    <div className="space-y-1.5 mb-4">
                                        {doc.uploaderName && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <User className="w-3 h-3" />
                                                <span>{doc.uploaderName}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(doc.createdAt)}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F4C81] text-white text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
