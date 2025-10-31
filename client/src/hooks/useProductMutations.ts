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
        original_price: newProduct.original_price,
        price: newProduct.price,
        sales: newProduct.sales,
        affiliate_url: newProduct.affiliate_url,
        image_url: newProduct.image_url,
        is_featured: newProduct.is_featured,
        featured_order: newProduct.featured_order,
        rating: newProduct.rating,
        stock_available: newProduct.stock_available,
      }]).select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<z.infer<typeof productFormSchema>>) => {
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
          affiliate_url: updateData.affiliate_url,
          image_url: updateData.image_url,
          is_featured: updateData.is_featured,
          featured_order: updateData.featured_order,
          rating: updateData.rating,
          stock_available: updateData.stock_available,
        })
        .eq('id', id)
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}
