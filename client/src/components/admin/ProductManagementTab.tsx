import { useState, useRef, useEffect } from 'react';
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
  subcategory: z.string().optional().transform(val => val === "" ? null : val),
  // Coerce to number, allow it to be optional or null
  original_price: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0),
  sales: z.coerce.number().min(0).optional(),
  affiliate_url: z.string().url(),
  image_url: z.string().url(),
  is_featured: z.boolean().default(false),
  featured_order: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  stock_available: z.boolean().default(true),
});

export function ProductManagementTab() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [csvExportData, setCsvExportData] = useState<any[]>([]);
  const [searchById, setSearchById] = useState('');
  const [searchByName, setSearchByName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 products per page for better performance
  const csvLinkRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any large data structures when component unmounts
      setCsvExportData([]);
    };
  }, []);

  const { data: allProducts = [], isLoading: isLoadingProducts } = useProducts();

  // Implement pagination
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const products = allProducts.slice(startIndex, endIndex);

  // Debug logging to check total products
  console.log('Total products in database:', products.length);
  console.log('First 5 products:', products.slice(0, 5).map(p => ({ id: p.id, name: p.product_name, productId: p.product_id })));

  // Check if we have all 1131 products
  if (products.length > 0 && products.length < 1131) {
    console.log('WARNING: Only', products.length, 'products loaded, expected 1131. The fix may not be working yet.');
  } else if (products.length >= 1131) {
    console.log('SUCCESS: All', products.length, 'products loaded successfully!');
  }
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products.filter(product => {
    const idQuery = searchById.toLowerCase().trim();
    const nameQuery = searchByName.toLowerCase().trim();

    const productName = product.product_name?.toLowerCase() || '';
    const productId = product.product_id?.toLowerCase() || '';

    // Split search queries into individual terms for better matching
    const idTerms = idQuery ? idQuery.split(/\s+/).filter(term => term.length > 0) : [];
    const nameTerms = nameQuery ? nameQuery.split(/\s+/).filter(term => term.length > 0) : [];

    // Check if product matches ID search terms (all terms must be present)
    const matchesId = idTerms.length === 0 || idTerms.every(term => productId.includes(term));

    // Check if product matches name search terms (all terms must be present)
    const matchesName = nameTerms.length === 0 || nameTerms.every(term => productName.includes(term));

    return matchesId && matchesName;
  });


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

  const handleBulkGenerateRating = async () => {
    if (selectedProductIds.length === 0) return;

    const possibleRatings = [4, 4.5, 5];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < selectedProductIds.length; i += batchSize) {
      const batch = selectedProductIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (id) => {
        try {
          const randomRating = possibleRatings[Math.floor(Math.random() * possibleRatings.length)];
          await updateProduct.mutateAsync({ id, rating: randomRating });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Product ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.allSettled(batchPromises);
    }

    // Show results
    if (errorCount === 0) {
      toast({
        title: "Success",
        description: `${successCount} product(s) ratings generated successfully.`
      });
    } else if (successCount === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate ratings for ${errorCount} product(s).`
      });
    } else {
      toast({
        title: "Partial Success",
        description: `${successCount} ratings generated, ${errorCount} failed. Check console for details.`
      });
      console.error('Bulk rating generation errors:', errors);
    }

    setSelectedProductIds([]);
  };

  const handleBulkUpdateClick = () => {
    setIsBulkUpdateDialogOpen(true);
  };

  const handleBulkUpdateSubmit = async (dataFromDialog: { [key: string]: any }) => {
    if (selectedProductIds.length === 0) return;

    // Map camelCase from dialog form to snake_case for the database
    const mappedData = {
      product_name: dataFromDialog.productName,
      category: dataFromDialog.category,
      subcategory: dataFromDialog.subcategory,
      price: dataFromDialog.price,
      sales: dataFromDialog.sales,
      affiliate_url: dataFromDialog.affiliateUrl,
      image_url: dataFromDialog.imageUrl,
      is_featured: dataFromDialog.isFeatured,
    };

    // The dialog already filters out empty/null values, but this also removes any keys
    // that were undefined in the mapping (i.e., not present in the dialog form data).
    const updatePayload = Object.fromEntries(
      Object.entries(mappedData).filter(([, value]) => value !== undefined)
    );

    // If no fields were actually filled out, do nothing.
    if (Object.keys(updatePayload).length === 0) {
      toast({
        variant: "default",
        title: "No changes",
        description: "You did not enter any values to update.",
      });
      setIsBulkUpdateDialogOpen(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the server
    const batchSize = 5; // Smaller batch size for updates
    for (let i = 0; i < selectedProductIds.length; i += batchSize) {
      const batch = selectedProductIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (id) => {
        try {
          await updateProduct.mutateAsync({ id, ...updatePayload });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Product ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.allSettled(batchPromises);
    }

    // Show results
    if (errorCount === 0) {
      toast({
        title: "Success",
        description: `${successCount} product(s) updated successfully.`
      });
    } else if (successCount === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${errorCount} product(s).`
      });
    } else {
      toast({
        title: "Partial Success",
        description: `${successCount} products updated, ${errorCount} failed. Check console for details.`
      });
      console.error('Bulk update errors:', errors);
    }

    setIsBulkUpdateDialogOpen(false);
    setSelectedProductIds([]);
  };

  const confirmDelete = async () => {
    const idsToDelete = selectedProductIds.length > 0 ? selectedProductIds : (selectedProduct ? [selectedProduct.id] : []);
    if (idsToDelete.length === 0) return;

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process deletions in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);

      const batchPromises = batch.map(async (id) => {
        try {
          await deleteProduct.mutateAsync(id);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Product ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.allSettled(batchPromises);
    }

    // Show results
    if (errorCount === 0) {
      toast({
        title: "Success",
        description: `${successCount} product(s) deleted successfully.`
      });
    } else if (successCount === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete ${errorCount} product(s).`
      });
    } else {
      toast({
        title: "Partial Success",
        description: `${successCount} products deleted, ${errorCount} failed. Check console for details.`
      });
      console.error('Bulk delete errors:', errors);
    }

    setIsDeleteConfirmOpen(false);
    setSelectedProductIds([]);
  };

  const handleFormSubmit = (values: z.infer<typeof productFormSchema>) => {
    const possibleRatings = [4, 4.5, 5];
    const randomRating = possibleRatings[Math.floor(Math.random() * possibleRatings.length)];

    if (selectedProduct) {
      updateProduct.mutate({ id: selectedProduct.id, ...values }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Product updated successfully." });
          setIsFormOpen(false);
          setSelectedProduct(null); // Clear selected product after successful update
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

    // Create a copy of the data to avoid memory leaks
    const exportData = products.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      category: product.category,
      original_price: product.original_price,
      price: product.price,
      sales: product.sales,
      affiliate_url: product.affiliate_url,
      image_url: product.image_url,
      is_featured: product.is_featured,
      featured_order: product.featured_order,
      rating: product.rating,
    }));

    setCsvExportData(exportData);

    // Clear the data after a delay to prevent memory leaks
    setTimeout(() => {
      setCsvExportData([]);
      if (csvLinkRef.current?.link) {
        csvLinkRef.current.link.click();
      }
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
                  placeholder="Search by Product ID..."
                  className="pl-8 sm:w-[250px]"
                  value={searchById}
                  onChange={(e) => setSearchById(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by Product Name..."
                  className="pl-8 sm:w-[250px]"
                  value={searchByName}
                  onChange={(e) => setSearchByName(e.target.value)}
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
            <>
              <ProductDataTable
                products={filteredProducts}
                selectedProductIds={selectedProductIds}
                onSelectionChange={setSelectedProductIds}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onGenerateRating={handleGenerateRating}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, allProducts.length)} of {allProducts.length} products
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
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