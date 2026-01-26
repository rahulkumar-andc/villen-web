import { useContext, useEffect, useCallback } from 'react';
import ThemeContext from '../context/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    console.warn('useTheme: No ThemeContext found. Returning default values.');
    return {
      theme: 'dark',
      systemPreference: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
      isDark: true,
      isLight: false,
      isSystem: false,
    };
  }
  
  return context;
};

// Helper hook to track theme usage for analytics
export const useThemeAnalytics = () => {
  const { theme, isDark, isLight, isSystem } = useTheme();
  
  useEffect(() => {
    // Track theme preference in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'theme_change', {
        theme,
        isDark,
        isLight,
        isSystem,
      });
    }
  }, [theme, isDark, isLight, isSystem]);
};

// Hook for components that need to respond to theme changes
export const useThemeEffect = (effect, deps = []) => {
  const { theme, isDark } = useTheme();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    effect(isDark, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, theme, ...deps]);
};

// Hook for CSS variable management
export const useCSSVariables = (variables) => {
  const { isDark } = useTheme();
  
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([key, value]) => {
      const darkValue = value.dark;
      const lightValue = value.light;
      
      root.style.setProperty(`--${key}`, isDark ? darkValue : lightValue);
    });
  }, [isDark, variables]);
};

// Default CSS variables that respond to theme
export const defaultThemeVariables = {
  'bg-primary': { dark: '#0a0a0a', light: '#ffffff' },
  'bg-secondary': { dark: '#1a1a1a', light: '#f5f5f5' },
  'bg-tertiary': { dark: '#2d2d2d', light: '#e0e0e0' },
  'text-primary': { dark: '#e0e0e0', light: '#1a1a1a' },
  'text-secondary': { dark: '#a0a0a0', light: '#666666' },
  'text-muted': { dark: '#666666', light: '#999999' },
  'border-color': { dark: '#3d3d3d', light: '#cccccc' },
  'accent-primary': { dark: '#00d4ff', light: '#0066cc' },
  'accent-secondary': { dark: '#00ff88', light: '#00aa66' },
  'glass-bg': { dark: 'rgba(30, 30, 30, 0.8)', light: 'rgba(255, 255, 255, 0.8)' },
  'glass-border': { dark: 'rgba(255, 255, 255, 0.1)', light: 'rgba(0, 0, 0, 0.1)' },
};

