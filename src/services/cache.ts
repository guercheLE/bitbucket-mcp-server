/**
 * Caching System Implementation
 * In-memory cache with TTL and optional Redis support
 */

import { CacheConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { environment } from '../config/environment.js';

// ============================================================================
// Cache Entry Interface
// ============================================================================

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

// ============================================================================
// Cache Statistics Interface
// ============================================================================

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: number;
  entries: number;
}

// ============================================================================
// Memory Cache Implementation
// ============================================================================

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB default
      hitRate: 0,
      memoryUsage: 0,
      entries: 0,
    };

    this.startCleanupInterval();
    logger.info('Memory cache initialized', {
      maxSize: this.stats.maxSize,
      ttl: config.ttl,
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateHitRate();
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();
    this.updateStats();

    logger.debug('Cache hit', {
      key,
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt,
    });

    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.ttl) * 1000;
    const size = this.calculateSize(value);

    // Check if we need to evict entries
    await this.evictIfNeeded(size);

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
      size,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateStats();

    logger.debug('Cache set', {
      key,
      size,
      ttl: ttl || this.config.ttl,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  public async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  public async clear(): Promise<void> {
    const entries = this.cache.size;
    this.cache.clear();
    this.stats.deletes += entries;
    this.updateStats();
    logger.info('Cache cleared', { entries });
  }

  public async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.deletes++;
      this.updateStats();
      return false;
    }

    return true;
  }

  public async keys(): Promise<string[]> {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      } else {
        this.cache.delete(key);
        this.stats.deletes++;
      }
    }

    this.updateStats();
    return validKeys;
  }

  public async size(): Promise<number> {
    return this.cache.size;
  }

  public async getStats(): Promise<CacheStats> {
    this.updateStats();
    return { ...this.stats };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  private async evictIfNeeded(newEntrySize: number): Promise<void> {
    const currentSize = this.stats.size;
    const maxSize = this.stats.maxSize;

    if (currentSize + newEntrySize <= maxSize) {
      return;
    }

    // Sort entries by last accessed time (LRU)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let sizeToFree = currentSize + newEntrySize - maxSize;
    let evicted = 0;

    for (const [key, entry] of entries) {
      if (sizeToFree <= 0) {
        break;
      }

      this.cache.delete(key);
      sizeToFree -= entry.size;
      evicted++;
      this.stats.deletes++;
    }

    if (evicted > 0) {
      logger.info('Cache eviction completed', {
        evicted,
        sizeFreed: currentSize - this.stats.size,
        newSize: this.stats.size,
      });
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateStats(): void {
    let totalSize = 0;
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (Date.now() <= entry.expiresAt) {
        totalSize += entry.size;
        validEntries++;
      }
    }

    this.stats.size = totalSize;
    this.stats.entries = validEntries;
    this.stats.memoryUsage = process.memoryUsage().heapUsed;
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
        this.stats.deletes++;
      }
    }

    if (cleaned > 0) {
      this.updateStats();
      logger.debug('Cache cleanup completed', {
        cleaned,
        remaining: this.cache.size,
      });
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    logger.info('Memory cache destroyed');
  }
}

// ============================================================================
// Redis Cache Implementation (Optional)
// ============================================================================

class RedisCache {
  private redis: any;
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      maxSize: 0,
      hitRate: 0,
      memoryUsage: 0,
      entries: 0,
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Dynamic import to avoid requiring Redis in all environments
      const { createClient } = await import('redis');
      
      const redisConfig = this.config.redis!;
      this.redis = createClient({
        socket: {
          host: redisConfig.host || 'localhost',
          port: redisConfig.port || 6379,
        },
        ...(redisConfig.password && { password: redisConfig.password }),
        database: redisConfig.db || 0,
      });

      this.redis.on('error', (error: Error) => {
        logger.error('Redis connection error', { error: error.message });
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected', {
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db || 0,
        });
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      
      logger.debug('Redis cache hit', { key });
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expiration = ttl || this.config.ttl;
      
