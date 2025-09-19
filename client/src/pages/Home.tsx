import { useState } from 'react';
import { Sparkles, ArrowRight, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { useProducts, useLatestProducts, useTrackProductClick } from '@/hooks/useProducts';
import type { FilterState } from '@/types';
import { Link } from 'wouter';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priceMin: 0,
    priceMax: 20000000,
    sortBy: 'popular'
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useProducts(filters);
  const { data: latestProducts = [] } = useLatestProducts(4);
  const trackClick = useTrackProductClick();

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleProductClick = (productId: string) => {
    trackClick.mutate(productId);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        onMenuToggle={toggleFilters}
      />

      {/* Featured Carousel */}
      <FeaturedCarousel onProductClick={handleProductClick} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* New Products Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Sparkles className="h-6 w-6 text-emerald mr-2" />
              Produk Terbaru
            </h2>
            <Button
              variant="ghost"
              className="text-emerald hover:text-emerald/80 font-semibold flex items-center"
              onClick={() => {
                document.getElementById('all-products')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              data-testid="button-view-all-products"
            >
              Lihat Semua 
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {latestProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="grid-latest-products">
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full mb-4 mx-auto flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No latest products available</p>
            </div>
          )}
        </section>

        {/* Filters and Products Grid */}
        <section id="all-products">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Semua Produk</h2>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                showFilters={showFilters}
                onToggleFilters={toggleFilters}
              />
            </div>
            
            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Loading state */}
              {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8" data-testid="loading-products">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-4 loading-pulse">
                      <div className="bg-muted h-48 rounded-lg mb-4"></div>
                      <div className="bg-muted h-4 rounded mb-2"></div>
                      <div className="bg-muted h-4 rounded w-2/3 mb-4"></div>
                      <div className="bg-muted h-8 rounded"></div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Products results */}
              {!isLoading && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-muted-foreground" data-testid="text-products-count">
                      Menampilkan {products.length} produk
                    </span>
                  </div>
                  
                  {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="grid-all-products">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onProductClick={handleProductClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16" data-testid="no-products-found">
                      <Search className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2">Produk tidak ditemukan</h3>
                      <p className="text-muted-foreground mb-4">Coba gunakan kata kunci lain atau ubah filter pencarian</p>
                      <Button
                        onClick={() => handleFiltersChange({
                          search: '',
                          categories: [],
                          priceMin: 0,
                          priceMax: 20000000,
                          sortBy: 'popular'
                        })}
                        className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                        data-testid="button-reset-search"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald to-metallic rounded-lg flex items-center justify-center">
                  <i className="fas fa-store text-white text-sm"></i>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald to-metallic bg-clip-text text-transparent">
                  MarketPlace Pro
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Platform e-commerce modern dengan teknologi terdepan untuk pengalaman berbelanja terbaik.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-emerald text-white rounded-lg flex items-center justify-center hover:bg-emerald/80 transition-colors">
                  <i className="fab fa-facebook-f text-sm"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-metallic text-white rounded-lg flex items-center justify-center hover:bg-metallic/80 transition-colors">
                  <i className="fab fa-twitter text-sm"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-violet text-white rounded-lg flex items-center justify-center hover:bg-violet/80 transition-colors">
                  <i className="fab fa-instagram text-sm"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Kategori</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-emerald transition-colors">Electronics</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Fashion</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Home & Living</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Sports</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-emerald transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Cara Berbelanja</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-emerald transition-colors">Syarat & Ketentuan</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center"><i className="fas fa-envelope text-emerald mr-2"></i> support@marketplace.com</p>
                <p className="flex items-center"><i className="fas fa-phone text-emerald mr-2"></i> +62 21 1234 5678</p>
                <p className="flex items-center"><i className="fas fa-map-marker-alt text-emerald mr-2"></i> Jakarta, Indonesia</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-muted-foreground text-sm">
              © 2024 MarketPlace Pro. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-emerald font-semibold">Supabase</span>
                <span className="text-xs text-metallic font-semibold">Next.js</span>
                <span className="text-xs text-violet font-semibold">Tailwind</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
