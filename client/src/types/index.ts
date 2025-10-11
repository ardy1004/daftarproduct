export interface Product {
  id: string;
  product_id: string | null;
  product_name: string;
  price: string;
  original_price?: string | null;
  sales: number | null;
  category: string;
  subcategory: string | null;
  affiliate_url: string | null;
  image_url: string | null;
  rating: number | null;
  is_featured: boolean | null;
  featured_order: number | null;
  created_at: string | null;
}

export interface ProductAnalytics {
  id: string;
  productId: string;
  eventType: string;
  createdAt: string | null;
}

export interface Settings {
  id: string;
  showCategoryFilter: boolean | null;
  updatedAt: string | null;
  facebook_pixel_id?: string | null;
  google_analytics_id?: string | null;
}

export interface FilterState {
  search: string;
  categories: string[];
  priceMin: number;
  priceMax: number;
  sortBy: string;
}

export interface Categories {
  categories: string[];
  subcategories: string[];
}
