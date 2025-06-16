// Simple in-memory cache with TTL support
class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        // Default TTL from environment or 5 minutes
        this.defaultTTL = parseInt(process.env.CACHE_TTL) || 300;
        
        // Clean up expired entries periodically
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, (parseInt(process.env.CACHE_CHECK_PERIOD) || 60) * 1000);
    }

    // Get a value from cache
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (item.expiry && Date.now() > item.expiry) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    // Set a value in cache with optional TTL
    set(key, value, ttl = null) {
        const ttlSeconds = ttl || this.defaultTTL;
        const expiry = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;

        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }

        // Store the item
        this.cache.set(key, { value, expiry });
        this.stats.sets++;

        // Set auto-delete timer if TTL is specified
        if (expiry) {
            const timer = setTimeout(() => {
                this.delete(key);
            }, ttlSeconds * 1000);
            this.timers.set(key, timer);
        }

        return true;
    }

    // Delete a specific key
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.stats.deletes++;
            return true;
        }
        
        return false;
    }

    // Clear all cache
    clear() {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        
        this.cache.clear();
        this.timers.clear();
        this.resetStats();
    }

    // Get cache statistics
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: this.stats.hits > 0 
                ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    // Reset statistics
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    // Manual cleanup of expired entries
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, item] of this.cache.entries()) {
            if (item.expiry && now > item.expiry) {
                this.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
        }
    }

    // Get all keys
    keys() {
        return Array.from(this.cache.keys());
    }

    // Check if key exists
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Check expiry
        if (item.expiry && Date.now() > item.expiry) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    // Get cache size
    size() {
        return this.cache.size;
    }

    // Shutdown cache (cleanup)
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Create singleton instance
let cacheInstance = null;

// Graceful shutdown
process.on('SIGINT', () => {
    if (cacheInstance) {
        cacheInstance.shutdown();
    }
});

process.on('SIGTERM', () => {
    if (cacheInstance) {
        cacheInstance.shutdown();
    }
});

// Cache wrapper for functions
function cacheable(fn, options = {}) {
    const { ttl, keyGenerator } = options;
    
    return async function(...args) {
        const cache = getCacheInstance();
        
        // Generate cache key
        const key = keyGenerator 
            ? keyGenerator(...args)
            : `${fn.name}:${JSON.stringify(args)}`;
        
        // Check cache first
        const cached = cache.get(key);
        if (cached !== null) {
            return cached;
        }
        
        // Execute function and cache result
        const result = await fn.apply(this, args);
        cache.set(key, result, ttl);
        
        return result;
    };
}

// Get cache instance
function getCacheInstance() {
    if (!cacheInstance) {
        cacheInstance = new MemoryCache();
    }
    return cacheInstance;
}

module.exports = {
    MemoryCache,
    getCacheInstance,
    cacheable
};