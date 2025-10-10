import { useState } from 'react';
import { Share2, Copy, Check, Star, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onProductClick: (productId: string) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const rating = parseFloat(product.rating?.toString() || '0');

  const handleCopyLink = () => {
    if (product.affiliate_url) {
      navigator.clipboard.writeText(product.affiliate_url);
      toast({
        title: 'Tautan disalin!',
        description: 'Tautan produk telah disalin ke clipboard.',
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    }
  };

  const shareUrl = product.affiliate_url ? encodeURIComponent(product.affiliate_url) : '';
  const shareText = encodeURIComponent(`Cek produk keren ini: ${product.product_name}`);

  const handleProductRedirect = () => {
    onProductClick(product.id);
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group flex flex-col product-card">
      <div className="relative overflow-hidden">
        <img
          src={product.image_url || 'https://via.placeholder.com/300'}
          alt={product.product_name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300';
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.sales && product.sales > 500 && (
            <span className="px-2 py-0.5 bg-yellow text-yellow-foreground rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              TERLARIS
            </span>
          )}
          {rating > 4.5 && (
            <span className="px-2 py-0.5 bg-violet text-violet-foreground rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <Award className="h-3 w-3" />
              REKOMENDASI
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()} // Prevent card click
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleCopyLink}>
                {isCopied ? (
                  <Check className="mr-2 h-4 w-4 text-emerald" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                <span>Salin Tautan</span>
              </DropdownMenuItem>
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%0A${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <DropdownMenuItem>
                  <i className="fab fa-whatsapp mr-2 h-4 w-4"></i>
                  <span>WhatsApp</span>
                </DropdownMenuItem>
              </a>
              <a
                href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <DropdownMenuItem>
                  <i className="fab fa-telegram-plane mr-2 h-4 w-4"></i>
                  <span>Telegram</span>
                </DropdownMenuItem>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <DropdownMenuItem>
                  <i className="fab fa-facebook-f mr-2 h-4 w-4"></i>
                  <span>Facebook</span>
                </DropdownMenuItem>
              </a>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-base leading-snug truncate mb-2" title={product.product_name}>
          {product.product_name}
        </h3>

        {rating > 0 && (
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
          </div>
        )}

        <div className="flex-grow"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
          <div>
            <p className="text-lg font-bold text-emerald">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(parseFloat(product.price))}
            </p>
          </div>
          {product.sales && (
            <span className="text-xs text-muted-foreground mt-1 sm:mt-0">{product.sales} terjual</span>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button
          onClick={handleProductRedirect}
          className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90 transition-all duration-200 transform group-hover:scale-105"
        >
          Lihat Produk
        </Button>
      </div>
    </div>
  );
}