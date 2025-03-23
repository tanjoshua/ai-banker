import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  url: text('url').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 