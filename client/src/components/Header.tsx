import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Moon, Sun, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle: () => void;
}

export function Header({ searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald to-metallic rounded-xl flex items-center justify-center">
              <i className="fas fa-store text-white text-lg"></i>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald to-metallic bg-clip-text text-transparent">
              DAFTAR PRODUCT
            </h1>
          </Link>
          
          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari produk, kategori, atau brand..."
                className="w-full px-4 py-3 pr-12 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald transition-all"
                data-testid="input-search-desktop"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-emerald transition-colors" data-testid="button-search-desktop">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              data-testid="button-theme-toggle"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-all"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari produk..."
              className="w-full px-4 py-3 pr-12 bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald"
              data-testid="input-search-mobile"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" data-testid="button-search-mobile">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
