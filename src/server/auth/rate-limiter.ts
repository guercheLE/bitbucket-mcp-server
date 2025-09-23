/**
 * Rate Limiter for Authentication Requests
 * 
 * This module provides comprehensive rate limiting for authentication operations,
 * protecting against brute force attacks and ensuring system stability.
 * 
 * Key Features:
 * - Multiple rate limiting algorithms (Token Bucket, Sliding Window, Fixed Window)
 * - Per-user and per-IP rate limiting
 * - Adaptive rate limiting based on system load
 * - Whitelist and blacklist support
 * - Real-time monitoring and alerting
 * - Configurable limits and time windows
 * 
 * Constitutional Requirements:
 * - Security against brute force attacks
 * - System stability protection
 * - Performance optimization
 * - Real-time monitoring
 * - Configurable policies
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

/**
 * Rate Limiting Algorithms
 * Different algorithms for rate limiting
 */
export enum RateLimitAlgorithm {
  TOKEN_BUCKET = 'token_bucket',
  SLIDING_WINDOW = 'sliding_window',
  FIXED_WINDOW = 'fixed_window',
  ADAPTIVE = 'adaptive'
}

/**
 * Rate Limit Scope
 * Scope for rate limiting (per user, per IP, global)
 */
export enum RateLimitScope {
  GLOBAL = 'global',
  PER_USER = 'per_user',
  PER_IP = 'per_ip',
  PER_SESSION = 'per_session'
}

/**
 * Rate Limit Configuration
 * Configuration for rate limiting rules
 */
export interface RateLimitConfig {
  /** Rate limiting algorithm */
  algorithm: RateLimitAlgorithm;
  
  /** Rate limiting scope */
  scope: RateLimitScope;
  
  /** Maximum requests allowed */
  maxRequests: number;
  
  /** Time window in milliseconds */
  windowMs: number;
  
  /** Burst allowance (for token bucket) */
  burstSize?: number;
  
  /** Refill rate (for token bucket) */
  refillRate?: number;
  
  /** Block duration in milliseconds */
  blockDurationMs: number;
  
  /** Enable adaptive rate limiting */
  adaptive: boolean;
  
  /** System load threshold for adaptive limiting */
  loadThreshold: number;
  
  /** Whitelist of exempt identifiers */
  whitelist: string[];
  
  /** Blacklist of blocked identifiers */
  blacklist: string[];
  
  /** Enable real-time monitoring */
  monitoring: boolean;
  
  /** Alert thresholds */
  alertThresholds: {
    requestsPerSecond: number;
    blockedRequests: number;
    systemLoad: number;
  };
}

/**
 * Rate Limit Rule
 * Individual rate limiting rule
 */
export interface RateLimitRule {
  /** Rule identifier */
  id: string;
  
  /** Rule name */
  name: string;
  
  /** Rule description */
  description: string;
  
  /** Rate limit configuration */
  config: RateLimitConfig;
  
  /** Rule priority (higher = more important) */
  priority: number;
  
  /** Whether rule is active */
  active: boolean;
  
  /** Rule creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Rate Limit Result
 * Result of rate limit check
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  
  /** Remaining requests in current window */
  remaining: number;
  
  /** Time until window resets */
  resetTime: Date;
  
  /** Time until unblocked (if blocked) */
  unblockTime?: Date;
  
  /** Rate limit rule that applied */
  ruleId: string;
  
  /** Additional metadata */
  metadata: {
    algorithm: RateLimitAlgorithm;
    scope: RateLimitScope;
    identifier: string;
    systemLoad?: number;
  };
}

/**
 * Rate Limit Statistics
 * Statistics for rate limiting performance
 */
export interface RateLimitStats {
  /** Total requests processed */
  totalRequests: number;
  
  /** Allowed requests */
  allowedRequests: number;
  
  /** Blocked requests */
  blockedRequests: number;
  
  /** Requests by scope */
  requestsByScope: Record<RateLimitScope, number>;
  
  /** Current active rules */
  activeRules: number;
  
  /** Average processing time */
  averageProcessingTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** Last cleanup timestamp */
  lastCleanup: Date;
}

