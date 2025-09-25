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
/**
 * Session Manager
 * Static class for managing all client sessions
 */
export class SessionManager {
    /** Active sessions map */
    static sessions = new Map();
    /** Session creation counter */
    static sessionCounter = 0;
    /**
     * Create a new client session
     */
    static async createSession(clientId, transport) {
        const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;
        const session = {
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
    static getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Update session activity
     */
    static updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
        }
    }
    /**
     * Authenticate a session
     */
    static async authenticateSession(sessionId, authData) {
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
    static async removeSession(sessionId, reason = 'client_request') {
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
    static getActiveSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Get session count
     */
    static getSessionCount() {
        return this.sessions.size;
    }
    /**
     * Cleanup expired sessions
     */
    static cleanupExpiredSessions(maxIdleTime = 300000) {
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
    static getStats() {
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
    static async shutdown() {
        const sessionCount = this.sessions.size;
        this.sessions.clear();
        this.sessionCounter = 0;
        console.log(`Session manager shutdown. Cleaned ${sessionCount} sessions.`);
    }
}
export default SessionManager;
//# sourceMappingURL=client-session.js.map