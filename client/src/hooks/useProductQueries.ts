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
    queryKey: ['products', filters], // Consistent with mutation invalidation
    queryFn: async () => {
      console.log('🔄 Fetching all products for admin dashboard...');

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
        if (batchData.length > 0) {
          console.log('Sample product from batch:', batchData[0]);
        }

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

      console.log('📊 Total products fetched across all batches:', allProducts.length);

      // Transform database fields to match schema expectations
      // Map 'komisi' to 'commission' for frontend compatibility
      allProducts = allProducts.map(product => {
        return {
          ...product,
          commission: product.komisi || product.commission || 0,
          // Ensure other fields have defaults if missing
          is_featured: product.is_featured ?? false,
          stock_available: product.stock_available ?? true,
          rating: product.rating ?? 0,
          featured_order: product.featured_order ?? null,
          // Include additional fields from database
          item: (product as any).item || '',
          video_url: (product as any).video_url || '',
        };
      });

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
          Number(product.price) >= filters.priceMin!
        );
      }
      if (filters?.priceMax !== undefined) {
        processedData = processedData.filter(product =>
          Number(product.price) <= filters.priceMax!
        );
      }

      // Apply dikirim_dari filter
      if (filters?.dikirim_dari) {
        processedData = processedData.filter(product =>
          product.dikirim_dari === filters.dikirim_dari
        );
      }

      // Apply item filter
      if (filters?.item) {
        processedData = processedData.filter(product =>
          (product as any).item === filters.item
        );
      }

      // Apply sorting
      if (filters?.sortBy === 'popular') {
        processedData.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
      } else if (filters?.sortBy === 'terlaris') {
        processedData.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      } else if (filters?.sortBy === 'harga_termurah') {
        processedData.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (filters?.sortBy === 'harga_tertinggi') {
        processedData.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (filters?.sortBy === 'rekomendasi') {
        // Shuffle for rekomendasi
        for (let i = processedData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [processedData[i], processedData[j]] = [processedData[j], processedData[i]];
        }
      }
      // Default sort is already applied (created_at desc)

      console.log('✅ Final processed data:', processedData.length, 'products');
      if (processedData.length > 0) {
        console.log('Sample final product:', {
          id: processedData[0].id,
          komisi: processedData[0].commission,
          item: (processedData[0] as any).item,
          video_url: (processedData[0] as any).video_url
        });
      }
      return processedData;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
}

const PRODUCTS_PER_PAGE = 20;

export function useInfiniteProducts(filters?: FilterState) {
  return useInfiniteQuery<Product[]>({
    queryKey: ['products-infinite', filters], // Keep separate for infinite scroll
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Fetching infinite products batch:', pageParam);

      // For infinite scroll, we still use pagination but with larger batches
      // to ensure all products can be loaded eventually
      const BATCH_SIZE = 20; // Smaller batches for infinite scroll
      const from = (pageParam as number) * BATCH_SIZE;
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
      if (filters?.dikirim_dari) {
        query = query.eq('dikirim_dari', filters.dikirim_dari);
      }
      if (filters?.item) {
        query = query.eq('item', filters.item);
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
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  });
}

export function useFeaturedProducts(category?: string) {
  return useQuery<Product[]>({
    queryKey: ['featuredProducts', category],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute for latest products
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
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
    staleTime: 30 * 1000, // 30 seconds for non-featured products
    gcTime: 2 * 60 * 1000, // 2 minutes cache time
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
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes - categories don't change often
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

export function usePengirimanOptions() {
  return useQuery<string[]>({
    queryKey: ['pengirimanOptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('dikirim_dari')
        .not('dikirim_dari', 'is', null)
        .not('dikirim_dari', 'eq', '');
      if (error) throw new Error(error.message);

      // Get unique values and sort them
      const values = data?.map(item => item.dikirim_dari).filter(Boolean) || [];
      const uniqueValues = Array.from(new Set(values));
      return uniqueValues.sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useItemOptions() {
  return useQuery<string[]>({
    queryKey: ['itemOptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('item')
        .not('item', 'is', null)
        .not('item', 'eq', '');
      if (error) throw new Error(error.message);

      // Get unique values and sort them
      const values = data?.map(item => item.item).filter(Boolean) || [];
      const uniqueValues = Array.from(new Set(values));
      return uniqueValues.sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useItemOptionsByCategory(category?: string, subcategory?: string) {
  return useQuery<string[]>({
    queryKey: ['itemOptionsByCategory', category, subcategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('item')
        .not('item', 'is', null)
        .not('item', 'eq', '');

      // Filter by category if provided
      if (category) {
        query = query.eq('category', category);
      }

      // Filter by subcategory if provided
      if (subcategory) {
        query = query.eq('subcategory', subcategory);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Get unique values and sort them
      const values = data?.map(item => item.item).filter(Boolean) || [];
      const uniqueValues = Array.from(new Set(values));
      return uniqueValues.sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!(category || subcategory), // Only run if category or subcategory is provided
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