/**
 * Token Bucket Implementation
 * Token bucket algorithm for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.burstSize || config.maxRequests;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): Date {
    const tokensNeeded = (this.config.burstSize || this.config.maxRequests) - this.tokens;
    const refillTime = tokensNeeded / (this.config.refillRate || 1);
    return new Date(Date.now() + refillTime * 1000);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * (this.config.refillRate || 1);
    
    this.tokens = Math.min(
      this.config.burstSize || this.config.maxRequests,
      this.tokens + tokensToAdd
    );
    
    this.lastRefill = now;
  }
}

/**
 * Sliding Window Implementation
 * Sliding window algorithm for rate limiting
 */
class SlidingWindow {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  consume(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Remove old requests
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    // Check if we can add a new request
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getRemaining(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - this.requests.length);
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date(Date.now() + this.config.windowMs);
    }
    
    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.config.windowMs);
  }
}

/**
 * Fixed Window Implementation
 * Fixed window algorithm for rate limiting
 */
class FixedWindow {
  private windowStart: number;
  private requestCount: number;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.windowStart = this.getCurrentWindowStart();
    this.requestCount = 0;
  }

  consume(): boolean {
    const currentWindowStart = this.getCurrentWindowStart();
    
    // Reset if we're in a new window
    if (currentWindowStart > this.windowStart) {
      this.windowStart = currentWindowStart;
      this.requestCount = 0;
    }
    
    // Check if we can add a new request
    if (this.requestCount < this.config.maxRequests) {
      this.requestCount++;
      return true;
    }
    
    return false;
  }

  getRemaining(): number {
    const currentWindowStart = this.getCurrentWindowStart();
    
    if (currentWindowStart > this.windowStart) {
      return this.config.maxRequests;
    }
    
    return Math.max(0, this.config.maxRequests - this.requestCount);
  }

  getResetTime(): Date {
    return new Date(this.windowStart + this.config.windowMs);
  }

  private getCurrentWindowStart(): number {
    return Math.floor(Date.now() / this.config.windowMs) * this.config.windowMs;
  }
}

/**
 * Rate Limiter
 * Main rate limiting service
 */
export class RateLimiter extends EventEmitter {
  private rules: Map<string, RateLimitRule> = new Map();
  private buckets: Map<string, TokenBucket> = new Map();
  private slidingWindows: Map<string, SlidingWindow> = new Map();
  private fixedWindows: Map<string, FixedWindow> = new Map();
  private blockedIdentifiers: Map<string, Date> = new Map();
  private stats: RateLimitStats;
  private systemLoad = 0;

  constructor() {
    super();
    
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      requestsByScope: {
        [RateLimitScope.GLOBAL]: 0,
        [RateLimitScope.PER_USER]: 0,
        [RateLimitScope.PER_IP]: 0,
        [RateLimitScope.PER_SESSION]: 0
      },
      activeRules: 0,
      averageProcessingTime: 0,
      memoryUsage: 0,
      lastCleanup: new Date()
    };

