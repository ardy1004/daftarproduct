export interface Product {
  id: string;
  product_id: string | null;
  product_name: string;
  price: string | number;
  original_price?: string | number | null;
  sales: number | null;
  category: string;
  subcategory: string | null;
  affiliate_url: string | null;
  image_url: string | null;
  rating: number | null;
  commission: string | number | null;
  dikirim_dari: string | null;
  toko: string | null;
  is_featured: boolean | null;
  featured_order: number | null;
  created_at: string | null;
  stock_available: boolean | null;
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
  priceMin: number;
  priceMax: number;
  sortBy: string;
  category?: string;
  subcategory?: string;
}

export type CategoryHierarchy = Map<string, Set<string>>;

