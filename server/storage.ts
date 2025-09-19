import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, asc, and, gte, lte, inArray, count } from "drizzle-orm";
import { products, productAnalytics, settings, users, type Product, type InsertProduct, type ProductAnalytics, type InsertProductAnalytics, type Settings, type InsertSettings, type User, type InsertUser } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getLatestProducts(limit: number): Promise<Product[]>;
  searchProducts(query: string, filters?: {
    categories?: string[];
    priceMin?: number;
    priceMax?: number;
    sortBy?: string;
  }): Promise<Product[]>;
  
  // Analytics
  trackProductEvent(productId: string, eventType: string): Promise<ProductAnalytics>;
  getProductAnalytics(productId?: string, days?: number): Promise<ProductAnalytics[]>;
  getPopularProducts(limit: number): Promise<Product[]>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DrizzleStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.isFeatured, true))
      .orderBy(asc(products.featuredOrder), desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.category, category))
      .orderBy(desc(products.sales));
  }

  async getLatestProducts(limit: number): Promise<Product[]> {
    return await db.select().from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async searchProducts(query: string, filters?: {
    categories?: string[];
    priceMin?: number;
    priceMax?: number;
    sortBy?: string;
  }): Promise<Product[]> {
    let dbQuery = db.select().from(products);
    
    const conditions = [];
    
    if (query) {
      conditions.push(sql`LOWER(${products.productName}) LIKE LOWER(${'%' + query + '%'})`);
    }
    
    if (filters?.categories && filters.categories.length > 0) {
      conditions.push(inArray(products.category, filters.categories));
    }
    
    if (filters?.priceMin !== undefined) {
      conditions.push(gte(products.price, filters.priceMin.toString()));
    }
    
    if (filters?.priceMax !== undefined) {
      conditions.push(lte(products.price, filters.priceMax.toString()));
    }
    
    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }
    
    // Apply sorting
    switch (filters?.sortBy) {
      case 'popular':
      case 'bestseller':
        dbQuery = dbQuery.orderBy(desc(products.sales));
        break;
      case 'price_low':
        dbQuery = dbQuery.orderBy(asc(products.price));
        break;
      case 'price_high':
        dbQuery = dbQuery.orderBy(desc(products.price));
        break;
      case 'recommended':
        dbQuery = dbQuery.orderBy(desc(sql`CASE WHEN ${products.rating} > 4.5 THEN 1 ELSE 0 END`), desc(products.rating));
        break;
      default:
        dbQuery = dbQuery.orderBy(desc(products.sales));
    }
    
    return await dbQuery;
  }

  async trackProductEvent(productId: string, eventType: string): Promise<ProductAnalytics> {
    const result = await db.insert(productAnalytics).values({
      productId,
      eventType
    }).returning();
    return result[0];
  }

  async getProductAnalytics(productId?: string, days: number = 7): Promise<ProductAnalytics[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    let query = db.select().from(productAnalytics)
      .where(gte(productAnalytics.createdAt, since))
      .orderBy(desc(productAnalytics.createdAt));
    
    if (productId) {
      query = db.select().from(productAnalytics)
        .where(and(
          eq(productAnalytics.productId, productId),
          gte(productAnalytics.createdAt, since)
        ))
        .orderBy(desc(productAnalytics.createdAt));
    }
    
    return await query;
  }

  async getPopularProducts(limit: number): Promise<Product[]> {
    return await db.select().from(products)
      .orderBy(desc(products.sales), desc(products.rating))
      .limit(limit);
  }

  async getSettings(): Promise<Settings | undefined> {
    const result = await db.select().from(settings).limit(1);
    return result[0];
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const result = await db.update(settings).set({
        ...settingsData,
        updatedAt: new Date()
      }).where(eq(settings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({
        ...settingsData,
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();
