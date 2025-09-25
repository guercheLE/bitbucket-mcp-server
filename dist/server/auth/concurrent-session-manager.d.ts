/**
 * Concurrent Session Manager for Bitbucket MCP Server
 *
 * This module provides concurrent session management functionality,
 * handling multiple simultaneous sessions per user with proper
 * synchronization, conflict resolution, and resource management.
 *
 * Key Features:
 * - Concurrent session handling and synchronization
 * - Session conflict resolution and merging
 * - Resource locking and deadlock prevention
 * - Session priority and queuing
 * - Performance monitoring and optimization
 *
 * Constitutional Requirements:
 * - Thread-safe operations
 * - Performance optimization
 * - Comprehensive error handling
 * - Resource management
 */
import { EventEmitter } from 'events';
import { AuthenticationResponse } from '../../types/auth';
/**
 * Concurrent Session Configuration
 */
export interface ConcurrentSessionConfig {
    /** Maximum concurrent sessions per user */
    maxConcurrentSessions: number;
    /** Session conflict resolution strategy */
    conflictResolution: 'latest-wins' | 'merge' | 'queue' | 'reject';
    /** Session priority levels */
    priorityLevels: {
        admin: number;
        user: number;
        guest: number;
    };
    /** Resource lock timeout in milliseconds */
    lockTimeout: number;
    /** Session queue timeout in milliseconds */
    queueTimeout: number;
    /** Whether to enable session merging */
    enableSessionMerging: boolean;
    /** Maximum session merge attempts */
    maxMergeAttempts: number;
}
/**
 * Session Lock Information
 */
export interface SessionLock {
    /** Lock ID */
    lockId: string;
    /** Session ID */
    sessionId: string;
    /** User ID */
    userId: string;
    /** Lock timestamp */
    timestamp: Date;
    /** Lock timeout */
    timeout: Date;
    /** Lock type */
    type: 'read' | 'write' | 'exclusive';
}
/**
 * Session Conflict Information
 */
export interface SessionConflict {
    /** Conflict ID */
    conflictId: string;
    /** Conflicting session IDs */
    conflictingSessions: string[];
    /** Conflict type */
    type: 'concurrent-modification' | 'resource-lock' | 'priority-conflict';
    /** Conflict timestamp */
    timestamp: Date;
    /** Resolution strategy */
    resolution: string;
}
/**
 * Concurrent Session Manager Class
 * Manages concurrent sessions with proper synchronization
 */
export declare class ConcurrentSessionManager extends EventEmitter {
    private config;
    private sessionLocks;
    private sessionQueues;
    private sessionMutexes;
    private conflicts;
    private statistics;
    constructor(config: ConcurrentSessionConfig);
    /**
     * Acquire session lock
     */
    acquireSessionLock(sessionId: string, userId: string, lockType?: 'read' | 'write' | 'exclusive'): Promise<AuthenticationResponse<SessionLock>>;
    /**
     * Release session lock
     */
    releaseSessionLock(sessionId: string, lockId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Check if session is locked
     */
    isSessionLocked(sessionId: string): boolean;
    /**
     * Get session lock information
     */
    getSessionLock(sessionId: string): SessionLock | null;
    /**
     * Handle session conflict
     */
    handleSessionConflict(sessionId: string, conflictingSessions: string[], conflictType: SessionConflict['type']): Promise<AuthenticationResponse<SessionConflict>>;
    /**
     * Resolve session conflict based on strategy
     */
    private resolveConflict;
    /**
     * Resolve conflict using latest-wins strategy
     */
    private resolveLatestWins;
    /**
     * Resolve conflict using merge strategy
     */
    private resolveMerge;
    /**
     * Resolve conflict using queue strategy
     */
    private resolveQueue;
    /**
     * Resolve conflict using reject strategy
     */
    private resolveReject;
    /**
     * Merge multiple sessions
     */
    private mergeSessions;
    /**
     * Add session to queue
     */
    addSessionToQueue(sessionId: string, userId: string): Promise<AuthenticationResponse<void>>;
    /**
     * Process session queue
     */
    processSessionQueue(userId: string): Promise<AuthenticationResponse<string[]>>;
    /**
     * Get concurrent session statistics
     */
    getStatistics(): {
        totalLocks: number;
        totalConflicts: number;
        resolvedConflicts: number;
        averageLockTime: number;
        averageQueueTime: number;
        activeLocks: number;
        activeQueues: number;
    };
    /**
     * Get active locks
     */
    getActiveLocks(): SessionLock[];
    /**
     * Get active queues
     */
    getActiveQueues(): Record<string, string[]>;
    /**
     * Clean up expired locks
     */
    cleanupExpiredLocks(): Promise<number>;
    /**
     * Clean up empty queues
     */
    cleanupEmptyQueues(): Promise<number>;
    private generateLockId;
    private generateConflictId;
    private generateRequestId;
}
//# sourceMappingURL=concurrent-session-manager.d.ts.map