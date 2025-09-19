import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertProductAnalyticsSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { search, categories, priceMin, priceMax, sortBy } = req.query;
      
      const filters: any = {};
      if (categories && typeof categories === 'string') {
        filters.categories = categories.split(',');
      }
      if (priceMin) filters.priceMin = Number(priceMin);
      if (priceMax) filters.priceMax = Number(priceMax);
      if (sortBy) filters.sortBy = sortBy as string;
      
      const products = await storage.searchProducts(
        (search as string) || '',
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/latest", async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 4;
      const products = await storage.getLatestProducts(limit);
      res.json(products);
    } catch (error) {
      console.error('Error fetching latest products:', error);
      res.status(500).json({ message: "Failed to fetch latest products" });
    }
  });

  app.get("/api/products/popular", async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 8;
      const products = await storage.getPopularProducts(limit);
      res.json(products);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      res.status(500).json({ message: "Failed to fetch popular products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const partialSchema = insertProductSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Analytics API
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { productId, eventType } = req.body;
      if (!productId || !eventType) {
        return res.status(400).json({ message: "Product ID and event type are required" });
      }
      
      const analytics = await storage.trackProductEvent(productId, eventType);
      res.status(201).json(analytics);
    } catch (error) {
      console.error('Error tracking event:', error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      const { productId, days } = req.query;
      const analytics = await storage.getProductAnalytics(
        productId as string,
        days ? Number(days) : 7
      );
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Settings API
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || { showCategoryFilter: true });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const partialSchema = insertSettingsSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      console.error('Error updating settings:', error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Categories API (dynamic from products)
  app.get("/api/categories", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
      const subcategories = [...new Set(products.map(p => p.subcategory))].filter(Boolean);
      
      res.json({ categories, subcategories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
