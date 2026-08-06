/**
 * Hits Info Service
 * Business logic untuk Informasi Hits (kegiatan prodi & mahasiswa berprestasi)
 */

import { db } from '@/db';
import { hitsInfo, hitsCategories } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export interface HitsInfoRow {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    focalX: number;
    focalY: number;
    link: string | null;
    isPublished: boolean;
    displayOrder: number;
    createdAt: Date | null;
    categoryId: number | null;
    categoryName: string | null;
    categoryColor: string | null;
}

export interface CreateHitsInfoInput {
    title: string;
    description?: string | null;
    imageUrl: string;
    focalX: number;
    focalY: number;
    link?: string | null;
    categoryId?: number | null;
    isPublished?: boolean;
    displayOrder?: number;
}

export interface UpdateHitsInfoInput {
    title: string;
    description?: string | null;
    imageUrl?: string;
    focalX?: number;
    focalY?: number;
    link?: string | null;
    categoryId?: number | null;
    isPublished?: boolean;
    displayOrder?: number;
}

export class HitsService {
    private static baseSelect() {
        return db
            .select({
                id: hitsInfo.id,
                title: hitsInfo.title,
                description: hitsInfo.description,
                imageUrl: hitsInfo.imageUrl,
                focalX: hitsInfo.focalX,
                focalY: hitsInfo.focalY,
                link: hitsInfo.link,
                isPublished: hitsInfo.isPublished,
                displayOrder: hitsInfo.displayOrder,
                createdAt: hitsInfo.createdAt,
                categoryId: hitsInfo.categoryId,
                categoryName: hitsCategories.name,
                categoryColor: hitsCategories.color,
            })
            .from(hitsInfo)
            .leftJoin(hitsCategories, eq(hitsInfo.categoryId, hitsCategories.id));
    }

    /** Semua informasi (untuk halaman admin) */
    static async getAll(): Promise<HitsInfoRow[]> {
        return (await this.baseSelect().orderBy(
            asc(hitsInfo.displayOrder),
            desc(hitsInfo.createdAt),
        )) as HitsInfoRow[];
    }

    /** Informasi yang dipublikasikan (homepage & dashboard) */
    static async getPublished(limit?: number): Promise<HitsInfoRow[]> {
        const query = this.baseSelect()
            .where(eq(hitsInfo.isPublished, true))
            .orderBy(asc(hitsInfo.displayOrder), desc(hitsInfo.createdAt));

        const rows = limit ? await query.limit(limit) : await query;
        return rows as HitsInfoRow[];
    }

    static async getById(id: number) {
        const rows = await db.select().from(hitsInfo).where(eq(hitsInfo.id, id)).limit(1);
        return rows[0] ?? null;
    }

    static async create(data: CreateHitsInfoInput) {
        await db.insert(hitsInfo).values({
            title: data.title,
            description: data.description ?? null,
            imageUrl: data.imageUrl,
            focalX: data.focalX,
            focalY: data.focalY,
            link: data.link ?? null,
            categoryId: data.categoryId ?? null,
            isPublished: data.isPublished ?? true,
            displayOrder: data.displayOrder ?? 0,
        });
    }

    static async update(id: number, data: UpdateHitsInfoInput) {
        const updateData: Record<string, unknown> = {
            title: data.title,
            description: data.description ?? null,
            link: data.link ?? null,
            categoryId: data.categoryId ?? null,
        };

        if (data.focalX !== undefined) updateData.focalX = data.focalX;
        if (data.focalY !== undefined) updateData.focalY = data.focalY;
        if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
        if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
        if (data.imageUrl) updateData.imageUrl = data.imageUrl;

        await db.update(hitsInfo).set(updateData).where(eq(hitsInfo.id, id));
    }

    static async delete(id: number) {
        await db.delete(hitsInfo).where(eq(hitsInfo.id, id));
    }
}

export class HitsCategoryService {
    static async getAll() {
        return await db.select().from(hitsCategories).orderBy(asc(hitsCategories.name));
    }

    static async getById(id: number) {
        const rows = await db.select().from(hitsCategories).where(eq(hitsCategories.id, id)).limit(1);
        return rows[0] ?? null;
    }

    static async findByName(name: string, excludeId?: number) {
        const rows = await db.select().from(hitsCategories).where(eq(hitsCategories.name, name));
        return rows.find(r => (excludeId ? r.id !== excludeId : true)) ?? null;
    }

    static async create(name: string, color: string) {
        await db.insert(hitsCategories).values({ name, color });
    }

    static async update(id: number, name: string, color: string) {
        await db.update(hitsCategories).set({ name, color }).where(eq(hitsCategories.id, id));
    }

    static async delete(id: number) {
        // Lepas relasi dulu agar informasi tidak ikut terhapus
        await db.update(hitsInfo).set({ categoryId: null }).where(eq(hitsInfo.categoryId, id));
        await db.delete(hitsCategories).where(eq(hitsCategories.id, id));
    }
}
