import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, storageKey = 'theme' }: { children: React.ReactNode; storageKey?: string }) {
  const [theme, setTheme] = useState<Theme>('light');

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  return (
    <ThemeContext.Provider value={{ theme }}>
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
