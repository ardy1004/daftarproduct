export interface Product {
  id: string;
  productId: string | null;
  productName: string;
  price: string;
  originalPrice?: string | null;
  sales: number | null;
  category: string;
  subcategory: string | null;
  affiliateUrl: string | null;
  imageUrl: string | null;
  rating: string | null;
  isFeatured: boolean | null;
  featuredOrder: number | null;
  createdAt: string | null;
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
