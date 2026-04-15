/**
 * AI Response Cache — LRU cache for AI API responses.
 *
 * Why cache AI responses?
 *   - Gemini API calls cost money and have rate limits
 *   - Same bug text will produce the same classification/priority
 *   - Reduces latency from ~2s to ~0ms for cache hits
 *
 * Strategy:
 *   - LRU (Least Recently Used) with max 500 entries
 *   - Default TTL: 10 minutes (configurable per-entry)
 *   - Cache key: operation type + hash of input text
 */

const { LRUCache } = require('lru-cache');

const cache = new LRUCache({
  max: 500,               // Max entries
  ttl: 1000 * 60 * 10,    // Default: 10 minutes
  updateAgeOnGet: true,    // Reset TTL on access
  updateAgeOnHas: false,
});

/**
 * Get a cached result.
 * @param {string} key - Cache key
 * @returns {Object|undefined} Cached result or undefined
 */
const getCache = (key) => {
  return cache.get(key);
};

/**
 * Store a result in cache.
 * @param {string} key - Cache key
 * @param {Object} value - Result to cache
 * @param {number} ttlSeconds - Optional TTL override in seconds
 */
const setCache = (key, value, ttlSeconds) => {
  const options = ttlSeconds ? { ttl: ttlSeconds * 1000 } : {};
  cache.set(key, value, options);
};

/**
 * Express middleware: check cache before hitting AI endpoint.
 * Attaches cacheKey to req for downstream use.
 */
const cacheMiddleware = (prefix) => {
  return (req, res, next) => {
    const { title, description } = req.body;
    if (!title || !description) return next();

    const key = `${prefix}:${title}:${description}`.substring(0, 200);
    req.cacheKey = key;

    const cached = cache.get(key);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, ...cached });
    }

    next();
  };
};

/**
 * Get cache statistics for monitoring.
 */
const getCacheStats = () => ({
  size: cache.size,
  maxSize: cache.max,
  hitRate: cache.size > 0 ? 'active' : 'empty',
});

module.exports = {
  getCache,
  setCache,
  cacheMiddleware,
  getCacheStats,
};
