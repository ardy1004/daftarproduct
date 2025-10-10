import { useState, useEffect } from 'react';
import { Tag, Folder, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useCategories } from '@/hooks/useProductQueries';
import { useSettings } from '@/hooks/useSettings';
import { formatPrice } from '@/lib/utils';
import type { FilterState } from '@/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function FilterSidebar({ filters, onFiltersChange, showFilters, onToggleFilters }: FilterSidebarProps) {
  const { data: categoriesData } = useCategories();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const [localPriceMin, setLocalPriceMin] = useState(filters.priceMin);
  const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax);

  // Debounced price update
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localPriceMin !== filters.priceMin || localPriceMax !== filters.priceMax) {
        onFiltersChange({
          ...filters,
          priceMin: localPriceMin,
          priceMax: localPriceMax
        });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [localPriceMin, localPriceMax]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const resetFilters = () => {
    const resetState = {
      search: '',
      categories: [],
      priceMin: 0,
      priceMax: 20000000,
      sortBy: 'popular'
    };
    setLocalPriceMin(0);
    setLocalPriceMax(20000000);
    onFiltersChange(resetState);
  };

  const handlePriceSliderChange = (values: number[]) => {
    setLocalPriceMin(values[0]);
    setLocalPriceMax(values[1]);
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sortBy
    });
  };

  const renderCategoryFilter = () => {
    if (isLoadingSettings) {
      return <p>Loading filter settings...</p>;
    }

    if (!settings?.show_category_filter) {
      return null;
    }

    return (
      categoriesData?.length > 0 && (
        <div className="mb-8">
          <h4 className="font-semibold mb-4 flex items-center">
            <Folder className="h-4 w-4 text-emerald mr-2" />
            Kategori
          </h4>
          <div className="space-y-3">
            {categoriesData.map((category) => (
              <div key={category} className="flex items-center space-x-3">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <label 
                  htmlFor={`category-${category}`}
                  className="text-sm cursor-pointer hover:text-emerald transition-colors"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>
      )
    );
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6">
        <Button
          onClick={onToggleFilters}
          variant="outline"
          className="flex items-center space-x-2 w-full justify-center"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter & Sort</span>
        </Button>
      </div>

      <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
        <div className="bg-card rounded-xl border border-border p-6 sticky top-24 shadow-xl ring-1 ring-black/5 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Filter Produk</h3>
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="text-emerald hover:text-emerald/80 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
          
          {/* Price Range Filter */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4 flex items-center">
              <Tag className="h-4 w-4 text-emerald mr-2" />
              Rentang Harga
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs text-muted-foreground">Minimum</label>
                <Input
                  type="number"
                  value={localPriceMin}
                  onChange={(e) => setLocalPriceMin(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Maksimum</label>
                <Input
                  type="number"
                  value={localPriceMax}
                  onChange={(e) => setLocalPriceMax(Number(e.target.value))}
                  placeholder="20000000"
                  className="w-full text-sm"
                />
              </div>
            </div>
            <div className="px-2 mb-4">
              <Slider
                value={[localPriceMin, localPriceMax]}
                onValueChange={handlePriceSliderChange}
                max={20000000}
                min={0}
                step={100000}
                className="w-full"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPrice(localPriceMin)} - {formatPrice(localPriceMax)}
            </div>
          </div>
          
          {/* Category Filter */}
          {renderCategoryFilter()}
          
          {/* Sort Options */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center">
              <i className="fas fa-sort text-emerald mr-2"></i>
              Urutkan
            </h4>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih urutan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Populer</SelectItem>
                <SelectItem value="terlaris">Terlaris</SelectItem>
                <SelectItem value="harga_termurah">Harga Termurah</SelectItem>
                <SelectItem value="harga_tertinggi">Harga Tertinggi</SelectItem>
                <SelectItem value="rekomendasi">Rekomendasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
}
