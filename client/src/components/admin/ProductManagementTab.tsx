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
  const csvLinkRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

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

  const handleBulkUpdateSubmit = (dataFromDialog: { [key: string]: any }) => {
    // Map camelCase from dialog form to snake_case for the database
    const mappedData = {
      product_name: dataFromDialog.productName,
      category: dataFromDialog.category,
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

    const updatePromises = selectedProductIds.map(id => {
      return updateProduct.mutateAsync({ id, ...updatePayload });
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