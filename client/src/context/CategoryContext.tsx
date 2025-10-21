
import { createContext, useContext, useMemo } from 'react';
import { useCategories } from '@/hooks/useProductQueries';
import { slugify } from '@/lib/utils';

interface CategoryData {
  categories: string[];
  subcategories: string[];
}

interface CategoryContextType {
  categoryData: CategoryData;
  categorySlugMap: Map<string, string>;
  subcategorySlugMap: Map<string, string>;
  isLoading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useCategories();

  const categoryData = useMemo(() => {
    return {
      categories: data?.categories || [],
      subcategories: data?.subcategories || [],
    };
  }, [data]);

  const categorySlugMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryData.categories.forEach(name => {
      map.set(slugify(name), name);
    });
    return map;
  }, [categoryData.categories]);

  const subcategorySlugMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryData.subcategories.forEach(name => {
      map.set(slugify(name), name);
    });
    return map;
  }, [categoryData.subcategories]);

  const value = {
    categoryData,
    categorySlugMap,
    subcategorySlugMap,
    isLoading,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
}
