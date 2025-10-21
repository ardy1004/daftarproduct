import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/utils';
import { useCategoryContext } from "@/context/CategoryContext";
import { useInfiniteProducts, useTrackProductClick } from "@/hooks/useProductQueries";
import type { FilterState, Product } from '@/types';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priceMin: 0,
    priceMax: 20000000,
    sortBy: 'popular'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { category: categorySlug, subcategory: subcategorySlug } = useParams<{ category: string; subcategory?: string }>();
  const { categoryData, isLoading: isCategoryLoading, categorySlugMap, subcategorySlugMap } = useCategoryContext();

  useEffect(() => {
    // Find the original names from the slug maps
    const categoryName = categorySlug ? categorySlugMap.get(categorySlug) : undefined;
    const subcategoryName = subcategorySlug ? subcategorySlugMap.get(subcategorySlug) : undefined;

    // Update filters based on the resolved original names
    setFilters(prevFilters => ({
      ...prevFilters,
      category: categoryName,
      subcategory: subcategoryName,
      // Reset sidebar category selection when a URL-based filter is active
      categories: (categoryName || subcategoryName) ? [] : prevFilters.categories,
    }));
    
  }, [categorySlug, subcategorySlug, categorySlugMap, subcategorySlugMap]);

  // Use the centralized data hooks
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isProductsLoading 
  } = useInfiniteProducts(filters);
  const trackProductClick = useTrackProductClick();

  const allProducts = data?.pages.flatMap(page => page) ?? [];

  // Debug logging to check if specific product exists
  const specificProduct = allProducts.find(p => p.product_id === 'ACX.G-018');
  console.log('Product ACX.G-018 found in frontend:', specificProduct);
  console.log('Total products in frontend:', allProducts.length);
  console.log('First 5 products in frontend:', allProducts.slice(0, 5).map(p => ({ id: p.product_id, name: p.product_name })));

  // Check if product is visible in current display
  const isProductVisible = allProducts.some(p => p.product_id === 'ACX.G-018');
  if (isProductVisible) {
    console.log('✅ Product ACX.G-018 is visible in frontend!');
  } else {
    console.log('❌ Product ACX.G-018 is NOT visible in frontend yet. Try scrolling to load more products.');
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleProductClick = (productId: string) => {
    trackProductClick.mutate(productId);
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
              {/* Loading state for initial fetch */}
              {isProductsLoading && (
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
              {!isProductsLoading && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-muted-foreground" data-testid="text-products-count">
                      Menampilkan semua produk
                    </span>
                  </div>
                  
                  {allProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="grid-all-products">
                      {allProducts.map((product, index) => (
                        <ProductCard
                          key={`${product.id}-${index}`}
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

                  {/* Load More Button */}
                  <div className="mt-12 text-center">
                    {hasNextPage && (
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                        data-testid="button-load-more"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memuat...
                          </>
                        ) : (
                          'Muat Lebih Banyak'
                        )}
                      </Button>
                    )}
                  </div>

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
                  DAFTAR PRODUCT
                </h3>
              </div>
          <p className="text-muted-foreground text-sm mb-4">Platform untuk mencari dan menemukan produk-produk terbaik dari berbagai kategori.</p>
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
              {isCategoryLoading ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[...Array(4)].map((_, i) => <li key={i}><div className="h-4 bg-muted rounded w-2/3"></div></li>)}
                </ul>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {categoryData.categories.slice(0, 5).map(category => (
                    <li key={category}>
                      <Link to={`/${slugify(category)}`} className="hover:text-emerald transition-colors">
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/faq" className="hover:text-emerald transition-colors">FAQ</Link></li>
                <li><Link to="/how-to-shop" className="hover:text-emerald transition-colors">Cara Berbelanja</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-emerald transition-colors">Kebijakan Privasi</Link></li>
                <li><Link to="/terms-and-conditions" className="hover:text-emerald transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center"><i className="fas fa-envelope text-emerald mr-2"></i> support@daftarproduct.com</p>
                <p className="flex items-center"><i className="fas fa-phone text-emerald mr-2"></i> +62 21 1234 5678</p>
                <p className="flex items-center"><i className="fas fa-map-marker-alt text-emerald mr-2"></i> Jakarta, Indonesia</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-muted-foreground text-sm">
              © 2024 DAFTAR PRODUCT. All rights reserved.
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
