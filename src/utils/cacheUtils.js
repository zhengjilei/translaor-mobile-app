import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache prefix
const CACHE_PREFIX = 'translator_cache_';
// Default TTL (time to live) in milliseconds - 1 hour
const DEFAULT_TTL = 60 * 60 * 1000; 

/**
 * Get cached data if available and not expired
 * @param {string} key - The cache key
 * @returns {Promise<any|null>} - The cached data or null if not found/expired
 */
export const getCachedData = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const { data, timestamp, ttl } = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > ttl) {
      // Remove expired cache
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Cache data with a specified TTL
 * @param {string} key - The cache key
 * @param {any} data - The data to cache
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<boolean>} - True if caching was successful
 */
export const cacheData = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Caching error:', error);
    return false;
  }
};

/**
 * Clear a specific cache entry
 * @param {string} key - The cache key
 * @returns {Promise<boolean>} - True if clearing was successful
 */
export const clearCache = async (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache clearing error:', error);
    return false;
  }
};

/**
 * Clear all cached data
 * @returns {Promise<boolean>} - True if clearing was successful
 */
export const clearAllCache = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Cache clearing error:', error);
    return false;
  }
};

/**
 * Fetch data with caching support
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} cacheKey - The cache key (defaults to URL)
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<any>} - The fetched or cached data
 */
export const fetchWithCache = async (url, options = {}, cacheKey = null, ttl = DEFAULT_TTL) => {
  const key = cacheKey || url;
  
  // Try to get from cache first
  const cachedData = await getCachedData(key);
  if (cachedData) {
    return cachedData;
  }
  
  // If not in cache or expired, fetch fresh data
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the fetched data
    await cacheData(key, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}; 