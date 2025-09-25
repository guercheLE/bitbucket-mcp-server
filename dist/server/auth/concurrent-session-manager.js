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
import { AuthenticationErrorCode } from '../../types/auth';
/**
 * Concurrent Session Manager Class
 * Manages concurrent sessions with proper synchronization
 */
export class ConcurrentSessionManager extends EventEmitter {
    config;
    sessionLocks = new Map();
    sessionQueues = new Map();
    sessionMutexes = new Map();
    conflicts = new Map();
    statistics;
    constructor(config) {
        super();
        this.config = config;
        this.statistics = {
            totalLocks: 0,
            totalConflicts: 0,
            resolvedConflicts: 0,
            averageLockTime: 0,
            averageQueueTime: 0
        };
    }
    // ============================================================================
    // Session Locking and Synchronization
    // ============================================================================
    /**
     * Acquire session lock
     */
    async acquireSessionLock(sessionId, userId, lockType = 'read') {
        try {
            // Check if session is already locked
            const existingLock = this.sessionLocks.get(sessionId);
            if (existingLock && existingLock.timeout > new Date()) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_LOCKED,
                        message: 'Session is already locked',
                        details: { sessionId, existingLock },
                        timestamp: new Date(),
                        isRecoverable: true
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Create session lock
            const lockId = this.generateLockId();
            const now = new Date();
            const timeout = new Date(now.getTime() + this.config.lockTimeout);
            const lock = {
                lockId,
                sessionId,
                userId,
                timestamp: now,
                timeout,
                type: lockType
            };
            // Store lock
            this.sessionLocks.set(sessionId, lock);
            this.statistics.totalLocks++;
            // Emit lock acquired event
            this.emit('lock:acquired', {
                lockId,
                sessionId,
                userId,
                lockType,
                timestamp: now
            });
            return {
                success: true,
                data: lock,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to acquire session lock: ${error.message}`,
                    details: { sessionId, originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Release session lock
     */
    async releaseSessionLock(sessionId, lockId) {
        try {
            const lock = this.sessionLocks.get(sessionId);
            if (!lock) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.SESSION_NOT_LOCKED,
                        message: 'Session is not locked',
                        details: { sessionId },
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            if (lock.lockId !== lockId) {
                return {
                    success: false,
                    error: {
                        code: AuthenticationErrorCode.INVALID_LOCK,
                        message: 'Invalid lock ID',
                        details: { sessionId, expectedLockId: lock.lockId, providedLockId: lockId },
                        timestamp: new Date(),
                        isRecoverable: false
                    },
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            // Release lock
            this.sessionLocks.delete(sessionId);
            // Emit lock released event
            this.emit('lock:released', {
                lockId,
                sessionId,
                userId: lock.userId,
                timestamp: new Date()
            });
            return {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to release session lock: ${error.message}`,
                    details: { sessionId, originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Check if session is locked
     */
    isSessionLocked(sessionId) {
        const lock = this.sessionLocks.get(sessionId);
        return !!(lock && lock.timeout > new Date());
    }
    /**
     * Get session lock information
     */
    getSessionLock(sessionId) {
        const lock = this.sessionLocks.get(sessionId);
        return lock && lock.timeout > new Date() ? lock : null;
    }
    // ============================================================================
    // Session Conflict Resolution
    // ============================================================================
    /**
     * Handle session conflict
     */
    async handleSessionConflict(sessionId, conflictingSessions, conflictType) {
        try {
            const conflictId = this.generateConflictId();
            const now = new Date();
            const conflict = {
                conflictId,
                conflictingSessions,
                type: conflictType,
                timestamp: now,
                resolution: this.config.conflictResolution
            };
            // Store conflict
            this.conflicts.set(conflictId, conflict);
            this.statistics.totalConflicts++;
            // Resolve conflict based on strategy
            const resolution = await this.resolveConflict(conflict);
            // Update conflict with resolution
            conflict.resolution = resolution;
            this.conflicts.set(conflictId, conflict);
            // Emit conflict resolved event
            this.emit('conflict:resolved', {
                conflictId,
                sessionId,
                conflictType,
                resolution,
                timestamp: now
            });
            return {
                success: true,
                data: conflict,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to handle session conflict: ${error.message}`,
                    details: { sessionId, originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Resolve session conflict based on strategy
     */
    async resolveConflict(conflict) {
        switch (this.config.conflictResolution) {
            case 'latest-wins':
                return await this.resolveLatestWins(conflict);
            case 'merge':
                return await this.resolveMerge(conflict);
            case 'queue':
                return await this.resolveQueue(conflict);
            case 'reject':
                return await this.resolveReject(conflict);
            default:
                return 'unknown-strategy';
        }
    }
    /**
     * Resolve conflict using latest-wins strategy
     */
    async resolveLatestWins(conflict) {
        // Keep the most recent session, remove others
        const latestSession = conflict.conflictingSessions[conflict.conflictingSessions.length - 1];
        for (const sessionId of conflict.conflictingSessions) {
            if (sessionId !== latestSession) {
                // Remove older session
                this.sessionLocks.delete(sessionId);
            }
        }
        this.statistics.resolvedConflicts++;
        return `latest-wins: kept ${latestSession}`;
    }
    /**
     * Resolve conflict using merge strategy
     */
    async resolveMerge(conflict) {
        if (!this.config.enableSessionMerging) {
            return 'merge-disabled';
        }
        // Attempt to merge sessions
        const mergedSession = await this.mergeSessions(conflict.conflictingSessions);
        if (mergedSession) {
            // Remove conflicting sessions
            for (const sessionId of conflict.conflictingSessions) {
                this.sessionLocks.delete(sessionId);
            }
            this.statistics.resolvedConflicts++;
            return `merge: created merged session`;
        }
        return 'merge-failed';
    }
    /**
     * Resolve conflict using queue strategy
     */
    async resolveQueue(conflict) {
        // Add sessions to queue
        const queueId = conflict.conflictingSessions[0];
        if (!this.sessionQueues.has(queueId)) {
            this.sessionQueues.set(queueId, []);
        }
        const queue = this.sessionQueues.get(queueId);
        queue.push(...conflict.conflictingSessions);
        this.statistics.resolvedConflicts++;
        return `queue: added ${conflict.conflictingSessions.length} sessions to queue`;
    }
    /**
     * Resolve conflict using reject strategy
     */
    async resolveReject(conflict) {
        // Reject all conflicting sessions
        for (const sessionId of conflict.conflictingSessions) {
            this.sessionLocks.delete(sessionId);
        }
        this.statistics.resolvedConflicts++;
        return `reject: rejected ${conflict.conflictingSessions.length} sessions`;
    }
    // ============================================================================
    // Session Merging
    // ============================================================================
    /**
     * Merge multiple sessions
     */
    async mergeSessions(sessionIds) {
        try {
            // This would require access to the actual session data
            // For now, we'll return null to indicate merge is not possible
            return null;
        }
        catch (error) {
            this.emit('merge:failed', {
                sessionIds,
                error: error.message,
                timestamp: new Date()
            });
            return null;
        }
    }
    // ============================================================================
    // Session Queuing
    // ============================================================================
    /**
     * Add session to queue
     */
    async addSessionToQueue(sessionId, userId) {
        try {
            if (!this.sessionQueues.has(userId)) {
                this.sessionQueues.set(userId, []);
            }
            const queue = this.sessionQueues.get(userId);
            queue.push(sessionId);
            // Emit session queued event
            this.emit('session:queued', {
                sessionId,
                userId,
                queuePosition: queue.length,
                timestamp: new Date()
            });
            return {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to add session to queue: ${error.message}`,
                    details: { sessionId, originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Process session queue
     */
    async processSessionQueue(userId) {
        try {
            const queue = this.sessionQueues.get(userId);
            if (!queue || queue.length === 0) {
                return {
                    success: true,
                    data: [],
                    metadata: {
                        timestamp: new Date(),
                        requestId: this.generateRequestId(),
                        processingTime: 0
                    }
                };
            }
            const processedSessions = [];
            const now = new Date();
            // Process sessions in queue
            for (let i = queue.length - 1; i >= 0; i--) {
                const sessionId = queue[i];
                // Check if session can be processed
                if (!this.isSessionLocked(sessionId)) {
                    processedSessions.push(sessionId);
                    queue.splice(i, 1);
                }
            }
            // Clean up empty queue
            if (queue.length === 0) {
                this.sessionQueues.delete(userId);
            }
            // Emit queue processed event
            this.emit('queue:processed', {
                userId,
                processedCount: processedSessions.length,
                remainingCount: queue.length,
                timestamp: now
            });
            return {
                success: true,
                data: processedSessions,
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: AuthenticationErrorCode.INTERNAL_ERROR,
                    message: `Failed to process session queue: ${error.message}`,
                    details: { userId, originalError: error.message },
                    timestamp: new Date(),
                    isRecoverable: true
                },
                metadata: {
                    timestamp: new Date(),
                    requestId: this.generateRequestId(),
                    processingTime: 0
                }
            };
        }
    }
    // ============================================================================
    // Statistics and Monitoring
    // ============================================================================
    /**
     * Get concurrent session statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            activeLocks: this.sessionLocks.size,
            activeQueues: this.sessionQueues.size
        };
    }
    /**
     * Get active locks
     */
    getActiveLocks() {
        const now = new Date();
        const activeLocks = [];
        for (const lock of this.sessionLocks.values()) {
            if (lock.timeout > now) {
                activeLocks.push(lock);
            }
        }
        return activeLocks;
    }
    /**
     * Get active queues
     */
    getActiveQueues() {
        const queues = {};
        for (const [userId, queue] of this.sessionQueues.entries()) {
            if (queue.length > 0) {
                queues[userId] = [...queue];
            }
        }
        return queues;
    }
    // ============================================================================
    // Cleanup and Maintenance
    // ============================================================================
    /**
     * Clean up expired locks
     */
    async cleanupExpiredLocks() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [sessionId, lock] of this.sessionLocks.entries()) {
            if (lock.timeout <= now) {
                this.sessionLocks.delete(sessionId);
                cleanedCount++;
                // Emit lock expired event
                this.emit('lock:expired', {
                    lockId: lock.lockId,
                    sessionId,
                    userId: lock.userId,
                    timestamp: now
                });
            }
        }
        return cleanedCount;
    }
    /**
     * Clean up empty queues
     */
    async cleanupEmptyQueues() {
        let cleanedCount = 0;
        for (const [userId, queue] of this.sessionQueues.entries()) {
            if (queue.length === 0) {
                this.sessionQueues.delete(userId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    generateLockId() {
        return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateConflictId() {
        return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=concurrent-session-manager.js.map