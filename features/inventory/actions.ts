'use server';

import { InventoryService } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { auditAction, writeActivityLog, getErrorMessage } from '@/lib/audit';

// --- Rooms ---

export async function getRooms() {
    return InventoryService.getRooms();
}

export async function createRoom(data: { name: string; location: string; capacity: number }) {
    return auditAction({ module: 'inventory', action: 'create_room', entityType: 'room', description: 'Admin membuat ruangan', metadata: data }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.createRoom(data);
        revalidatePath('/admin/inventory');
    });
}

export async function updateRoom(id: number, data: { name: string; location: string; capacity: number }) {
    return auditAction({ module: 'inventory', action: 'update_room', entityType: 'room', entityId: id, description: 'Admin memperbarui ruangan', metadata: data }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.updateRoom(id, data);
        revalidatePath('/admin/inventory');
    });
}

export async function deleteRoom(id: number) {
    return auditAction({ module: 'inventory', action: 'delete_room', entityType: 'room', entityId: id, description: 'Admin menghapus ruangan' }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.deleteRoom(id);
        revalidatePath('/admin/inventory');
    });
}

/**
 * Update room status only (for quick status change)
 */
export async function updateRoomStatus(
    id: number,
    status: 'Tersedia' | 'Maintenance'
) {
    return auditAction({ module: 'inventory', action: 'update_room_status', entityType: 'room', entityId: id, description: 'Admin mengubah status ruangan', metadata: { id, status } }, async () => {
        await requirePermission('inventory.manage');
        const { db } = await import('@/db');
        const { rooms } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');

        await db.update(rooms)
            .set({ status })
            .where(eq(rooms.id, id));

        revalidatePath('/admin/inventory');
    });
}

// --- Categories ---

export async function getCategories() {
    return InventoryService.getCategories();
}

export async function createCategory(data: { name: string }) {
    return auditAction({ module: 'inventory', action: 'create_category', entityType: 'item_category', description: 'Admin membuat kategori alat', metadata: data }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.createCategory(data);
        revalidatePath('/admin/inventory');
    });
}

export async function updateCategory(id: number, data: { name: string }) {
    await requirePermission('inventory.manage');
    try {
        await InventoryService.updateCategory(id, data);
        revalidatePath('/admin/inventory');
        await writeActivityLog({ module: 'inventory', action: 'update_category', entityType: 'item_category', entityId: id, description: 'Admin memperbarui kategori alat', metadata: data });
        return { success: true };
    } catch (error) {
        await writeActivityLog({ module: 'inventory', action: 'update_category', entityType: 'item_category', entityId: id, status: 'failed', description: 'Gagal memperbarui kategori alat', metadata: { data, error: getErrorMessage(error) } });
        return {
            success: false,
            error: 'Gagal memperbarui kategori.'
        };
    }
}

export async function deleteCategory(id: number) {
    await requirePermission('inventory.manage');
    try {
        await InventoryService.deleteCategory(id);
        revalidatePath('/admin/inventory');
        await writeActivityLog({ module: 'inventory', action: 'delete_category', entityType: 'item_category', entityId: id, description: 'Admin menghapus kategori alat' });
        return { success: true };
    } catch (error: any) {
        await writeActivityLog({ module: 'inventory', action: 'delete_category', entityType: 'item_category', entityId: id, status: 'failed', description: 'Gagal menghapus kategori alat', metadata: { error: getErrorMessage(error) } });
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return {
                success: false,
                error: 'Kategori tidak dapat dihapus karena masih memiliki barang yang terdaftar.'
            };
        }
        return {
            success: false,
            error: 'Gagal menghapus kategori. Silakan coba lagi.'
        };
    }
}

// --- Items ---

export async function getItems() {
    return InventoryService.getItems();
}

export async function createItem(data: {
    name: string;
    categoryId: number;
    roomId: number;
    description?: string;
    qrCode: string;
    quantity?: number;
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance'
}) {
    return auditAction({ module: 'inventory', action: 'create_item', entityType: 'item', description: 'Admin membuat alat', metadata: data }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.createItem(data);
        revalidatePath('/admin/inventory');
    });
}

export async function updateItem(id: number, data: {
    name: string;
    categoryId: number;
    roomId: number;
    description?: string;
    quantity?: number;
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance'
}) {
    return auditAction({ module: 'inventory', action: 'update_item', entityType: 'item', entityId: id, description: 'Admin memperbarui alat', metadata: data }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.updateItem(id, data);
        revalidatePath('/admin/inventory');
    });
}

export async function deleteItem(id: number) {
    return auditAction({ module: 'inventory', action: 'delete_item', entityType: 'item', entityId: id, description: 'Admin menghapus alat' }, async () => {
        await requirePermission('inventory.manage');
        await InventoryService.deleteItem(id);
        revalidatePath('/admin/inventory');
    });
}

/**
 * Update item status only (for quick status change)
 */
export async function updateItemStatus(
    id: number,
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance'
) {
    return auditAction({ module: 'inventory', action: 'update_item_status', entityType: 'item', entityId: id, description: 'Admin mengubah status alat', metadata: { id, status } }, async () => {
        await requirePermission('inventory.manage');
        const { db } = await import('@/db');
        const { items } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');

        await db.update(items)
            .set({ status })
            .where(eq(items.id, id));

        revalidatePath('/admin/inventory');
        revalidatePath('/student/items');
    });
}

export async function getMaintenanceItems() {
    return InventoryService.getMaintenanceItems();
}

export async function getItemByQrCode(qrCode: string) {
    return InventoryService.getByQrCode(qrCode);
}

/**
 * Get available items with category for homepage
 */
export async function getAvailableItems() {
    const { db } = await import('@/db');
    const { items, itemCategories } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const result = await db.select({
        id: items.id,
        name: items.name,
        qrCode: items.qrCode,
        status: items.status,
        quantity: items.quantity,
        category: {
            name: itemCategories.name
        }
    })
        .from(items)
        .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
        .where(eq(items.status, 'Tersedia'));

    return result;
}

/**
 * Get homepage statistics
 */
export async function getHomepageStats() {
    const { db } = await import('@/db');
    const { items, publications } = await import('@/db/schema');
    const { practicumModules } = await import('@/db/schema');
    const { eq, sql } = await import('drizzle-orm');

    const [totalItemsResult, availableItemsResult, modulesResult, publicationsResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(items),
        db.select({ count: sql<number>`count(*)` }).from(items).where(eq(items.status, 'Tersedia')),
        db.select({ count: sql<number>`count(*)` }).from(practicumModules),
        db.select({ count: sql<number>`count(*)` }).from(publications)
    ]);

    return {
        totalItems: totalItemsResult[0]?.count || 0,
        availableItems: availableItemsResult[0]?.count || 0,
        totalModules: modulesResult[0]?.count || 0,
        totalPublications: publicationsResult[0]?.count || 0
    };
}

