/**
 * Client Session Management
 * 
 * Manages client sessions for the MCP server, providing session lifecycle
 * management, authentication, and state tracking.
 * 
 * Key Features:
 * - Session creation and management
 * - Authentication state tracking
 * - Session cleanup and expiry
 * - Static session management
 * 
 * Constitutional Requirements:
 * - MCP Protocol First
 * - Authentication integration
 * - Memory efficiency
 * - Error handling
 */

import { ClientSession } from '../types/index.js';

/**
 * Session Manager
 * Static class for managing all client sessions
 */
export class SessionManager {
    /** Active sessions map */
    private static sessions: Map<string, ClientSession> = new Map();

    /** Session creation counter */
    private static sessionCounter: number = 0;

    /**
     * Create a new client session
     */
    static async createSession(
        clientId: string,
        transport: {
            type: 'stdio' | 'websocket' | 'http';
            endpoint?: string;
        }
    ): Promise<ClientSession> {
        const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;

        const session: ClientSession = {
            id: sessionId,
            transport,
            connectedAt: new Date(),
            lastActivity: new Date(),
            metadata: {
                clientId,
                authenticated: false
            }
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    /**
     * Get a session by ID
     */
    static getSession(sessionId: string): ClientSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Update session activity
     */
    static updateActivity(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
    }

    /**
     * Authenticate a session
     */
    static async authenticateSession(
        sessionId: string,
        authData?: any
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Update session metadata with authentication info
        session.metadata.authenticated = true;
        if (authData) {
            session.metadata.authData = authData;
        }

        this.updateActivity(sessionId);
    }

    /**
     * Remove a session
     */
    static async removeSession(
        sessionId: string,
        reason: string = 'client_request'
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Log session removal
            console.log(`Removing session ${sessionId}: ${reason}`);
            this.sessions.delete(sessionId);
        }
    }

    /**
     * Get all active sessions
     */
    static getActiveSessions(): ClientSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get session count
     */
    static getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Cleanup expired sessions
     */
    static cleanupExpiredSessions(maxIdleTime: number = 300000): number {
        const now = new Date();
        let cleaned = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            const idleTime = now.getTime() - session.lastActivity.getTime();
            if (idleTime > maxIdleTime) {
                this.sessions.delete(sessionId);
                cleaned++;
                console.log(`Cleaned up expired session: ${sessionId}`);
            }
        }

        return cleaned;
    }

    /**
     * Get session statistics
     */
    static getStats(): {
        activeSessions: number;
        totalSessions: number;
        averageSessionAge: number;
    } {
        const sessions = Array.from(this.sessions.values());
        const now = new Date();

        const averageAge = sessions.length > 0
            ? sessions.reduce((sum, session) => {
                return sum + (now.getTime() - session.connectedAt.getTime());
            }, 0) / sessions.length
            : 0;

        return {
            activeSessions: sessions.length,
            totalSessions: this.sessionCounter,
            averageSessionAge: averageAge
        };
    }

    /**
     * Shutdown session manager
     */
    static async shutdown(): Promise<void> {
        const sessionCount = this.sessions.size;
        this.sessions.clear();
        this.sessionCounter = 0;
        console.log(`Session manager shutdown. Cleaned ${sessionCount} sessions.`);
    }
}

export default SessionManager;