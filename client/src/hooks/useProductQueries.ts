import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { Product, FilterState, Categories } from '@/types';
import { supabase } from '@/lib/supabaseClient';

// Fisher-Yates shuffle algorithm for random sorting
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const PRODUCTS_PER_PAGE = 20;

export function useInfiniteProducts(filters?: FilterState) {
  return useInfiniteQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase.from('products').select('*');

      // Apply filters
      if (filters?.search) {
        query = query.ilike('product_name', `%${filters.search}%`);
      }
      if (filters?.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      if (filters?.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters?.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }

      // Apply sorting, except for 'rekomendasi' which is handled post-fetch
      if (filters?.sortBy === 'popular') {
        query = query.order('clicks', { ascending: false });
      } else if (filters?.sortBy === 'terlaris') {
        query = query.order('sales', { ascending: false });
      } else if (filters?.sortBy === 'harga_termurah') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'harga_tertinggi') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy !== 'rekomendasi') {
        // Default sort if none of the above match
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = pageParam * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Handle client-side random sort for 'rekomendasi'
      // Note: This will only shuffle the current page, not the whole dataset.
      if (filters?.sortBy === 'rekomendasi') {
        return shuffleArray(data || []);
      }

      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page had fewer products than we requested,
      // it means we've reached the end.
      if (lastPage.length < PRODUCTS_PER_PAGE) {
        return undefined;
      }
      return allPages.length;
    },
  });
}

export function useFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['featuredProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
}

export function useLatestProducts(limit: number = 4) {
  return useQuery<Product[]>({
    queryKey: ['latestProducts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
}

export function useCategories() {
  return useQuery<Categories>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .distinct('category');
      if (error) throw new Error(error.message);
      return data?.map(item => item.category) || [];
    }
  });
}

export function useNonFeaturedProducts() {
  return useQuery<Product[]>({
    queryKey: ['nonFeaturedProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('is_featured', 'is', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
}

export function useTrackProductClick() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productUuid: string) => {
      const [analyticsResult, incrementResult] = await Promise.all([
        supabase.from('product_analytics').insert({
          product_id: productUuid,
          event_type: 'click'
        }),
        supabase.rpc('increment_product_click', { product_id_to_inc: productUuid })
      ]);

      if (analyticsResult.error) {
        console.error("Error inserting into product_analytics:", analyticsResult.error);
        throw new Error(`Analytics insert failed: ${analyticsResult.error.message}`);
      }
      if (incrementResult.error) {
        console.error("Error from increment_product_click RPC:", incrementResult.error);
        throw new Error(`Increment RPC failed: ${incrementResult.error.message}`);
      }

      return { analytics: analyticsResult.data, increment: incrementResult.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}
