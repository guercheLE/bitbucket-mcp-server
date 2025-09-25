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
export declare class SessionManager {
    /** Active sessions map */
    private static sessions;
    /** Session creation counter */
    private static sessionCounter;
    /**
     * Create a new client session
     */
    static createSession(clientId: string, transport: {
        type: 'stdio' | 'websocket' | 'http';
        endpoint?: string;
    }): Promise<ClientSession>;
    /**
     * Get a session by ID
     */
    static getSession(sessionId: string): ClientSession | undefined;
    /**
     * Update session activity
     */
    static updateActivity(sessionId: string): void;
    /**
     * Authenticate a session
     */
    static authenticateSession(sessionId: string, authData?: any): Promise<void>;
    /**
     * Remove a session
     */
    static removeSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Get all active sessions
     */
    static getActiveSessions(): ClientSession[];
    /**
     * Get session count
     */
    static getSessionCount(): number;
    /**
     * Cleanup expired sessions
     */
    static cleanupExpiredSessions(maxIdleTime?: number): number;
    /**
     * Get session statistics
     */
    static getStats(): {
        activeSessions: number;
        totalSessions: number;
        averageSessionAge: number;
    };
    /**
     * Shutdown session manager
     */
    static shutdown(): Promise<void>;
}
export default SessionManager;
//# sourceMappingURL=client-session.d.ts.map