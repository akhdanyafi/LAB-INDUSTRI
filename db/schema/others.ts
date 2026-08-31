import { mysqlTable, int, varchar, text, datetime, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

// Governance Docs
export const governanceDocs = mysqlTable('governance_docs', {
    id: int('id').autoincrement().primaryKey(),
    adminId: varchar('admin_id', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    filePath: varchar('file_path', { length: 255 }).notNull(),
    coverPath: varchar('cover_path', { length: 255 }),
    type: mysqlEnum('type', ['SOP', 'LPJ Bulanan', 'Template Surat', 'Pusat Download', 'Template Berita Acara']).notNull(),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    adminIdx: index('admin_idx').on(table.adminId),
}));

// Publications (Jurnal Publikasi)
export const publications = mysqlTable('publications', {
    id: int('id').autoincrement().primaryKey(),
    uploaderId: varchar('uploader_id', { length: 50 }).references(() => users.identifier, { onDelete: 'set null' }),
    authorName: varchar('author_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    abstract: text('abstract'),
    keywords: text('keywords'), // JSON array of keywords: ["AI", "Machine Learning"]
    filePath: varchar('file_path', { length: 255 }), // Optional if link is provided
    link: varchar('link', { length: 255 }),
    viewCount: int('view_count').default(0).notNull(),
    publishYear: int('publish_year'),       // e.g. 2025
    publishMonth: int('publish_month'),     // 1-12, nullable
    publishDay: int('publish_day'),         // 1-31, nullable
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    uploaderIdx: index('uploader_idx').on(table.uploaderId),
}));

export const publicationsRelations = relations(publications, ({ one, many }) => ({
    uploader: one(users, {
        fields: [publications.uploaderId],
        references: [users.identifier],
        relationName: 'uploader',
    }),
    likes: many(publicationLikes),
}));

// Publication Likes (Many-to-Many: User <-> Publication)
export const publicationLikes = mysqlTable('publication_likes', {
    id: int('id').autoincrement().primaryKey(),
    publicationId: int('publication_id').notNull().references(() => publications.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 50 }).notNull().references(() => users.identifier, { onDelete: 'cascade' }),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    publicationIdx: index('publication_idx').on(table.publicationId),
    userIdx: index('user_idx').on(table.userId),
    // Unique constraint: one like per user per publication
    uniqueLike: index('unique_like').on(table.publicationId, table.userId),
}));

export const publicationLikesRelations = relations(publicationLikes, ({ one }) => ({
    publication: one(publications, {
        fields: [publicationLikes.publicationId],
        references: [publications.id],
    }),
    user: one(users, {
        fields: [publicationLikes.userId],
        references: [users.identifier],
    }),
}));

// Activity Photos (Foto Kegiatan Homepage)
export const heroPhotos = mysqlTable('hero_photos', {
    id: int('id').autoincrement().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    focalX: int('focal_x').default(50).notNull(), // Percentage 0-100, default center
    focalY: int('focal_y').default(50).notNull(), // Percentage 0-100, default center
    link: text('link'), // Optional link
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
