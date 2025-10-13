import { useState, useRef } from 'react';
import * as z from "zod";
import { Plus, Upload, Trash2, Star, Edit, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProductQueries';
import {
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/useProductMutations';
import { ProductDataTable } from '@/components/ProductDataTable';
import { ProductForm } from '@/components/ProductForm';
import { BulkUpdateDialog } from './BulkUpdateDialog';
import type { Product } from '@/types';
import { CSVLink } from 'react-csv';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';

const productFormSchema = z.object({
  // Allow empty string, then transform to null for consistency
  product_id: z.string().optional().transform(val => val === "" ? undefined : val),
  product_name: z.string().min(3),
  category: z.string().min(2),
  // Coerce to number, allow it to be optional or null
  original_price: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0),
  sales: z.coerce.number().min(0).optional(),
  affiliate_url: z.string().url(),
  image_url: z.string().url(),
  is_featured: z.boolean().default(false),
  featured_order: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

export function ProductManagementTab() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [csvExportData, setCsvExportData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const csvLinkRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedProductIds([]); // Clear bulk selection
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setSelectedProduct(null); // Clear single selection
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkGenerateRating = () => {
    const possibleRatings = [4, 4.5, 5];
    const updatePromises = selectedProductIds.map(id => {
      const randomRating = possibleRatings[Math.floor(Math.random() * possibleRatings.length)];
      return updateProduct.mutateAsync({ id, rating: randomRating });
    });

    Promise.all(updatePromises)
      .then(() => {
        toast({ title: "Success", description: `${selectedProductIds.length} product(s) ratings generated successfully.` });
        setSelectedProductIds([]);
      })
      .catch((error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      });
  };

  const handleBulkUpdateClick = () => {
    setIsBulkUpdateDialogOpen(true);
  };

  const handleBulkUpdateSubmit = (updateData: Partial<z.infer<typeof productFormSchema>>) => {
    const updatePromises = selectedProductIds.map(id => {
      return updateProduct.mutateAsync({ id, ...updateData });
    });

    Promise.all(updatePromises)
      .then(() => {
        toast({ title: "Success", description: `${selectedProductIds.length} product(s) updated successfully.` });
        setIsBulkUpdateDialogOpen(false);
        setSelectedProductIds([]);
      })
      .catch((error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      });
  };

  const confirmDelete = () => {
    const idsToDelete = selectedProductIds.length > 0 ? selectedProductIds : (selectedProduct ? [selectedProduct.id] : []);
    if (idsToDelete.length === 0) return;

    const deletePromises = idsToDelete.map(id => deleteProduct.mutateAsync(id));

    Promise.all(deletePromises)
      .then(() => {
        toast({ title: "Success", description: `${idsToDelete.length} product(s) deleted successfully.` });
        setIsDeleteConfirmOpen(false);
        setSelectedProductIds([]);
      })
      .catch((error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      });
  };

  const handleFormSubmit = (values: z.infer<typeof productFormSchema>) => {
    const possibleRatings = [4, 4.5, 5];
    const randomRating = possibleRatings[Math.floor(Math.random() * possibleRatings.length)];

    if (selectedProduct) {
      updateProduct.mutate({ id: selectedProduct.id, ...values }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Product updated successfully." });
          setIsFormOpen(false);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Error", description: error.message });
        },
      });
    } else {
      addProduct.mutate({ ...values, rating: randomRating }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Product added successfully." });
          setIsFormOpen(false);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Error", description: error.message });
        },
      });
    }
  }; 
  
  const handleGenerateRating = (product: Product) => {
    const possibleRatings = [4, 4.5, 5];
    const randomRating = possibleRatings[Math.floor(Math.random() * possibleRatings.length)];
    updateProduct.mutate({ id: product.id, rating: randomRating }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Generated new rating for ${product.product_name}.` });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    });
  };

  const handleExport = () => {
    const headers = [
      { label: "Product ID", key: "product_id" },
      { label: "Product Name", key: "product_name" },
      { label: "Category", key: "category" },
      { label: "Original Price", key: "original_price" },
      { label: "Price", key: "price" },
      { label: "Sales", key: "sales" },
      { label: "Affiliate URL", key: "affiliate_url" },
      { label: "Image URL", key: "image_url" },
      { label: "Is Featured", key: "is_featured" },
      { label: "Featured Order", key: "featured_order" },
      { label: "Rating", key: "rating" },
    ];
    setCsvExportData(products); // products is already an array of objects
    setTimeout(() => {
      csvLinkRef.current.link.click();
    }, 100);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        let successfulImports = 0;
        let failedImports = 0;

        const importPromises = parsedData.map((item, index) => {
          // Use schema to validate and parse each row
          const validationResult = productFormSchema.safeParse(item);

          if (validationResult.success) {
            successfulImports++;
            return addProduct.mutateAsync(validationResult.data);
          } else {
            failedImports++;
            // Log detailed error for the user
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            toast({
              variant: "destructive",
              title: `Validation Error on Row ${index + 2}`,
              description: `Skipping row. Details: ${errorMessages}`,
            });
            return Promise.resolve(); // Resolve to not break Promise.all
          }
        });

        Promise.all(importPromises)
          .then(() => {
            toast({ title: "Import Complete", description: `${successfulImports} products imported successfully. ${failedImports} rows failed.` });
          })
          .catch((error) => {
            toast({ variant: "destructive", title: "Import Error", description: `An unexpected error occurred during import: ${error.message}` });
          });
      },
      error: (error) => {
        toast({ variant: "destructive", title: "Error", description: `CSV parsing failed: ${error.message}` });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Management</span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {selectedProductIds.length > 0 ? (
                <>
                  <Button variant="destructive" onClick={handleBulkDeleteClick}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedProductIds.length}) Selected
                  </Button>
                  <Button onClick={handleBulkGenerateRating}>
                    <Star className="h-4 w-4 mr-2" />
                    Generate Rating ({selectedProductIds.length}) Selected
                  </Button>
                  <Button onClick={handleBulkUpdateClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Update ({selectedProductIds.length}) Selected
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddClick}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
              )}
              <Button variant="outline" onClick={handleImport}><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <p>Loading products...</p>
          ) : (
            <ProductDataTable 
              products={filteredProducts} 
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
              onEdit={handleEditProduct} 
              onDelete={handleDeleteProduct} 
              onGenerateRating={handleGenerateRating} 
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              Fill in the details below. Click submit when you're done.
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            product={selectedProduct}
            onSubmit={handleFormSubmit} 
            isSubmitting={addProduct.isPending || updateProduct.isPending} 
          />
        </DialogContent>
      </Dialog>

      <BulkUpdateDialog 
        isOpen={isBulkUpdateDialogOpen} 
        onOpenChange={setIsBulkUpdateDialogOpen} 
        onSubmit={handleBulkUpdateSubmit} 
      />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              {selectedProductIds.length > 0 
                ? `${selectedProductIds.length} product(s)` 
                : <span className="font-bold">{selectedProduct?.product_name}</span>}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteProduct.isPending}>
              {deleteProduct.isPending ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CSVLink
        data={csvExportData}
        filename={"products-export.csv"}
        ref={csvLinkRef}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileChange}
      />
    </>
  );
}