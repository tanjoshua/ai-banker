import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';

// Define the company table schema
export const companies = pgTable("companies", {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    name: text("name").notNull(),
    ticker: text("ticker").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define types based on the schema
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
