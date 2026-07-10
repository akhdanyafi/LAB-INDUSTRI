/**
 * Inventory Service
 * Business logic for rooms, categories, and items management
 */

import { db } from '@/db';
import { rooms, itemCategories, items } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// --- Room Types ---
export interface CreateRoomInput {
    name: string;
    location: string;
    capacity: number;
}

export interface UpdateRoomInput extends CreateRoomInput { }

// --- Category Types ---
export interface CreateCategoryInput {
    name: string;
}

export interface UpdateCategoryInput extends CreateCategoryInput { }

// --- Item Types ---
export interface CreateItemInput {
    name: string;
    categoryId: number;
    roomId: number;
    description?: string;
    qrCode: string;
    quantity?: number;
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance';
}

export interface UpdateItemInput {
    name: string;
    categoryId: number;
    roomId: number;
    description?: string;
    quantity?: number;
    status: 'Tersedia' | 'Dipinjam' | 'Maintenance';
}

export class InventoryService {
    // --- Rooms ---

    static async getRooms() {
        return await db.select().from(rooms).orderBy(desc(rooms.id));
    }

    static async createRoom(data: CreateRoomInput) {
        await db.insert(rooms).values(data);
    }

    static async updateRoom(id: number, data: UpdateRoomInput) {
        await db.update(rooms).set(data).where(eq(rooms.id, id));
    }

    static async deleteRoom(id: number) {
        await db.delete(rooms).where(eq(rooms.id, id));
    }

    // --- Categories ---

    static async getCategories() {
        return await db.select().from(itemCategories).orderBy(desc(itemCategories.id));
    }

    static async createCategory(data: CreateCategoryInput) {
        await db.insert(itemCategories).values(data);
    }

    static async updateCategory(id: number, data: UpdateCategoryInput) {
        await db.update(itemCategories).set(data).where(eq(itemCategories.id, id));
    }

    static async deleteCategory(id: number) {
        await db.delete(itemCategories).where(eq(itemCategories.id, id));
    }

    // --- Items ---

    static async getItems() {
        const itemsRaw = await db
            .select({
                item: items,
                category: itemCategories,
                room: rooms,
            })
            .from(items)
            .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
            .leftJoin(rooms, eq(items.roomId, rooms.id))
            .orderBy(desc(items.id));

        return itemsRaw.map(row => ({
            ...row.item,
            category: row.category!,
            room: row.room!,
        }));
    }

    static async createItem(data: CreateItemInput) {
        await db.insert(items).values(data);
    }

    static async updateItem(id: number, data: UpdateItemInput) {
        await db.update(items).set(data).where(eq(items.id, id));
    }

    static async deleteItem(id: number) {
        await db.delete(items).where(eq(items.id, id));
    }

    static async getMaintenanceItems() {
        const itemsRaw = await db
            .select({
                item: items,
                room: rooms,
            })
            .from(items)
            .leftJoin(rooms, eq(items.roomId, rooms.id))
            .where(eq(items.status, 'Maintenance'))
            .orderBy(desc(items.id));

        return itemsRaw.map(row => ({
            ...row.item,
            room: row.room!,
        }));
    }

    static async getByQrCode(qrCode: string) {
        const result = await db
            .select({
                item: items,
                category: itemCategories,
                room: rooms,
            })
            .from(items)
            .leftJoin(itemCategories, eq(items.categoryId, itemCategories.id))
            .leftJoin(rooms, eq(items.roomId, rooms.id))
            .where(eq(items.qrCode, qrCode))
            .limit(1);

        if (result.length === 0) return null;

        const row = result[0];
        return {
            ...row.item,
            category: row.category!,
            room: row.room!,
        };
    }
}
