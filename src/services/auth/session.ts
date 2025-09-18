import { 
  UserSession, 
  SessionRequest, 
  SessionResponse, 
  SessionListResponse,
  AuthenticationCredentials,
  CACHE_DURATION
} from '../../types/auth';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

/**
 * Serviço de gerenciamento de sessões com JWT
 */
export class SessionManagementService {
  private sessions = new Map<string, UserSession>();
  private jwtSecret: string;
  private sessionTimeout: number;

  constructor(jwtSecret: string = 'default-secret', sessionTimeout: number = CACHE_DURATION.SESSION) {
    this.jwtSecret = jwtSecret;
    this.sessionTimeout = sessionTimeout;
  }

  /**
   * Cria nova sessão de usuário
   */
  async createSession(request: SessionRequest): Promise<SessionResponse> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTimeout);

    const defaultCredentials: AuthenticationCredentials = {
      type: request.authenticationMethod,
      accessToken: undefined,
      refreshToken: undefined,
      clientId: undefined,
      clientSecret: undefined,
      username: undefined,
      password: undefined,
      token: undefined
    };

    const session: UserSession = {
      sessionId,
      userId: request.userId,
      serverType: request.serverType,
      authenticationMethod: request.authenticationMethod,
      credentials: request.credentials ? { ...defaultCredentials, ...request.credentials } : defaultCredentials,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true
    };

    // Armazenar sessão
    this.sessions.set(sessionId, session);

    // Criar JWT token
    const jwtToken = this.createJwtToken(session);

    return {
      sessionId,
      userId: session.userId,
      serverType: session.serverType,
      authenticationMethod: session.authenticationMethod,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive
    };
  }

  /**
   * Obtém sessão atual por ID
   */
  async getCurrentSession(sessionId: string): Promise<SessionResponse | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Verificar se sessão está expirada
    if (this.isSessionExpired(session)) {
      session.isActive = false;
      return null;
    }

    // Atualizar último acesso
    session.lastAccessedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      serverType: session.serverType,
      authenticationMethod: session.authenticationMethod,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastAccessedAt: session.lastAccessedAt
    };
  }

  /**
   * Lista sessões ativas de um usuário
   */
  async listActiveSessions(userId: number): Promise<SessionListResponse> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId);

    const activeSessions = userSessions.filter(session => 
      session.isActive && !this.isSessionExpired(session)
    );

    const sessions = activeSessions.map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      serverType: session.serverType,
      authenticationMethod: session.authenticationMethod,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastAccessedAt: session.lastAccessedAt
    }));

    return {
      sessions,
      totalCount: userSessions.length,
      activeCount: activeSessions.length
    };
  }

  /**
   * Revoga sessão
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return {
        success: false,
        message: 'Sessão não encontrada'
      };
    }

    if (!session.isActive) {
      return {
        success: false,
        message: 'Sessão já está inativa'
      };
    }

    if (this.isSessionExpired(session)) {
      return {
        success: false,
        message: 'Sessão já expirou'
      };
    }

    // Marcar sessão como inativa
    session.isActive = false;
    this.sessions.set(sessionId, session);

    return {
      success: true,
      message: 'Sessão revogada com sucesso'
    };
  }

  /**
   * Renova sessão
   */
  async refreshSession(sessionId: string): Promise<SessionResponse | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    if (!session.isActive) {
      return null;
    }

    if (this.isSessionExpired(session)) {
      return null;
    }

    // Estender tempo de expiração
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + this.sessionTimeout);
    
    session.expiresAt = newExpiresAt.toISOString();
    session.lastAccessedAt = now.toISOString();
    
    this.sessions.set(sessionId, session);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      serverType: session.serverType,
      authenticationMethod: session.authenticationMethod,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      lastAccessedAt: session.lastAccessedAt
    };
  }

  /**
   * Limpa sessões expiradas
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        session.isActive = false;
        this.sessions.set(sessionId, session);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * Cria JWT token para sessão
   */
  private createJwtToken(session: UserSession): string {
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      serverType: session.serverType,
      authenticationMethod: session.authenticationMethod,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(new Date(session.expiresAt).getTime() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Valida JWT token
   */
  validateJwtToken(token: string): { valid: boolean; sessionId?: string; error?: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      if (!decoded.sessionId) {
        return { valid: false, error: 'Token não contém sessionId' };
      }

      return { valid: true, sessionId: decoded.sessionId };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token inválido' 
      };
    }
  }

  /**
   * Verifica se sessão está expirada
   */
  private isSessionExpired(session: UserSession): boolean {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return now >= expiresAt;
  }

  /**
   * Obtém sessão por JWT token
   */
  async getSessionByToken(token: string): Promise<SessionResponse | null> {
    const validation = this.validateJwtToken(token);
    
    if (!validation.valid || !validation.sessionId) {
      return null;
    }

    return this.getCurrentSession(validation.sessionId);
  }

  /**
   * Obtém credenciais de uma sessão
   */
  async getSessionCredentials(sessionId: string): Promise<AuthenticationCredentials | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive || this.isSessionExpired(session)) {
      return null;
    }

    return session.credentials;
  }

  /**
   * Atualiza credenciais de uma sessão
   */
  async updateSessionCredentials(sessionId: string, credentials: AuthenticationCredentials): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive || this.isSessionExpired(session)) {
      return false;
    }

    session.credentials = credentials;
    session.lastAccessedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);

    return true;
  }

  /**
   * Obtém estatísticas das sessões
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    sessionsByMethod: Record<string, number>;
    sessionsByServerType: Record<string, number>;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = new Date();

    const activeSessions = sessions.filter(s => s.isActive && new Date(s.expiresAt) > now);
    const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= now);

    const sessionsByMethod: Record<string, number> = {};
    const sessionsByServerType: Record<string, number> = {};

    sessions.forEach(session => {
      sessionsByMethod[session.authenticationMethod] = (sessionsByMethod[session.authenticationMethod] || 0) + 1;
      sessionsByServerType[session.serverType] = (sessionsByServerType[session.serverType] || 0) + 1;
    });

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      sessionsByMethod,
      sessionsByServerType
    };
  }

  /**
   * Limpa todas as sessões
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Define novo secret JWT
   */
  setJwtSecret(secret: string): void {
    this.jwtSecret = secret;
  }

  /**
   * Define novo timeout de sessão
   */
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }
}

// Instância singleton do serviço
export const sessionManagementService = new SessionManagementService();
