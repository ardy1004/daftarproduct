import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useProductQueries";

const bulkUpdateSchema = z.object({
  productName: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  price: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
  sales: z.coerce.number().optional(),
  commission: z.coerce.number().optional(),
  dikirim_dari: z.string().optional(),
  toko: z.string().optional(),
  item: z.string().optional(),
  affiliateUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
});

interface BulkUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: Partial<z.infer<typeof bulkUpdateSchema>>) => void;
}

export function BulkUpdateDialog({ isOpen, onOpenChange, onSubmit }: BulkUpdateDialogProps) {
  const { data: categories } = useCategories();
  const [isComboboxOpen, setIsComboboxOpen] = React.useState(false);
  const form = useForm<z.infer<typeof bulkUpdateSchema>>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      productName: undefined,
      category: undefined,
      subcategory: undefined,
      price: undefined,
      originalPrice: undefined,
      sales: undefined,
      commission: undefined,
      dikirim_dari: undefined,
      toko: undefined,
      item: undefined,
      affiliateUrl: undefined,
      imageUrl: undefined,
      videoUrl: undefined,
      isFeatured: undefined,
    },
  });

  const watchedCategory = form.watch("category");
  const subcategories = watchedCategory && categories?.get(watchedCategory) ? Array.from(categories.get(watchedCategory)!) : [];

  React.useEffect(() => {
    form.resetField("subcategory");
  }, [watchedCategory, form]);

  const handleSubmit = (values: z.infer<typeof bulkUpdateSchema>) => {
    console.log('[DEBUG] Bulk update form values:', values);
    console.log('[DEBUG] Item field value:', values.item);
    console.log('[DEBUG] VideoUrl field value:', values.videoUrl);

    // For bulk update, we want to send all fields that exist in the form,
    // including empty strings (which mean "set to empty"), but exclude undefined fields
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== null && value !== undefined)
    );

    console.log('[DEBUG] Filtered values to send:', filteredValues);
    console.log('[DEBUG] Item in filtered:', filteredValues.item);
    console.log('[DEBUG] VideoUrl in filtered:', filteredValues.videoUrl);
    onSubmit(filteredValues);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Update Products</DialogTitle>
          <DialogDescription>
            Select fields to update and provide new values for selected products.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1: Product Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="New Product Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(categories?.keys() || []).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Subcategory & Item */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subcategory</FormLabel>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isComboboxOpen}
                            disabled={!watchedCategory}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Select or type a subcategory..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[200px] overflow-y-auto p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search or type new subcategory..."
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          />
                          <CommandEmpty>No subcategory found. Type to create.</CommandEmpty>
                          <CommandGroup className="max-h-[150px] overflow-y-auto">
                            {subcategories.map((subcategory) => (
                              <CommandItem
                                value={subcategory}
                                key={subcategory}
                                onSelect={() => {
                                  form.setValue("subcategory", subcategory);
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    subcategory === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {subcategory}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <FormControl>
                      <Input placeholder="New Item Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Original Price & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="New Original Price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="New Price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Sales & Commission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="New Sales Count" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="New Commission Percentage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Dikirim Dari & Toko */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dikirim_dari"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dikirim Dari</FormLabel>
                    <FormControl>
                      <Input placeholder="New Shipping Origin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toko"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toko</FormLabel>
                    <FormControl>
                      <Input placeholder="New Store Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 6: Affiliate URL & Image URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="affiliateUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliate URL</FormLabel>
                    <FormControl>
                      <Input placeholder="New Affiliate URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="New Image URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 7: Video URL - full width */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="New Video URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Featured checkbox - full width */}
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as Featured</FormLabel>
                    <FormDescription>
                      Check to set selected products as featured, uncheck to remove.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Apply Bulk Update
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
