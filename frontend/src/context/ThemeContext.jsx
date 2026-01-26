import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getSystemPreference = () => {
  if (typeof window === 'undefined') return 'dark';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (mediaQuery.matches) {
    return 'dark';
  }
  
  const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
  if (lightQuery.matches) {
    return 'light';
  }
  
  return 'dark';
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
    return savedTheme;
  }
  
  // Fall back to system preference
  return getSystemPreference();
};

export const ThemeProvider = ({ children, defaultTheme = 'system' }) => {
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [systemPreference, setSystemPreference] = useState('dark');

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const updateSystemPreference = () => {
      if (mediaQuery.matches) {
        setSystemPreference('dark');
      } else if (lightQuery.matches) {
        setSystemPreference('light');
      }
    };
    
    // Initial check
    updateSystemPreference();
    
    // Listen for changes
    const handleChange = (e) => {
      updateSystemPreference();
      // If current theme is 'system', update the actual theme
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    lightQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      lightQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to document
  const applyTheme = useCallback((currentTheme) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const isDark = currentTheme === 'dark';
    
    root.setAttribute('data-theme', currentTheme);
    root.classList.toggle('dark-mode', isDark);
    root.classList.toggle('light-mode', !isDark);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0a0a0a' : '#ffffff');
    }
  }, []);

  // Effect to apply theme when it changes
  useEffect(() => {
    const currentTheme = theme === 'system' ? systemPreference : theme;
    applyTheme(currentTheme);
  }, [theme, systemPreference, applyTheme]);

  // Effect to prevent theme flash on load
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Get the theme that will be applied
    const currentTheme = theme === 'system' ? systemPreference : theme;
    
    // Apply theme immediately to prevent flash
    const styleElement = document.createElement('style');
    styleElement.id = 'theme-prevention-style';
    styleElement.textContent = `
      html, body {
        background-color: ${currentTheme === 'dark' ? '#0a0a0a' : '#ffffff'} !important;
        color: ${currentTheme === 'dark' ? '#e0e0e0' : '#1a1a1a'} !important;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // Remove after theme is fully applied
    setTimeout(() => {
      document.head.removeChild(styleElement);
    }, 100);
    
    return () => {
      const existing = document.getElementById('theme-prevention-style');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  const setThemeMode = useCallback((newTheme) => {
    const validThemes = ['dark', 'light', 'system'];
    const themeToSet = validThemes.includes(newTheme) ? newTheme : 'system';
    
    setTheme(themeToSet);
    localStorage.setItem('theme', themeToSet);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme = theme === 'system' ? systemPreference : theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
  }, [theme, systemPreference, setThemeMode]);

  const value = {
    theme,
    systemPreference,
    setTheme: setThemeMode,
    toggleTheme,
    isDark: theme === 'system' ? systemPreference === 'dark' : theme === 'dark',
    isLight: theme === 'system' ? systemPreference === 'light' : theme === 'light',
    isSystem: theme === 'system',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

