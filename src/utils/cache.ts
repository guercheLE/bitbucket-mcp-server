/**
 * Cache Utilities
 * In-memory cache with TTL support for pull request operations
 */

import { logger } from './logger';
import { environment } from '../config/environment';

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheItem<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTtl: number; // in milliseconds
  maxSize: number;
  cleanupInterval: number; // in milliseconds
  enableStats: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// ============================================================================
// Cache Class
// ============================================================================

export class Cache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true,
      ...config
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0
    };
    
    this.startCleanupTimer();
  }
  
  /**
   * Gets a value from the cache
   */
  public get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      logger.debug('Cache miss', { key, stats: this.getStats() });
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      logger.debug('Cache miss (expired)', { key, expiredAt: item.expiresAt });
      return null;
    }
    
    // Update access info
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateHitRate();
    logger.debug('Cache hit', { key, accessCount: item.accessCount });
    
    return item.value;
  }
  
  /**
   * Sets a value in the cache
   */
  public set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTtl);
    
    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }
    
    const item: CacheItem<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    };
    
    this.cache.set(key, item);
    this.stats.sets++;
    this.stats.size = this.cache.size;
    
    logger.debug('Cache set', { 
      key, 
      ttl: ttl || this.config.defaultTtl,
      expiresAt,
      size: this.cache.size 
    });
  }
  
  /**
   * Deletes a value from the cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      logger.debug('Cache delete', { key, size: this.cache.size });
    }
    return deleted;
  }
  
  /**
   * Checks if a key exists in the cache
   */
  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clears all items from the cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.size = 0;
    logger.info('Cache cleared', { previousSize: size });
  }
  
  /**
   * Gets cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Gets cache size
   */
  public size(): number {
    return this.cache.size;
  }
  
  /**
   * Gets all keys in the cache
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Updates hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
  
  /**
   * Evicts the least recently used item
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache evicted LRU item', { key: oldestKey });
    }
  }
  
  /**
   * Starts the cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  /**
   * Cleans up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    this.stats.size = this.cache.size;
    
    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { 
        cleanedCount, 
        remainingSize: this.cache.size 
      });
    }
  }
  
  /**
   * Stops the cleanup timer
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.clear();
    logger.info('Cache destroyed');
  }
}

// ============================================================================
// Pull Request Cache
// ============================================================================

export class PullRequestCache {
  private cache: Cache;
  private static instance: PullRequestCache;
  
  private constructor() {
    this.cache = new Cache({
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true
    });
  }
  
  public static getInstance(): PullRequestCache {
    if (!PullRequestCache.instance) {
      PullRequestCache.instance = new PullRequestCache();
    }
    return PullRequestCache.instance;
  }
  
  /**
   * Gets a pull request from cache
   */
  public getPullRequest(projectKey: string, repoSlug: string, pullRequestId: number): any | null {
    const key = `pr:${projectKey}:${repoSlug}:${pullRequestId}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets a pull request in cache
   */
  public setPullRequest(projectKey: string, repoSlug: string, pullRequestId: number, data: any, ttl?: number): void {
    const key = `pr:${projectKey}:${repoSlug}:${pullRequestId}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Gets pull request list from cache
   */
  public getPullRequestList(projectKey: string, repoSlug: string, state?: string): any | null {
    const key = `pr-list:${projectKey}:${repoSlug}:${state || 'all'}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets pull request list in cache
   */
  public setPullRequestList(projectKey: string, repoSlug: string, data: any, state?: string, ttl?: number): void {
    const key = `pr-list:${projectKey}:${repoSlug}:${state || 'all'}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Gets pull request comments from cache
   */
  public getPullRequestComments(projectKey: string, repoSlug: string, pullRequestId: number): any | null {
    const key = `pr-comments:${projectKey}:${repoSlug}:${pullRequestId}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets pull request comments in cache
   */
  public setPullRequestComments(projectKey: string, repoSlug: string, pullRequestId: number, data: any, ttl?: number): void {
    const key = `pr-comments:${projectKey}:${repoSlug}:${pullRequestId}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Gets pull request diff from cache
   */
  public getPullRequestDiff(projectKey: string, repoSlug: string, pullRequestId: number): any | null {
    const key = `pr-diff:${projectKey}:${repoSlug}:${pullRequestId}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets pull request diff in cache
   */
  public setPullRequestDiff(projectKey: string, repoSlug: string, pullRequestId: number, data: any, ttl?: number): void {
    const key = `pr-diff:${projectKey}:${repoSlug}:${pullRequestId}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Gets pull request changes from cache
   */
  public getPullRequestChanges(projectKey: string, repoSlug: string, pullRequestId: number): any | null {
    const key = `pr-changes:${projectKey}:${repoSlug}:${pullRequestId}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets pull request changes in cache
   */
  public setPullRequestChanges(projectKey: string, repoSlug: string, pullRequestId: number, data: any, ttl?: number): void {
    const key = `pr-changes:${projectKey}:${repoSlug}:${pullRequestId}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Gets pull request activities from cache
   */
  public getPullRequestActivities(projectKey: string, repoSlug: string, pullRequestId: number): any | null {
    const key = `pr-activities:${projectKey}:${repoSlug}:${pullRequestId}`;
    return this.cache.get(key);
  }
  
  /**
   * Sets pull request activities in cache
   */
  public setPullRequestActivities(projectKey: string, repoSlug: string, pullRequestId: number, data: any, ttl?: number): void {
    const key = `pr-activities:${projectKey}:${repoSlug}:${pullRequestId}`;
    this.cache.set(key, data, ttl);
  }
  
  /**
   * Invalidates pull request cache
   */
  public invalidatePullRequest(projectKey: string, repoSlug: string, pullRequestId: number): void {
    const keys = [
      `pr:${projectKey}:${repoSlug}:${pullRequestId}`,
      `pr-comments:${projectKey}:${repoSlug}:${pullRequestId}`,
      `pr-diff:${projectKey}:${repoSlug}:${pullRequestId}`,
      `pr-changes:${projectKey}:${repoSlug}:${pullRequestId}`,
      `pr-activities:${projectKey}:${repoSlug}:${pullRequestId}`
    ];
    
    keys.forEach(key => this.cache.delete(key));
    
    // Also invalidate list caches
    this.invalidatePullRequestList(projectKey, repoSlug);
    
    logger.debug('Pull request cache invalidated', { projectKey, repoSlug, pullRequestId });
  }
  
  /**
   * Invalidates pull request list cache
   */
  public invalidatePullRequestList(projectKey: string, repoSlug: string): void {
    const states = ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED', 'all'];
    states.forEach(state => {
      const key = `pr-list:${projectKey}:${repoSlug}:${state}`;
      this.cache.delete(key);
    });
    
    logger.debug('Pull request list cache invalidated', { projectKey, repoSlug });
  }
  
  /**
   * Gets cache statistics
   */
  public getStats(): CacheStats {
    return this.cache.getStats();
  }
  
  /**
   * Clears all cache
   */
  public clear(): void {
    this.cache.clear();
    logger.info('Pull request cache cleared');
  }
  
  /**
   * Destroys the cache
   */
  public destroy(): void {
    this.cache.destroy();
    logger.info('Pull request cache destroyed');
  }
}

// ============================================================================
// Cache Utilities
// ============================================================================

export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

export function parseCacheKey(key: string): { prefix: string; parts: string[] } {
  const [prefix, ...parts] = key.split(':');
  return { prefix, parts };
}

// ============================================================================
// Global Cache Instance
// ============================================================================

export const pullRequestCache = PullRequestCache.getInstance();

// Graceful shutdown
process.on('SIGINT', () => {
  pullRequestCache.destroy();
});

process.on('SIGTERM', () => {
  pullRequestCache.destroy();
});

export default pullRequestCache;