      await this.redis.setEx(key, expiration, serialized);
      this.stats.sets++;
      
      logger.debug('Redis cache set', {
        key,
        ttl: expiration,
        size: serialized.length,
      });
    } catch (error) {
      logger.error('Redis set error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      const deleted = result > 0;
      
      if (deleted) {
        this.stats.deletes++;
        logger.debug('Redis cache delete', { key });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Redis delete error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.redis.flushDb();
      this.stats.deletes += this.stats.entries;
      this.stats.entries = 0;
      logger.info('Redis cache cleared');
    } catch (error) {
      logger.error('Redis clear error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Redis exists error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  public async keys(): Promise<string[]> {
    try {
      return await this.redis.keys('*');
    } catch (error) {
      logger.error('Redis keys error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  public async size(): Promise<number> {
    try {
      return await this.redis.dbSize();
    } catch (error) {
      logger.error('Redis size error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  public async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseRedisMemoryInfo(info);
      
      return {
        ...this.stats,
        memoryUsage,
        entries: await this.size(),
      };
    } catch (error) {
      logger.error('Redis stats error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { ...this.stats };
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private parseRedisMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1] || '0') : 0;
  }

  public async destroy(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.disconnect();
        logger.info('Redis cache destroyed');
      }
    } catch (error) {
      logger.error('Redis destroy error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

export class CacheManager {
  private cache: MemoryCache | RedisCache;
  private config: CacheConfig;

  constructor(config?: CacheConfig) {
    this.config = config || {
      type: environment.getConfig().cache.type as 'memory' | 'redis',
      ttl: environment.getConfig().cache.ttl,
      maxSize: environment.getConfig().cache.maxSize,
      redis: environment.getConfig().cache.redis,
    };
    this.cache = this.createCache();
    
    logger.info('Cache manager initialized', {
      type: this.config.type,
      ttl: this.config.ttl,
      maxSize: this.config.maxSize,
    });
  }

  private createCache(): MemoryCache | RedisCache {
    switch (this.config.type) {
      case 'redis':
        if (!this.config.redis) {
          throw new Error('Redis configuration is required for Redis cache');
        }
        return new RedisCache(this.config);
      case 'memory':
      default:
        return new MemoryCache(this.config);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.cache.set<T>(key, value, ttl);
  }

  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    return this.cache.clear();
  }

  public async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  public async keys(): Promise<string[]> {
    return this.cache.keys();
  }

  public async size(): Promise<number> {
    return this.cache.size();
  }

  public async getStats(): Promise<CacheStats> {
    return this.cache.getStats();
  }

  public async destroy(): Promise<void> {
    return this.cache.destroy();
  }

  // ============================================================================
  // Cache Partitioning
  // ============================================================================

  public createPartition(prefix: string): CachePartition {
    return new CachePartition(this, prefix);
  }

  // ============================================================================
  // Cache Invalidation
  // ============================================================================

  public async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.keys();
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of keys) {
      if (regex.test(key)) {
        await this.delete(key);
        invalidated++;
      }
    }

    logger.info('Cache pattern invalidation completed', {
      pattern,
      invalidated,
    });

    return invalidated;
  }
}

// ============================================================================
// Cache Partition
// ============================================================================

export class CachePartition {
  private cache: CacheManager;
  private prefix: string;

  constructor(cache: CacheManager, prefix: string) {
    this.cache = cache;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(this.getKey(key));
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.cache.set<T>(this.getKey(key), value, ttl);
  }

  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(this.getKey(key));
  }

  public async has(key: string): Promise<boolean> {
    return this.cache.has(this.getKey(key));
  }

  public async clear(): Promise<void> {
    await this.cache.invalidatePattern(`^${this.prefix}:`);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const cache = new CacheManager();

// Export types
export type { CacheStats, CacheEntry };
