import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, FilterState, Categories } from '@/types';
import { apiRequest } from '@/lib/queryClient';

export function useProducts(filters?: FilterState) {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.categories && filters.categories.length > 0) {
    params.append('categories', filters.categories.join(','));
  }
  if (filters?.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
  if (filters?.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);

  return useQuery<Product[]>({
    queryKey: ['/api/products', params.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });
}

export function useFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });
}

export function useLatestProducts(limit: number = 4) {
  return useQuery<Product[]>({
    queryKey: ['/api/products/latest', limit],
    queryFn: async () => {
      const response = await fetch(`/api/products/latest?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch latest products');
      return response.json();
    }
  });
}

export function useCategories() {
  return useQuery<Categories>({
    queryKey: ['/api/categories'],
  });
}

export function useTrackProductClick() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('POST', '/api/analytics/track', {
        productId,
        eventType: 'click'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    }
  });
}
