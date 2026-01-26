/**
 * Cache management utilities for frontend
 * Handles browser caching, API response caching, and offline functionality
 */

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`,
};

/**
 * Cache configuration for different resource types
 */
export const CacheConfig = {
  // Static assets (never change)
  STATIC: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    name: CACHE_NAMES.STATIC,
  },

  // Dynamic content (CSS, JS bundles)
  DYNAMIC: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    name: CACHE_NAMES.DYNAMIC,
  },

  // API responses
  API: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    name: CACHE_NAMES.API,
  },

  // Images
  IMAGES: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    name: CACHE_NAMES.IMAGES,
  },
};

/**
 * Cache Manager class
 */
export class CacheManager {
  /**
   * Get cached item with expiration check
   */
  static async getCached(cacheName, key) {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(key);

      if (!response) return null;

      // Check expiration
      const cachedTime = response.headers.get('x-cached-time');
      if (cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        const maxAge = CacheConfig[Object.keys(CacheConfig).find(
          k => CacheConfig[k].name === cacheName
        )]?.maxAge || 5 * 60 * 1000;

        if (age > maxAge) {
          await cache.delete(key);
          return null;
        }
      }

      return response;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Set cache with timestamp
   */
  static async setCached(cacheName, key, response) {
    try {
      const cache = await caches.open(cacheName);
      const cloned = response.clone();

      // Add timestamp header
      const headers = new Headers(cloned.headers);
      headers.set('x-cached-time', Date.now().toString());

      const newResponse = new Response(cloned.body, {
        status: cloned.status,
        statusText: cloned.statusText,
        headers,
      });

      await cache.put(key, newResponse);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Clear specific cache
   */
  static async clearCache(cacheName) {
    try {
      await caches.delete(cacheName);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches() {
    try {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    } catch (error) {
      console.error('Clear all caches error:', error);
    }
  }

  /**
   * Get cache size
   */
  static async getCacheSize(cacheName) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let size = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          size += blob.size;
        }
      }

      return size;
    } catch (error) {
      console.error('Get cache size error:', error);
      return 0;
    }
  }
}

/**
 * HTTP Cache Headers utility
 */
export const CacheHeaders = {
  /**
   * Get cache control header for different response types
   */
  getControlHeader(type = 'dynamic') {
    const headers = {
      static: 'public, max-age=31536000, immutable', // 1 year
      dynamic: 'public, max-age=3600', // 1 hour
      api: 'private, max-age=300', // 5 minutes
      user: 'private, no-cache', // Don't cache user-specific data
      never: 'no-cache, no-store, must-revalidate', // Never cache
    };

    return headers[type] || headers.dynamic;
  },

  /**
   * Get ETag header
   */
  getETag(data) {
    const hash = this.simpleHash(JSON.stringify(data));
    return `"${hash}"`;
  },

  /**
   * Simple hash function for ETag generation
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
};

/**
 * Local Storage wrapper with expiration
 */
export class StorageManager {
  /**
   * Set item with expiration
   */
  static setItem(key, value, expirationMinutes = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationMinutes ? Date.now() + expirationMinutes * 60 * 1000 : null,
    };

    localStorage.setItem(key, JSON.stringify(item));
  }

  /**
   * Get item with expiration check
   */
  static getItem(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));

      if (!item) return null;

      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  static removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all storage
   */
  static clear() {
    localStorage.clear();
  }

  /**
   * Get storage size
   */
  static getSize() {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }
}

/**
 * API Response Caching decorator
 */
export const cacheApiResponse = (duration = 5) => {
  return async (fn) => {
    const cacheKey = fn.toString();
    const cached = StorageManager.getItem(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await fn();
    StorageManager.setItem(cacheKey, result, duration);
    return result;
  };
};
