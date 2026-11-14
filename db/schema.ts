import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const wishlistItems = pgTable("products", {
  id: serial('id').primaryKey(),
  name: varchar().notNull(),
  store: varchar().notNull(),
  price: integer().notNull(),
  image_url: varchar(),
  product_url: varchar().notNull(),
  preference: varchar(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
