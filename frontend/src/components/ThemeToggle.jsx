import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'icon', showLabel = false, className = '' }) => {
  const { theme, setTheme, toggleTheme, isDark, isSystem } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [isDark]);

  const handleClick = () => {
    toggleTheme();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return isDark ? 'Dark' : 'Light';
  };

  if (variant === 'dropdown') {
    return (
      <div className={`theme-toggle dropdown ${className}`}>
        <button 
          className={`theme-toggle-btn ${isAnimating ? 'animating' : ''}`}
          onClick={handleClick}
          aria-label={`Current theme: ${getThemeLabel()}. Click to toggle.`}
        >
          <span className="theme-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
          <span className="theme-label">{getThemeLabel()}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        <div className="theme-dropdown">
          <button 
            className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <span className="item-icon">🌙</span>
            <span className="item-text">Dark</span>
            {theme === 'dark' && <span className="check">✓</span>}
          </button>
          <button 
            className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="item-icon">☀️</span>
            <span className="item-text">Light</span>
            {theme === 'light' && <span className="check">✓</span>}
          </button>
          <button 
            className={`dropdown-item ${theme === 'system' ? 'active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <span className="item-icon">💻</span>
            <span className="item-text">System</span>
            {theme === 'system' && <span className="check">✓</span>}
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={`theme-toggle segmented ${className}`}>
        <button 
          className={`segment-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-label="Switch to dark mode"
        >
          <span className="segment-icon">🌙</span>
          <span className="segment-text">Dark</span>
        </button>
        <button 
          className={`segment-btn ${theme === 'system' ? 'active' : ''}`}
          onClick={() => setTheme('system')}
          aria-label="Use system preference"
        >
          <span className="segment-icon">💻</span>
          <span className="segment-text">System</span>
        </button>
        <button 
          className={`segment-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
          aria-label="Switch to light mode"
        >
          <span className="segment-icon">☀️</span>
          <span className="segment-text">Light</span>
        </button>
      </div>
    );
  }

  // Default: icon only with tooltip
  return (
    <div className={`theme-toggle icon-only ${className}`}>
      <button 
        className={`theme-toggle-btn icon ${isAnimating ? 'animating' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Current theme: ${getThemeLabel()}. Click to toggle.`}
        title={`Current: ${getThemeLabel()} (Click to toggle)`}
      >
        <span className="toggle-track">
          <span className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </span>
      </button>
      {showLabel && (
        <span className="theme-toggle-label">{getThemeLabel()}</span>
      )}
    </div>
  );
};

export default ThemeToggle;

