import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useNonFeaturedProducts } from "@/hooks/useProductQueries";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface AddFeaturedProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (product: Product) => void;
}

export function AddFeaturedProductDialog({ isOpen, onOpenChange, onAddProduct }: AddFeaturedProductDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: products = [], isLoading } = useNonFeaturedProducts();

  const filteredProducts = products.filter(product => 
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Featured Product</DialogTitle>
          <DialogDescription>
            Select a product to add to the featured carousel.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products to feature..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {isLoading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-4 py-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={product.image_url || ''} 
                      alt={product.product_name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div>
                      <h3 className="font-medium">{product.product_name}</h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>ID: {product.product_id || 'N/A'}</span>
                        <span className="font-semibold text-emerald">{formatPrice(product.price)}</span>
                      </div>
                    </div>
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
