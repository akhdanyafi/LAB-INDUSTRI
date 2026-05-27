import { mysqlTable, int, varchar, text, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const activityLogs = mysqlTable('activity_logs', {
    id: int('id').autoincrement().primaryKey(),
    actorId: varchar('actor_id', { length: 50 }),
    actorName: varchar('actor_name', { length: 255 }),
    actorEmail: varchar('actor_email', { length: 255 }),
    actorRole: varchar('actor_role', { length: 50 }),
    module: varchar('module', { length: 100 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: varchar('entity_id', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('success'),
    description: text('description'),
    metadata: text('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    actorIdx: index('activity_logs_actor_idx').on(table.actorId),
    moduleActionIdx: index('activity_logs_module_action_idx').on(table.module, table.action),
    entityIdx: index('activity_logs_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
}));
