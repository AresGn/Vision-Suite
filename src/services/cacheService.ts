/**
 * Cache service for storing and retrieving AI models and processed data
 */

const CACHE_PREFIX = 'ai-vision-suite-';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

/**
 * Store data in localStorage with expiry and versioning
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Retrieve data from localStorage with expiry and version checks
 */
export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const cacheItem: CacheItem<T> = JSON.parse(cached);
    
    // Check version compatibility
    if (cacheItem.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    // Check expiry
    if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
    return null;
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Clear all cache entries for this application
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
}

/**
 * Get cache size information
 */
export function getCacheInfo(): { totalSize: number; itemCount: number } {
  let totalSize = 0;
  let itemCount = 0;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          itemCount++;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to get cache info:', error);
  }
  
  return { totalSize, itemCount };
}

/**
 * Check if browser supports localStorage
 */
export function isCacheSupported(): boolean {
  try {
    const test = '__cache_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
