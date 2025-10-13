
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Product } from "@/types";

// Define the form schema using Zod
const formSchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().min(3, "Product name must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  original_price: z.coerce.number().min(0, "Original price must be a positive number").optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  sales: z.coerce.number().min(0, "Sales must be a positive number").optional(),
  affiliate_url: z.string().url("Must be a valid URL"),
  image_url: z.string().url("Must be a valid URL"),
  is_featured: z.boolean().optional().default(false),
  featured_order: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
});

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
}

export function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: product?.product_id || "",
      product_name: product?.product_name || "",
      category: product?.category || "",
      original_price: product?.original_price ? (typeof product.original_price === 'string' ? parseFloat(product.original_price) : product.original_price) : undefined,
      price: product?.price ? (typeof product.price === 'string' ? parseFloat(product.price) : product.price) : 0,
      sales: product?.sales || 0,
      affiliate_url: product?.affiliate_url || "",
      image_url: product?.image_url || "",
      is_featured: product?.is_featured || false,
      featured_order: product?.featured_order || 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. PROD-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Wireless Headphones" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Electronics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="original_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Leave empty if no discount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Sold</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="affiliate_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affiliate URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/product/123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Featured Product</FormLabel>
                <FormDescription>
                  Display this product in the featured carousel on the homepage.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
