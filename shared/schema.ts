import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: text("product_id"),
  productName: text("product_name").notNull(),
  price: numeric("price").notNull(),
  originalPrice: numeric("original_price"),
  sales: integer("sales").default(0),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  affiliateUrl: text("affiliate_url"),
  imageUrl: text("image_url"),
  rating: numeric("rating").default("0"),
  isFeatured: boolean("is_featured").default(false),
  featuredOrder: integer("featured_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productAnalytics = pgTable("product_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: text("product_id").notNull(),
  eventType: text("event_type").notNull(), // 'click', 'view', 'purchase'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  showCategoryFilter: boolean("show_category_filter").default(true),
  facebookPixelId: text("facebook_pixel_id"),
  google_analytics_id: text("google_analytics_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductAnalyticsSchema = createInsertSchema(productAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductAnalytics = typeof productAnalytics.$inferSelect;
export type InsertProductAnalytics = z.infer<typeof insertProductAnalyticsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
