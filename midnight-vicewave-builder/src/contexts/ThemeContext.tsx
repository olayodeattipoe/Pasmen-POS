import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
 theme: Theme;
 toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
 const [theme, setTheme] = useState<Theme>(() => {
 // Check localStorage for saved theme preference
 const savedTheme = localStorage.getItem('vicewave-theme') as Theme;
 return savedTheme || 'dark'; // Default to dark mode
 });

 useEffect(() => {
 // Apply theme to document root
 document.documentElement.setAttribute('data-theme', theme);
 // Save to localStorage
 localStorage.setItem('vicewave-theme', theme);
 }, [theme]);

 const toggleTheme = () => {
 setTheme(prev => prev === 'light' ? 'dark' : 'light');
 };

 return (
 <ThemeContext.Provider value={{ theme, toggleTheme }}>
 {children}
 </ThemeContext.Provider>
 );
}

export function useTheme() {
 const context = useContext(ThemeContext);
 if (context === undefined) {
 throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
}

