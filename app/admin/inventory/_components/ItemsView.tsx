'use client';

import { createItem, deleteItem, updateItem } from '@/features/inventory/actions';
import { Plus, Trash2, Box, Tag, MapPin, Settings, Edit, Search, LayoutGrid, List } from 'lucide-react';
import QRCodeDisplay from '@/components/shared/QRCodeDisplay';
import { useState, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import ItemCard from '@/app/student/items/_components/ItemCard';
import CategoriesView from './CategoriesView';
import { useAlert } from '@/components/providers/AlertProvider';
import { translateError } from '@/lib/error';

interface Item {
    id: number;
    name: string;
    description: string | null;
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance' | null;
    qrCode: string;
    quantity: number;
    category: { id: number; name: string };
    room: { id: number; name: string };
}

interface Room {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface ItemsViewProps {
    items: Item[];
    rooms: Room[];
    categories: Category[];
}

export default function ItemsView({ items, rooms, categories }: ItemsViewProps) {
    const { showConfirm, showAlert } = useAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768 ? 'list' : 'grid';
        }
        return 'list';
    });

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterRoom, setFilterRoom] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Filtered items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!item.name.toLowerCase().includes(query) &&
                    !item.description?.toLowerCase().includes(query)) {
                    return false;
                }
            }
            // Category filter
            if (filterCategory && item.category.id !== parseInt(filterCategory)) {
                return false;
            }
            // Room filter
            if (filterRoom && item.room.id !== parseInt(filterRoom)) {
                return false;
            }
            // Status filter
            if (filterStatus && item.status !== filterStatus) {
                return false;
            }
            return true;
        });
    }, [items, searchQuery, filterCategory, filterRoom, filterStatus]);

    const handleEdit = async (formData: FormData) => {
        if (!editingItem) return;
        setIsSubmitting(true);
        const name = formData.get('name') as string;
        const categoryId = parseInt(formData.get('categoryId') as string);
        const roomId = parseInt(formData.get('roomId') as string);
        const description = formData.get('description') as string;
        const quantity = parseInt(formData.get('quantity') as string) || 1;

        try {
            await updateItem(editingItem.id, {
                name,
                categoryId,
                roomId,
                description: description || undefined,
                quantity,
                status: editingItem.status || 'Tersedia' as const
            });
            setEditingItem(null);
            showAlert({ title: 'Berhasil', message: 'Alat berhasil diperbarui', type: 'success' });
        } catch (error: any) {
            const { title, message } = translateError(error);
            showAlert({ title, message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Item Form */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Tambah Alat Baru
                    </h2>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="text-sm text-primary hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Kelola Kategori
                    </button>
                </div>
                <form action={async (formData) => {
                    setIsSubmitting(true);
                    const name = formData.get('name') as string;
                    const categoryId = parseInt(formData.get('categoryId') as string);
                    const roomId = parseInt(formData.get('roomId') as string);
                    const description = formData.get('description') as string;
                    const quantity = parseInt(formData.get('quantity') as string) || 1;

                    // Generate QR code string (using timestamp + random for uniqueness)
                    const qrCode = `ITEM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

                    try {
                        await createItem({
                            name,
                            categoryId,
                            roomId,
                            description: description || undefined,
                            qrCode,
                            quantity,
                            status: 'Tersedia'
                        });
                        const form = document.getElementById('add-item-form') as HTMLFormElement;
                        form?.reset();
                        showAlert({ title: 'Berhasil', message: 'Alat berhasil ditambahkan', type: 'success' });
                    } catch (error: any) {
                        const { title, message } = translateError(error);
                        showAlert({ title, message, type: 'error' });
                    } finally {
                        setIsSubmitting(false);
                    }
                }} id="add-item-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Alat</label>
                        <input name="name" required placeholder="Contoh: Macbook Pro M1" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select name="categoryId" required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">Pilih Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                        <select name="roomId" required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="">Pilih Ruangan</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                        <input name="quantity" type="number" min={1} defaultValue={1} required className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
                        <input name="description" placeholder="Spesifikasi atau catatan" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Alat'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama alat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    {/* Room Filter */}
                    <select
                        value={filterRoom}
                        onChange={(e) => setFilterRoom(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                    >
                        <option value="">Semua Ruangan</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </select>
                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                    >
                        <option value="">Semua Status</option>
                        <option value="Tersedia">Tersedia</option>
                        <option value="Dipinjam">Dipinjam</option>
                        <option value="Maintenance">Maintenance</option>
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
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-500">Menampilkan {filteredItems.length} dari {items.length} alat</p>
                </div>
            </div>

            {/* Items List */}
            {viewMode === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Nama Alat</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Kategori</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Lokasi</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Jumlah</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">QR Code</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Box className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                            <Tag className="w-3 h-3" />
                                            {item.category.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="flex items-center gap-1 text-sm">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {item.room.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'Dipinjam' ? (
                                            // Dipinjam is read-only (controlled by loan process)
                                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700">
                                                Dipinjam
                                            </span>
                                        ) : (
                                            // Admin can only toggle between Tersedia and Maintenance
                                            <select
                                                defaultValue={item.status || 'Tersedia'}
                                                onChange={async (e) => {
                                                try {
                                                    const { updateItemStatus } = await import('@/features/inventory/actions');
                                                    await updateItemStatus(
                                                        item.id,
                                                        e.target.value as 'Tersedia' | 'Maintenance'
                                                    );
                                                } catch (error: any) {
                                                    const { title, message } = translateError(error);
                                                    showAlert({ title, message, type: 'error' });
                                                }
                                            }}
                                                className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${item.status === 'Tersedia' ? 'bg-green-50 text-green-700' :
                                                    'bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <option value="Tersedia">Tersedia</option>
                                                <option value="Maintenance">Maintenance</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <QRCodeDisplay value={item.qrCode} baseUrl={process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 justify-center">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <form action={async () => {
                                                const confirmed = await showConfirm({
                                                    title: 'Hapus Alat',
                                                    message: 'Apakah Anda yakin ingin menghapus alat ini?',
                                                    type: 'danger',
                                                    confirmText: 'Hapus'
                                                });
                                                if (confirmed) {
                                                    try {
                                                        await deleteItem(item.id);
                                                        showAlert({ title: 'Berhasil', message: 'Alat berhasil dihapus', type: 'success' });
                                                    } catch (error: any) {
                                                        const { title, message } = translateError(error);
                                                        showAlert({ title, message, type: 'error' });
                                                    }
                                                }
                                            }}>
                                                <button
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {items.length === 0
                                            ? 'Belum ada data alat. Silahkan tambahkan alat baru.'
                                            : 'Tidak ada alat yang sesuai filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item as any} 
                            userId="" 
                            role="admin" 
                            variant="grid" 
                            onEdit={() => setEditingItem(item)}
                            onDelete={async () => {
                                const confirmed = await showConfirm({
                                    title: 'Hapus Alat',
                                    message: 'Apakah Anda yakin ingin menghapus alat ini?',
                                    type: 'danger',
                                    confirmText: 'Hapus'
                                });
                                if (confirmed) {
                                    try {
                                        await deleteItem(item.id);
                                        showAlert({ title: 'Berhasil', message: 'Alat berhasil dihapus', type: 'success' });
                                    } catch (error: any) {
                                        const { title, message } = translateError(error);
                                        showAlert({ title, message, type: 'error' });
                                    }
                                }
                            }}
                            onStatusChange={async (status) => {
                                try {
                                    const { updateItemStatus } = await import('@/features/inventory/actions');
                                    await updateItemStatus(item.id, status as 'Tersedia' | 'Maintenance');
                                } catch (error: any) {
                                    const { title, message } = translateError(error);
                                    showAlert({ title, message, type: 'error' });
                                }
                            }}
                        />
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                             {items.length === 0
                                ? 'Belum ada data alat. Silahkan tambahkan alat baru.'
                                : 'Tidak ada alat yang sesuai filter.'}
                        </div>
                    )}
                </div>
            )}

            {/* Category Management Modal */}
            <Modal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                title="Manajemen Kategori"
            >
                <CategoriesView categories={categories} />
            </Modal>

            {/* Edit Item Modal */}
            <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Edit Alat"
            >
                {editingItem && (
                    <form action={handleEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Alat</label>
                            <input
                                name="name"
                                required
                                defaultValue={editingItem.name}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select
                                name="categoryId"
                                required
                                defaultValue={editingItem.category.id}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                            <select
                                name="roomId"
                                required
                                defaultValue={editingItem.room.id}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                            <input
                                name="quantity"
                                type="number"
                                min={1}
                                required
                                defaultValue={editingItem.quantity || 1}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea
                                name="description"
                                defaultValue={editingItem.description || ''}
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
