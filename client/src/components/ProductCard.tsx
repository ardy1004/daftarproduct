import { Star, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onProductClick: (productId: string) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const rating = parseFloat(product.rating || '0');
  const discount = product.original_price 
    ? calculateDiscount(product.price, product.original_price)
    : 0;

  const handleClick = () => {
    onProductClick(product.id);
    console.log('Product affiliate URL:', product.affiliate_url);
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank');
    }
  };

  // Construct optimized image URL
  const optimizedImageUrl = product.image_url
    ? `${product.image_url}?width=400&quality=85`
    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop&crop=center';

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-lg product-card overflow-hidden group">
      {/* Product image with overlay labels */}
      <div className="relative overflow-hidden">
                <img
          src={optimizedImageUrl}
          alt={product.product_name}
          className="w-full h-48 md:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Overlay Labels */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.sales && product.sales > 500 && (
            <span className="px-2 py-1 bg-yellow text-yellow-foreground rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              TERLARIS
            </span>
          )}
          {rating > 4.5 && (
            <span className="px-2 py-1 bg-violet text-violet-foreground rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <Award className="h-3 w-3" />
              REKOMENDASI
            </span>
          )}
        </div>
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-emerald text-emerald-foreground rounded-full text-xs font-semibold shadow-lg">
              -{discount}%
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1" data-testid="text-product-id">{product.product_id}</div>
        <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
          {product.product_name}
        </h3>
        
        {/* Rating and sales */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= rating ? 'text-yellow fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground" data-testid={`text-rating-${product.id}`}>
              {rating.toFixed(1)}
            </span>
          </div>
          {product.sales && (
            <span className="text-xs text-muted-foreground" data-testid={`text-sales-${product.id}`}>
              {product.sales} terjual
            </span>
          )}
        </div>
        
        {/* Price */}
        <div className="mb-4">
          <div className="text-lg font-bold text-emerald" data-testid={`text-price-${product.id}`}>
            {formatPrice(product.price)}
          </div>
          {product.original_price && (
            <div className="text-xs text-gray-500 line-through" data-testid={`text-original-price-${product.id}`}>
              {formatPrice(product.original_price)}
            </div>
          )}
        </div>
        
        {/* Action button */}
        <Button
          onClick={handleClick}
          className="w-full py-2 px-4 bg-gradient-to-r from-emerald to-metallic text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm font-semibold"
          data-testid={`button-view-product-${product.id}`}
        >
          Lihat Produk
        </Button>
      </div>
    </div>
  );
}