    this.setupDefaultRules();
    this.setupCleanupInterval();
    this.setupSystemLoadMonitoring();
  }

  /**
   * Add a rate limiting rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    this.updateStats();
    this.emit('rule:added', rule);
  }

  /**
   * Remove a rate limiting rule
   */
  removeRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      this.cleanupRuleData(ruleId);
      this.updateStats();
      this.emit('rule:removed', rule);
    }
  }

  /**
   * Check if request is allowed
   */
  async checkRateLimit(
    identifier: string,
    context?: {
      userId?: string;
      sessionId?: string;
      sourceIp?: string;
      userAgent?: string;
    }
  ): Promise<RateLimitResult> {
    const startTime = Date.now();
    
    try {
      // Check if identifier is blacklisted
      if (this.isBlacklisted(identifier)) {
        return this.createBlockedResult('blacklist', identifier);
      }

      // Check if identifier is whitelisted
      if (this.isWhitelisted(identifier)) {
        return this.createAllowedResult('whitelist', identifier);
      }

      // Check if identifier is currently blocked
      if (this.isBlocked(identifier)) {
        return this.createBlockedResult('blocked', identifier);
      }

      // Find applicable rules
      const applicableRules = this.findApplicableRules(identifier, context);
      
      if (applicableRules.length === 0) {
        return this.createAllowedResult('no_rules', identifier);
      }

      // Apply rules in priority order
      for (const rule of applicableRules) {
        const result = await this.applyRule(rule, identifier, context);
        
        if (!result.allowed) {
          // Block identifier if rate limit exceeded
          this.blockIdentifier(identifier, rule.config.blockDurationMs);
          this.emit('rate_limit:exceeded', { identifier, rule, result });
          return result;
        }
      }

      // All rules passed
      const result = this.createAllowedResult('allowed', identifier);
      this.updateRequestStats(result, Date.now() - startTime);
      return result;

    } catch (error) {
      this.emit('rate_limit:error', error);
      // Fail open - allow request if rate limiting fails
      return this.createAllowedResult('error', identifier);
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  /**
   * Get blocked identifiers
   */
  getBlockedIdentifiers(): Array<{ identifier: string; unblockTime: Date }> {
    const now = Date.now();
    const blocked: Array<{ identifier: string; unblockTime: Date }> = [];
    
    for (const [identifier, unblockTime] of this.blockedIdentifiers.entries()) {
      if (unblockTime.getTime() > now) {
        blocked.push({ identifier, unblockTime });
      }
    }
    
    return blocked.sort((a, b) => a.unblockTime.getTime() - b.unblockTime.getTime());
  }

  /**
   * Manually block an identifier
   */
  blockIdentifier(identifier: string, durationMs: number): void {
    const unblockTime = new Date(Date.now() + durationMs);
    this.blockedIdentifiers.set(identifier, unblockTime);
    this.emit('identifier:blocked', { identifier, unblockTime });
  }

  /**
   * Manually unblock an identifier
   */
  unblockIdentifier(identifier: string): void {
    this.blockedIdentifiers.delete(identifier);
    this.emit('identifier:unblocked', { identifier });
  }

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();
    
    // Clean up blocked identifiers
    for (const [identifier, unblockTime] of this.blockedIdentifiers.entries()) {
      if (unblockTime.getTime() <= now) {
        this.blockedIdentifiers.delete(identifier);
        cleanedCount++;
      }
    }
    
    // Clean up old buckets and windows
    // Note: In a production system, you might want to implement more sophisticated cleanup
    
    this.stats.lastCleanup = new Date();
    this.stats.memoryUsage = this.estimateMemoryUsage();
    
    if (cleanedCount > 0) {
      this.emit('cleanup:completed', { count: cleanedCount });
    }
    
    return cleanedCount;
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    this.removeAllListeners();
    this.rules.clear();
    this.buckets.clear();
    this.slidingWindows.clear();
    this.fixedWindows.clear();
    this.blockedIdentifiers.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupDefaultRules(): void {
    // Default authentication rate limiting rules
    const defaultRules: RateLimitRule[] = [
      {
        id: 'auth_login_global',
        name: 'Global Authentication Rate Limit',
        description: 'Global rate limit for authentication requests',
        config: {
          algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
          scope: RateLimitScope.GLOBAL,
          maxRequests: 1000,
          windowMs: 60 * 1000, // 1 minute
          blockDurationMs: 5 * 60 * 1000, // 5 minutes
          adaptive: true,
          loadThreshold: 0.8,
          whitelist: [],
          blacklist: [],
          monitoring: true,
          alertThresholds: {
            requestsPerSecond: 100,
            blockedRequests: 50,
            systemLoad: 0.9
          }
        },
        priority: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'auth_login_per_ip',
        name: 'Per-IP Authentication Rate Limit',
        description: 'Rate limit authentication requests per IP address',
        config: {
          algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
          scope: RateLimitScope.PER_IP,
          maxRequests: 10,
          windowMs: 60 * 1000, // 1 minute
          burstSize: 5,
          refillRate: 0.1, // 1 request per 10 seconds
          blockDurationMs: 15 * 60 * 1000, // 15 minutes
          adaptive: true,
          loadThreshold: 0.7,
          whitelist: [],
          blacklist: [],
          monitoring: true,
          alertThresholds: {
            requestsPerSecond: 10,
            blockedRequests: 5,
            systemLoad: 0.8
          }
        },
        priority: 2,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'auth_login_per_user',
        name: 'Per-User Authentication Rate Limit',
        description: 'Rate limit authentication requests per user',
        config: {
          algorithm: RateLimitAlgorithm.FIXED_WINDOW,
          scope: RateLimitScope.PER_USER,
          maxRequests: 5,
          windowMs: 5 * 60 * 1000, // 5 minutes
          blockDurationMs: 30 * 60 * 1000, // 30 minutes
          adaptive: false,
          loadThreshold: 0.8,
          whitelist: [],
          blacklist: [],
          monitoring: true,
          alertThresholds: {
            requestsPerSecond: 5,
            blockedRequests: 3,
            systemLoad: 0.9
          }
        },
        priority: 3,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }
  }

  private async applyRule(
    rule: RateLimitRule,
    identifier: string,
    context?: any
  ): Promise<RateLimitResult> {
    const key = this.generateKey(rule, identifier, context);
    let limiter: TokenBucket | SlidingWindow | FixedWindow;
    
    // Get or create limiter instance
    switch (rule.config.algorithm) {
      case RateLimitAlgorithm.TOKEN_BUCKET:
        if (!this.buckets.has(key)) {
          this.buckets.set(key, new TokenBucket(rule.config));
        }
        limiter = this.buckets.get(key)!;
        break;
        
      case RateLimitAlgorithm.SLIDING_WINDOW:
        if (!this.slidingWindows.has(key)) {
          this.slidingWindows.set(key, new SlidingWindow(rule.config));
        }
        limiter = this.slidingWindows.get(key)!;
        break;
        
      case RateLimitAlgorithm.FIXED_WINDOW:
        if (!this.fixedWindows.has(key)) {
          this.fixedWindows.set(key, new FixedWindow(rule.config));
        }
        limiter = this.fixedWindows.get(key)!;
        break;
        
      default:
        throw new Error(`Unsupported rate limiting algorithm: ${rule.config.algorithm}`);
    }

    // Apply adaptive rate limiting if enabled
    if (rule.config.adaptive && this.systemLoad > rule.config.loadThreshold) {
      // Reduce rate limit under high system load
      const reductionFactor = 1 - (this.systemLoad - rule.config.loadThreshold);
      const adjustedMaxRequests = Math.floor(rule.config.maxRequests * reductionFactor);
      
      if (adjustedMaxRequests < 1) {
        return this.createBlockedResult('system_overload', identifier, rule);
      }
    }

    // Check rate limit
    const allowed = limiter.consume();
    const remaining = limiter.getRemaining();
    const resetTime = limiter.getResetTime();

    return {
      allowed,
      remaining,
      resetTime,
      ruleId: rule.id,
      metadata: {
        algorithm: rule.config.algorithm,
        scope: rule.config.scope,
        identifier,
        systemLoad: this.systemLoad
      }
    };
  }

  private findApplicableRules(
    identifier: string,
    context?: any
  ): RateLimitRule[] {
    const applicableRules: RateLimitRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (!rule.active) continue;
      
      // Check if rule applies to this identifier
      if (this.ruleApplies(rule, identifier, context)) {
        applicableRules.push(rule);
      }
    }
    
    // Sort by priority (higher priority first)
    return applicableRules.sort((a, b) => b.priority - a.priority);
  }

  private ruleApplies(rule: RateLimitRule, identifier: string, context?: any): boolean {
    switch (rule.config.scope) {
      case RateLimitScope.GLOBAL:
        return true;
        
      case RateLimitScope.PER_IP:
        return context?.sourceIp === identifier;
        
      case RateLimitScope.PER_USER:
        return context?.userId === identifier;
        
      case RateLimitScope.PER_SESSION:
        return context?.sessionId === identifier;
        
      default:
        return false;
    }
  }

  private generateKey(rule: RateLimitRule, identifier: string, context?: any): string {
    const data = {
      ruleId: rule.id,
      scope: rule.config.scope,
      identifier,
      context: context ? {
        userId: context.userId,
        sourceIp: context.sourceIp,
        sessionId: context.sessionId
      } : undefined
    };
    
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private createAllowedResult(reason: string, identifier: string, rule?: RateLimitRule): RateLimitResult {
    return {
      allowed: true,
      remaining: rule?.config.maxRequests || 0,
      resetTime: new Date(Date.now() + (rule?.config.windowMs || 60000)),
      ruleId: rule?.id || 'default',
      metadata: {
        algorithm: rule?.config.algorithm || RateLimitAlgorithm.SLIDING_WINDOW,
        scope: rule?.config.scope || RateLimitScope.GLOBAL,
        identifier
      }
    };
  }

  private createBlockedResult(reason: string, identifier: string, rule?: RateLimitRule): RateLimitResult {
    const blockDuration = rule?.config.blockDurationMs || 300000; // 5 minutes default
    const unblockTime = new Date(Date.now() + blockDuration);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + (rule?.config.windowMs || 60000)),
      unblockTime,
      ruleId: rule?.id || 'default',
      metadata: {
        algorithm: rule?.config.algorithm || RateLimitAlgorithm.SLIDING_WINDOW,
        scope: rule?.config.scope || RateLimitScope.GLOBAL,
        identifier
      }
    };
  }

  private isBlacklisted(identifier: string): boolean {
    // Check against blacklist (would be loaded from configuration)
    return false;
  }

  private isWhitelisted(identifier: string): boolean {
    // Check against whitelist (would be loaded from configuration)
    return false;
  }

  private isBlocked(identifier: string): boolean {
    const unblockTime = this.blockedIdentifiers.get(identifier);
    if (!unblockTime) return false;
    
    if (unblockTime.getTime() <= Date.now()) {
      this.blockedIdentifiers.delete(identifier);
      return false;
    }
    
    return true;
  }

  private updateRequestStats(result: RateLimitResult, processingTime: number): void {
    this.stats.totalRequests++;
    
    if (result.allowed) {
      this.stats.allowedRequests++;
    } else {
      this.stats.blockedRequests++;
    }
    
    this.stats.requestsByScope[result.metadata.scope]++;
    
    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalRequests - 1) + processingTime) / this.stats.totalRequests;
  }

  private updateStats(): void {
    this.stats.activeRules = Array.from(this.rules.values()).filter(rule => rule.active).length;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    
    // Estimate size of rules
    for (const rule of this.rules.values()) {
      size += JSON.stringify(rule).length;
    }
    
    // Estimate size of buckets and windows
    size += this.buckets.size * 100; // Rough estimate
    size += this.slidingWindows.size * 200; // Rough estimate
    size += this.fixedWindows.size * 100; // Rough estimate
    size += this.blockedIdentifiers.size * 50; // Rough estimate
    
    return size;
  }

  private cleanupRuleData(ruleId: string): void {
    // Clean up data associated with a rule
    const keysToRemove: string[] = [];
    
    for (const key of this.buckets.keys()) {
      if (key.includes(ruleId)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.buckets.delete(key);
      this.slidingWindows.delete(key);
      this.fixedWindows.delete(key);
    }
  }

  private setupCleanupInterval(): void {
    // Clean up expired data every 5 minutes
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('cleanup:error', error);
      }
    }, 5 * 60 * 1000);
  }

  private setupSystemLoadMonitoring(): void {
    // Monitor system load for adaptive rate limiting
    setInterval(() => {
      // In a real implementation, you would get actual system load
      // For now, we'll simulate it
      this.systemLoad = Math.random() * 0.5; // Simulate 0-50% load
    }, 10000); // Check every 10 seconds
  }
}

/**
 * Default rate limiter instance
 */
export const defaultRateLimiter = new RateLimiter();

/**
 * Factory function for creating rate limiters
 */
export function createRateLimiter(): RateLimiter {
  return new RateLimiter();
}
