import { useState } from 'react';
import { Star } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeaturedProducts } from '@/hooks/useProductQueries';
import { useUpdateProduct } from '@/hooks/useProductMutations';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddFeaturedProductDialog } from './AddFeaturedProductDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableProductItem } from './SortableProductItem';

export function FeaturedManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: featuredProducts = [], isLoading } = useFeaturedProducts();
  const updateProduct = useUpdateProduct();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleRemoveFeatured = (product: Product) => {
    updateProduct.mutate({ id: product.id, is_featured: false }, {
      onSuccess: () => {
        toast({ description: `"${product.product_name}" has been removed from featured.` });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    });
  };

  const handleAddFeatured = (product: Product) => {
    // When adding, give it the highest order number
    const maxOrder = Math.max(...featuredProducts.map(p => p.featured_order || 0), 0);
    updateProduct.mutate({ id: product.id, is_featured: true, featured_order: maxOrder + 1 }, {
      onSuccess: () => {
        toast({ description: `"${product.product_name}" has been added to featured.` });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    });
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = featuredProducts.findIndex(p => p.id === active.id);
      const newIndex = featuredProducts.findIndex(p => p.id === over.id);
      
      const reorderedProducts = arrayMove(featuredProducts, oldIndex, newIndex);

      // Update the featured_order for each product
      const updatePromises = reorderedProducts.map((product, index) => {
        // Only call mutate if the order actually changed
        if (product.featured_order !== index) {
          return updateProduct.mutateAsync({ id: product.id, featured_order: index });
        }
        return Promise.resolve();
      });

      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
      });

      toast({ title: "Success", description: "Product order updated." });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Featured Products Management</span>
            <Button onClick={() => setIsAddDialogOpen(true)}>Add Featured Product</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : featuredProducts.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={featuredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {featuredProducts.map((product) => (
                    <SortableProductItem key={product.id} product={product} onRemove={handleRemoveFeatured} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8">
              <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No featured products</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AddFeaturedProductDialog 
        isOpen={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onAddProduct={handleAddFeatured} 
      />
    </>
  );
}
