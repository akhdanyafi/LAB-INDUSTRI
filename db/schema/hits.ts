import { mysqlTable, int, varchar, text, datetime, boolean, index } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// Kategori / Jenis Informasi Hits (bisa ditambah & diatur warnanya oleh admin)
export const hitsCategories = mysqlTable('hits_categories', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 20 }).default('#2563EB').notNull(), // hex badge color
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Informasi Hits (kegiatan program studi / mahasiswa berprestasi)
export const hitsInfo = mysqlTable('hits_info', {
    id: int('id').autoincrement().primaryKey(),
    categoryId: int('category_id').references(() => hitsCategories.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    focalX: int('focal_x').default(50).notNull(), // Percentage 0-100 (crop 16:9)
    focalY: int('focal_y').default(50).notNull(),
    link: text('link'),
    isPublished: boolean('is_published').default(true).notNull(),
    displayOrder: int('display_order').default(0).notNull(),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    categoryIdx: index('hits_category_idx').on(table.categoryId),
}));

export const hitsCategoriesRelations = relations(hitsCategories, ({ many }) => ({
    infos: many(hitsInfo),
}));

export const hitsInfoRelations = relations(hitsInfo, ({ one }) => ({
    category: one(hitsCategories, {
        fields: [hitsInfo.categoryId],
        references: [hitsCategories.id],
    }),
}));
