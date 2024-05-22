import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const projectTable = sqliteTable('project', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
});

export const taskTable = sqliteTable('task', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['FINISHED', 'TODO', 'IN_PROGRESS'],
  }).notNull(),
  assignedUser: text('assigned_user'),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(
    () => new Date(),
  ),
  createdBy: text('created_by').notNull(),
  projectId: integer('project_id').references(() => projectTable.id, {
    onDelete: 'cascade',
  }),
});

export type InsertTask = typeof taskTable.$inferInsert;
export type SelectTask = typeof taskTable.$inferSelect;

export type InsertProject = typeof projectTable.$inferInsert;
export type SelectProject = typeof projectTable.$inferSelect;
