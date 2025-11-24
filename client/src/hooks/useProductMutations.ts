import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import * as z from "zod";

// Schema for form validation, can be shared or defined here
export const productFormSchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().min(3),
  category: z.string().min(2),
  subcategory: z.string().optional(),
  original_price: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0),
  sales: z.coerce.number().min(0).optional(),
  commission: z.coerce.number().min(0).optional(),
  dikirim_dari: z.string().optional(),
  toko: z.string().optional(),
  item: z.string().optional(),
  video_url: z.string().optional(),
  affiliate_url: z.string().url(),
  image_url: z.string().url(),
  is_featured: z.boolean().default(false),
  featured_order: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  stock_available: z.boolean().default(true),
});

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct: z.infer<typeof productFormSchema>) => {
      const { data, error } = await supabase.from('products').insert([{
        product_id: newProduct.product_id,
        product_name: newProduct.product_name,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        original_price: newProduct.original_price,
        price: newProduct.price,
        sales: newProduct.sales,
        item: newProduct.item || '', // Include item field
        commission: newProduct.commission, // Use 'commission' for database compatibility
        dikirim_dari: newProduct.dikirim_dari,
        toko: newProduct.toko,
        affiliate_url: newProduct.affiliate_url,
        image_url: newProduct.image_url,
        video_url: newProduct.video_url || '', // Include video_url field
        rating: newProduct.rating, // Include rating field
        is_featured: newProduct.is_featured, // Include is_featured field
        featured_order: newProduct.featured_order, // Include featured_order field
        // Note: stock_available not in current database
      }]);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating product queries after insert...');
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['nonFeaturedProducts'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<z.infer<typeof productFormSchema>>) => {
      console.log('[DEBUG] useUpdateProduct received data:', updateData);
      console.log('[DEBUG] Item in updateData:', updateData.item);
      console.log('[DEBUG] Video URL in updateData:', updateData.video_url);

      const { data, error } = await supabase
        .from('products')
        .update({
          product_id: updateData.product_id,
          product_name: updateData.product_name,
          category: updateData.category,
          subcategory: updateData.subcategory,
          original_price: updateData.original_price,
          price: updateData.price,
          sales: updateData.sales,
          item: updateData.item !== undefined ? updateData.item : undefined, // Only update if provided
          commission: updateData.commission, // Use 'commission' for database compatibility
          dikirim_dari: updateData.dikirim_dari,
          toko: updateData.toko,
          affiliate_url: updateData.affiliate_url,
          image_url: updateData.image_url,
          video_url: updateData.video_url !== undefined ? updateData.video_url : undefined, // Only update if provided
          rating: updateData.rating, // Include rating field
          is_featured: updateData.is_featured, // Include is_featured field
          featured_order: updateData.featured_order, // Include featured_order field
          // Note: stock_available not in current database
        })
        .eq('id', id);

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['nonFeaturedProducts'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}
