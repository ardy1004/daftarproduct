import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'light', storageKey = 'theme' }: { children: React.ReactNode; defaultTheme?: Theme; storageKey?: string }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
  }, [storageKey]);

  useLayoutEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
