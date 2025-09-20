import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

interface SortableProductItemProps {
  product: Product;
  onRemove: (product: Product) => void;
}

export function SortableProductItem({ product, onRemove }: SortableProductItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center space-x-4">
        <button {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <img 
          src={product.image_url || ''} 
          alt={product.productName}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <h3 className="font-medium">{product.productName}</h3>
          <p className="text-sm text-muted-foreground">Current Order: {product.featured_order || 0}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onRemove(product)}
        className="text-destructive hover:text-destructive"
      >
        Remove
      </Button>
    </div>
  );
}
