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
/**
 * Rate Limiting Algorithms
 * Different algorithms for rate limiting
 */
export declare enum RateLimitAlgorithm {
    TOKEN_BUCKET = "token_bucket",
    SLIDING_WINDOW = "sliding_window",
    FIXED_WINDOW = "fixed_window",
    ADAPTIVE = "adaptive"
}
/**
 * Rate Limit Scope
 * Scope for rate limiting (per user, per IP, global)
 */
export declare enum RateLimitScope {
    GLOBAL = "global",
    PER_USER = "per_user",
    PER_IP = "per_ip",
    PER_SESSION = "per_session"
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
 * Rate Limiter
 * Main rate limiting service
 */
export declare class RateLimiter extends EventEmitter {
    private rules;
    private buckets;
    private slidingWindows;
    private fixedWindows;
    private blockedIdentifiers;
    private stats;
    private systemLoad;
    constructor();
    /**
     * Add a rate limiting rule
     */
    addRule(rule: RateLimitRule): void;
    /**
     * Remove a rate limiting rule
     */
    removeRule(ruleId: string): void;
    /**
     * Check if request is allowed
     */
    checkRateLimit(identifier: string, context?: {
        userId?: string;
        sessionId?: string;
        sourceIp?: string;
        userAgent?: string;
    }): Promise<RateLimitResult>;
    /**
     * Get rate limit statistics
     */
    getStats(): RateLimitStats;
    /**
     * Get blocked identifiers
     */
    getBlockedIdentifiers(): Array<{
        identifier: string;
        unblockTime: Date;
    }>;
    /**
     * Manually block an identifier
     */
    blockIdentifier(identifier: string, durationMs: number): void;
    /**
     * Manually unblock an identifier
     */
    unblockIdentifier(identifier: string): void;
    /**
     * Clean up expired data
     */
    cleanup(): Promise<number>;
    /**
     * Destroy the rate limiter
     */
    destroy(): void;
    private setupDefaultRules;
    private applyRule;
    private findApplicableRules;
    private ruleApplies;
    private generateKey;
    private createAllowedResult;
    private createBlockedResult;
    private isBlacklisted;
    private isWhitelisted;
    private isBlocked;
    private updateRequestStats;
    private updateStats;
    private estimateMemoryUsage;
    private cleanupRuleData;
    private setupCleanupInterval;
    private setupSystemLoadMonitoring;
}
/**
 * Default rate limiter instance
 */
export declare const defaultRateLimiter: RateLimiter;
/**
 * Factory function for creating rate limiters
 */
export declare function createRateLimiter(): RateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map