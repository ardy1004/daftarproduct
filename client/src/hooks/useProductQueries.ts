import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { Product, FilterState, CategoryHierarchy } from '@/types';
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

export function useProducts(filters?: FilterState) {
  return useQuery<Product[]>({
    queryKey: ['products-admin', filters], // Changed query key to avoid cache conflicts
    queryFn: async () => {
      console.log('Fetching all products for admin dashboard...');

      // Supabase has a default limit of 1000 rows. We need to fetch in batches.
      const BATCH_SIZE = 1000;
      let allProducts: Product[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching batch with offset ${offset}...`);

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) {
          console.error('Error fetching products batch:', error);
          throw new Error(error.message);
        }

        const batchData = data || [];
        console.log(`Batch ${Math.floor(offset / BATCH_SIZE) + 1}: fetched ${batchData.length} products`);

        allProducts = [...allProducts, ...batchData];

        // If we got less than BATCH_SIZE, we've reached the end
        if (batchData.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }

        // Safety check to prevent infinite loops
        if (offset > 10000) { // Max 10k products
          console.warn('Reached maximum offset limit, stopping fetch');
          hasMore = false;
        }
      }

      console.log('Total products fetched across all batches:', allProducts.length);

      // Apply client-side filtering and sorting
      let processedData = allProducts;

      // Apply search filter
      if (filters?.search) {
        const searchTerms = filters.search.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length > 0) {
          processedData = processedData.filter(product => {
            const productName = product.product_name?.toLowerCase() || '';
            return searchTerms.every(term => productName.includes(term));
          });
        }
      }

      // Apply category filter
      if (filters?.categories && filters.categories.length > 0) {
        processedData = processedData.filter(product =>
          filters.categories!.includes(product.category)
        );
      }

      // Apply price filters
      if (filters?.priceMin !== undefined) {
        processedData = processedData.filter(product =>
          parseFloat(product.price) >= filters.priceMin!
        );
      }
      if (filters?.priceMax !== undefined) {
        processedData = processedData.filter(product =>
          parseFloat(product.price) <= filters.priceMax!
        );
      }

      // Apply sorting
      if (filters?.sortBy === 'popular') {
        processedData.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
      } else if (filters?.sortBy === 'terlaris') {
        processedData.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      } else if (filters?.sortBy === 'harga_termurah') {
        processedData.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      } else if (filters?.sortBy === 'harga_tertinggi') {
        processedData.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      } else if (filters?.sortBy === 'rekomendasi') {
        // Shuffle for rekomendasi
        for (let i = processedData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [processedData[i], processedData[j]] = [processedData[j], processedData[i]];
        }
      }
      // Default sort is already applied (created_at desc)

      console.log('Final processed data:', processedData.length, 'products');
      return processedData;
    },
    staleTime: 0, // Don't cache this query
    gcTime: 0, // Don't cache this query (React Query v5)
  });
}

const PRODUCTS_PER_PAGE = 20;

export function useInfiniteProducts(filters?: FilterState) {
  return useInfiniteQuery<Product[]>({
    queryKey: ['products-infinite', filters], // Changed key to avoid conflicts
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching infinite products batch:', pageParam);

      // For infinite scroll, we still use pagination but with larger batches
      // to ensure all products can be loaded eventually
      const BATCH_SIZE = 20; // Smaller batches for infinite scroll
      const from = pageParam * BATCH_SIZE;
      const to = from + BATCH_SIZE - 1;

      let query = supabase.from('products').select('*');

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      
      if (filters?.search) {
        const searchTerms = filters.search.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length > 0) {
          if (searchTerms.length === 1) {
            query = query.ilike('product_name', `%${searchTerms[0]}%`);
          } else {
            searchTerms.forEach(term => {
              query = query.ilike('product_name', `%${term}%`);
            });
          }
        }
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

      // Apply sorting
      if (filters?.sortBy === 'popular') {
        query = query.order('clicks', { ascending: false });
      } else if (filters?.sortBy === 'terlaris') {
        query = query.order('sales', { ascending: false });
      } else if (filters?.sortBy === 'harga_termurah') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'harga_tertinggi') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'rekomendasi') {
        // For rekomendasi, we'll shuffle client-side after fetching
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let resultData = data || [];

      // Handle rekomendasi shuffling
      if (filters?.sortBy === 'rekomendasi') {
        resultData = shuffleArray(resultData);
      }

      console.log(`Infinite batch ${pageParam}: fetched ${resultData.length} products (range ${from}-${to})`);
      return resultData;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page had fewer products than we requested, we've reached the end
      if (lastPage.length < 20) {
        return undefined;
      }
      return allPages.length;
    },
    staleTime: 0, // Don't cache this query
    gcTime: 0, // Don't cache this query (React Query v5)
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
    },
    staleTime: 0, // Don't cache this query
    gcTime: 0, // Don't cache this query (React Query v5)
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
    },
    staleTime: 0, // Don't cache this query
    gcTime: 0, // Don't cache this query (React Query v5)
  });
}

export function useCategories() {
  return useQuery<CategoryHierarchy>({
    queryKey: ['categoryHierarchy'], // Changed queryKey for clarity
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category, subcategory');
      if (error) throw new Error(error.message);

      const hierarchy = new Map<string, Set<string>>();

      (data || []).forEach(item => {
        if (item.category) {
          if (!hierarchy.has(item.category)) {
            hierarchy.set(item.category, new Set<string>());
          }
          if (item.subcategory) {
            hierarchy.get(item.category)!.add(item.subcategory);
          }
        }
      });

      return hierarchy;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
    },
    staleTime: 0, // Don't cache this query
    gcTime: 0, // Don't cache this query (React Query v5)
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
