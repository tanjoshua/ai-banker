import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';

// Define the company table schema
export const companies = pgTable("companies", {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    name: text("name").notNull(),
    ticker: text("ticker").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define the files table schema
export const files = pgTable('files', {
    id: uuid('id').defaultRandom().primaryKey(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    url: text('url').notNull(),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define types based on the schema
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
