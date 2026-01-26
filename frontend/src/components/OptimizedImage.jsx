import React, { useState, useEffect, useRef, useCallback } from 'react';
import './OptimizedImage.css';

/**
 * OptimizedImage Component
 * - Lazy loading with Intersection Observer
 * - WebP format support
 * - Blur placeholder
 * - Responsive sizes
 * - Loading states
 * - Error handling
 */
const OptimizedImage = ({
  src,
  srcWebP,
  alt,
  width,
  height,
  className = '',
  placeholder = 'blur',
  aspectRatio,
  objectFit = 'cover',
  lazy = true,
  priority = false,
  onLoad,
  onError,
  sizes = '100vw',
  srcSet,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder ? null : src);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Generate WebP source if not provided
  const webpSrc = srcWebP || (src && src.replace(/\.[^/.]+$/, '.webp'));

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [lazy, priority]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setCurrentSrc(src);
    if (onLoad) {
      onLoad();
    }
  }, [src, onLoad]);

  // Handle error
  const handleError = useCallback(() => {
    setError(true);
    if (onError) {
      onError();
    }
  }, [onError]);

  // Generate srcSet if not provided
  const generateSrcSet = useCallback(() => {
    if (srcSet) return srcSet;
    if (!src) return null;

    // Parse the URL to extract base path and extension
    const match = src.match(/^(.+?)(\.[^.]+)?$/);
    if (!match) return null;

    const basePath = match[1];
    const ext = match[2] || '';

    // Generate srcset for different widths
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
    const srcSetParts = widths
      .filter((w) => w <= 1920)
      .map((w) => `${basePath}${ext} ${w}w`);

    return srcSetParts.join(', ');
  }, [src, srcSet]);

  // Placeholder styles based on aspect ratio
  const getPlaceholderStyle = () => {
    if (aspectRatio) {
      return { paddingTop: aspectRatio };
    }
    if (height && width) {
      return { paddingTop: `${(height / width) * 100}%` };
    }
    return {};
  };

  // Generate picture element sources
  const renderPictureSources = () => {
    if (!webpSrc) return null;

    return (
      <>
        <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
        <source srcSet={src} type={`image/${src?.split('.').pop()}`} sizes={sizes} />
      </>
    );
  };

  // Generate blur data URL for placeholder
  const generateBlurPlaceholder = () => {
    if (placeholder !== 'blur') return null;

    // Create a simple SVG blur placeholder
    const blurSize = 8;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
        <rect width="1" height="1" fill="#1a1a1a"/>
        <filter id="blur">
          <feGaussianBlur stdDeviation="${blurSize}" />
        </filter>
        <rect width="1" height="1" filter="url(#blur)" fill="#0a0a0a"/>
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  if (error) {
    return (
      <div
        className={`optimized-image error ${className}`}
        ref={containerRef}
        style={getPlaceholderStyle()}
        {...props}
      >
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`optimized-image-container ${className}`}
      ref={containerRef}
      style={getPlaceholderStyle()}
    >
      {/* Placeholder */}
      {placeholder && !isLoaded && (
        <div
          className="optimized-image-placeholder"
          style={{
            backgroundImage: generateBlurPlaceholder()
              ? `url(${generateBlurPlaceholder()})`
              : undefined,
          }}
        >
          <div className="placeholder-shimmer" />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <picture className="optimized-image-picture">
          {renderPictureSources()}
          <img
            ref={imgRef}
            src={currentSrc || src}
            srcSet={generateSrcSet()}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            className={`optimized-image ${isLoaded ? 'loaded' : 'loading'} ${className}`}
            style={{ objectFit }}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...props}
          />
        </picture>
      )}

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="optimized-image-loading">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

/**
 * Responsive Image Wrapper
 * Automatically generates srcSet based on viewport breakpoints
 */
export const ResponsiveImage = ({
  src,
  alt,
  breakpoints = {
    mobile: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1280,
    wide: 1920,
  },
  className = '',
  ...props
}) => {
  const generateSrcSetForBreakpoints = () => {
    const ext = src.split('.').pop();
    const basePath = src.replace(`.${ext}`, '');

    return Object.entries(breakpoints)
      .map(([key, width]) => `${basePath}-${key}.${ext} ${width}w`)
      .join(', ');
  };

  const generateSizesAttribute = () => {
    const sizes = Object.entries(breakpoints)
      .map(([key, width]) => {
        switch (key) {
          case 'mobile':
            return `(max-width: 480px) 100vw`;
          case 'tablet':
            return `(max-width: 768px) 100vw`;
          case 'laptop':
            return `(max-width: 1024px) 90vw`;
          case 'desktop':
            return `(max-width: 1280px) 80vw`;
          case 'wide':
            return `1920px`;
          default:
            return `${width}px`;
        }
      })
      .reverse()
      .join(', ');

    return `${sizes}, 100vw`;
  };

  return (
    <OptimizedImage
      src={src}
      srcSet={generateSrcSetForBreakpoints()}
      sizes={generateSizesAttribute()}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

/**
 * Avatar Image Component
 * Circular image with fallback
 */
export const AvatarImage = ({
  src,
  alt,
  size = 48,
  className = '',
  ...props
}) => {
  const [error, setError] = useState(false);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    if (alt) {
      const words = alt.split(' ');
      const initials = words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      setInitials(initials);
    }
  }, [alt]);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return (
      <div
        className={`avatar-image ${className}`}
        style={{ width: size, height: size }}
        {...props}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`avatar-image ${className}`}
      width={size}
      height={size}
      aspectRatio="1"
      objectFit="cover"
      onError={handleError}
      {...props}
    />
  );
};

/**
 * Background Image Component
 * Full-width background with overlay support
 */
export const BackgroundImage = ({
  src,
  srcWebP,
  alt = '',
  className = '',
  overlay = false,
  overlayOpacity = 0.5,
  children,
  ...props
}) => {
  return (
    <div className={`background-image-container ${className}`} {...props}>
      <OptimizedImage
        src={src}
        srcWebP={srcWebP}
        alt={alt}
        className="background-image"
        priority={true}
      />
      {overlay && (
        <div
          className="background-image-overlay"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="background-image-content">{children}</div>
    </div>
  );
};

