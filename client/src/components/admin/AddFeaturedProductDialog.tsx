import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useNonFeaturedProducts } from "@/hooks/useProductQueries";
import type { Product } from "@/types";

interface AddFeaturedProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (product: Product) => void;
}

export function AddFeaturedProductDialog({ isOpen, onOpenChange, onAddProduct }: AddFeaturedProductDialogProps) {
  const { data: products = [], isLoading } = useNonFeaturedProducts();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Featured Product</DialogTitle>
          <DialogDescription>
            Select a product to add to the featured carousel.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            <div className="space-y-4 py-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={product.image_url || ''} 
                      alt={product.productName}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <h3 className="font-medium">{product.productName}</h3>
                  </div>
                  <Button size="sm" onClick={() => onAddProduct(product)}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No products available to feature.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
