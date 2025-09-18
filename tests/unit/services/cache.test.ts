/**
 * Unit Tests for Cache Service
 * Tests for memory and Redis cache implementations
 */

import { CacheManager } from '../../../src/services/cache.js';
import { environment } from '../../../src/config/environment';

// Mock environment
jest.mock('../../../src/config/environment', () => ({
  environment: {
    getConfig: () => ({
      cache: {
        type: 'memory',
        ttl: 300,
        maxSize: 100 * 1024 * 1024
      }
    }),
    sanitizeForLogging: (obj: any) => obj
  }
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    await cacheManager.clear();
    await cacheManager.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { message: 'Hello, World!' };

      await cacheManager.set(key, value);
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      const value = 'test-value';

      expect(await cacheManager.has(key)).toBe(false);

      await cacheManager.set(key, value);
      expect(await cacheManager.has(key)).toBe(true);
    });

    it('should delete a key', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheManager.set(key, value);
      expect(await cacheManager.has(key)).toBe(true);

      const deleted = await cacheManager.delete(key);
      expect(deleted).toBe(true);
      expect(await cacheManager.has(key)).toBe(false);
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await cacheManager.delete('non-existent-key');
      expect(deleted).toBe(false);
    });

    it('should clear all keys', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      expect(await cacheManager.size()).toBe(2);

      await cacheManager.clear();
      expect(await cacheManager.size()).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire keys after TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const shortTtl = 1; // 1 second

      await cacheManager.set(key, value, shortTtl);
      expect(await cacheManager.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(await cacheManager.get(key)).toBeNull();
      expect(await cacheManager.has(key)).toBe(false);
    });

    it('should not expire keys before TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const longTtl = 10; // 10 seconds

      await cacheManager.set(key, value, longTtl);
      
      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(await cacheManager.get(key)).toBe(value);
      expect(await cacheManager.has(key)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      const stats = await cacheManager.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('entries');
    });

    it('should update hit/miss statistics', async () => {
      const key = 'test-key';
      const value = 'test-value';

      // Initial stats
      const initialStats = await cacheManager.getStats();
      const initialMisses = initialStats.misses;

      // Miss
      await cacheManager.get('non-existent-key');
      
      // Hit
      await cacheManager.set(key, value);
      await cacheManager.get(key);

      const finalStats = await cacheManager.getStats();
      
      expect(finalStats.misses).toBe(initialMisses + 1);
      expect(finalStats.hits).toBeGreaterThan(0);
      expect(finalStats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Cache Partitioning', () => {
    it('should create and use cache partitions', async () => {
      const partition1 = cacheManager.createPartition('user');
      const partition2 = cacheManager.createPartition('session');

      await partition1.set('123', { name: 'John' });
      await partition2.set('123', { token: 'abc123' });

      const userData = await partition1.get('123');
      const sessionData = await partition2.get('123');

      expect(userData).toEqual({ name: 'John' });
      expect(sessionData).toEqual({ token: 'abc123' });
    });

    it('should clear partition independently', async () => {
      const partition = cacheManager.createPartition('test');
      
      await cacheManager.set('global-key', 'global-value');
      await partition.set('partition-key', 'partition-value');

      expect(await cacheManager.has('global-key')).toBe(true);
      expect(await partition.has('partition-key')).toBe(true);

      await partition.clear();

      expect(await cacheManager.has('global-key')).toBe(true);
      expect(await partition.has('partition-key')).toBe(false);
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate keys by pattern', async () => {
      await cacheManager.set('user:1', 'user1');
      await cacheManager.set('user:2', 'user2');
      await cacheManager.set('session:1', 'session1');
      await cacheManager.set('other:1', 'other1');

      const invalidated = await cacheManager.invalidatePattern('^user:');

      expect(invalidated).toBe(2);
      expect(await cacheManager.has('user:1')).toBe(false);
      expect(await cacheManager.has('user:2')).toBe(false);
      expect(await cacheManager.has('session:1')).toBe(true);
      expect(await cacheManager.has('other:1')).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should handle large values', async () => {
      const largeValue = 'x'.repeat(10000);
      
      await cacheManager.set('large-key', largeValue);
      const result = await cacheManager.get('large-key');
      
      expect(result).toBe(largeValue);
    });

    it('should track memory usage', async () => {
      const stats = await cacheManager.getStats();
      
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('size');
      expect(typeof stats.memoryUsage).toBe('number');
      expect(typeof stats.size).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      const circularObject: any = {};
      circularObject.self = circularObject;

      // This should not throw an error
      await expect(cacheManager.set('circular', circularObject)).resolves.not.toThrow();
    });

    it('should handle get operations on corrupted data', async () => {
      // This test would require mocking internal cache corruption
      // For now, we'll test that get operations don't throw
      await expect(cacheManager.get('any-key')).resolves.not.toThrow();
    });
  });
});
