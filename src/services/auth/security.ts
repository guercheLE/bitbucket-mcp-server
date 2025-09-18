import * as crypto from 'crypto';

/**
 * Interface para configuração de segurança
 */
export interface SecurityConfig {
  encryptionKey: string;
  jwtSecret: string;
  rateLimitWindow: number; // em ms
  rateLimitMaxRequests: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // em ms
  tokenExpirationTime: number; // em ms
  sessionTimeout: number; // em ms
}

/**
 * Interface para métricas de segurança
 */
export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  failedLogins: number;
  successfulLogins: number;
  suspiciousActivities: number;
  rateLimitHits: number;
  bruteForceAttempts: number;
}

/**
 * Interface para auditoria de segurança
 */
export interface SecurityAuditLog {
  timestamp: string;
  event: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Classe para medidas de segurança
 */
export class SecurityService {
  private config: SecurityConfig;
  private metrics: SecurityMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    failedLogins: 0,
    successfulLogins: 0,
    suspiciousActivities: 0,
    rateLimitHits: 0,
    bruteForceAttempts: 0
  };

  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private loginAttempts = new Map<string, { attempts: number; lockoutUntil?: number }>();
  private auditLogs: SecurityAuditLog[] = [];

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Criptografa dados sensíveis
   */
  encryptSensitiveData(data: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.config.encryptionKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logSecurityEvent('ENCRYPTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'HIGH');
      throw new Error('Falha na criptografia de dados sensíveis');
    }
  }

  /**
   * Descriptografa dados sensíveis
   */
  decryptSensitiveData(encryptedData: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, this.config.encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logSecurityEvent('DECRYPTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'HIGH');
      throw new Error('Falha na descriptografia de dados sensíveis');
    }
  }

  /**
   * Sanitiza dados de entrada
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remover caracteres perigosos
      return input
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Implementa rate limiting
   */
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    const current = this.rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // Nova janela de tempo
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      
      return {
        allowed: true,
        remaining: this.config.rateLimitMaxRequests - 1,
        resetTime: now + this.config.rateLimitWindow
      };
    }
    
    if (current.count >= this.config.rateLimitMaxRequests) {
      this.metrics.rateLimitHits++;
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        identifier,
        count: current.count,
        limit: this.config.rateLimitMaxRequests
      }, 'MEDIUM');
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    current.count++;
    this.rateLimitStore.set(identifier, current);
    
    return {
      allowed: true,
      remaining: this.config.rateLimitMaxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Implementa proteção contra brute force
   */
  checkBruteForceProtection(identifier: string): { allowed: boolean; lockoutUntil?: number } {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      this.loginAttempts.set(identifier, { attempts: 0 });
      return { allowed: true };
    }
    
    // Verificar se está em lockout
    if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
      this.metrics.bruteForceAttempts++;
      this.logSecurityEvent('BRUTE_FORCE_BLOCKED', {
        identifier,
        lockoutUntil: attempts.lockoutUntil,
        attempts: attempts.attempts
      }, 'HIGH');
      
      return {
        allowed: false,
        lockoutUntil: attempts.lockoutUntil
      };
    }
    
    // Resetar se lockout expirou
    if (attempts.lockoutUntil && now >= attempts.lockoutUntil) {
      attempts.attempts = 0;
      attempts.lockoutUntil = undefined;
    }
    
    return { allowed: true };
  }

  /**
   * Registra tentativa de login
   */
  recordLoginAttempt(identifier: string, success: boolean): void {
    const attempts = this.loginAttempts.get(identifier) || { attempts: 0 };
    
    if (success) {
      // Resetar contador em caso de sucesso
      attempts.attempts = 0;
      attempts.lockoutUntil = undefined;
      this.metrics.successfulLogins++;
      
      this.logSecurityEvent('LOGIN_SUCCESS', {
        identifier
      }, 'LOW');
    } else {
      attempts.attempts++;
      this.metrics.failedLogins++;
      
      // Aplicar lockout se exceder limite
      if (attempts.attempts >= this.config.maxLoginAttempts) {
        attempts.lockoutUntil = Date.now() + this.config.lockoutDuration;
        
        this.logSecurityEvent('ACCOUNT_LOCKED', {
          identifier,
          attempts: attempts.attempts,
          lockoutDuration: this.config.lockoutDuration
        }, 'HIGH');
      } else {
        this.logSecurityEvent('LOGIN_FAILED', {
          identifier,
          attempts: attempts.attempts,
          maxAttempts: this.config.maxLoginAttempts
        }, 'MEDIUM');
      }
    }
    
    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Valida entrada de dados
   */
  validateInput(input: any, rules: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: any[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar se é obrigatório
    if (rules.required && (input === undefined || input === null || input === '')) {
      errors.push('Campo é obrigatório');
      return { valid: false, errors };
    }
    
    // Se não é obrigatório e está vazio, é válido
    if (!rules.required && (input === undefined || input === null || input === '')) {
      return { valid: true, errors: [] };
    }
    
    // Verificar tipo
    if (rules.type) {
      const actualType = Array.isArray(input) ? 'array' : typeof input;
      if (actualType !== rules.type) {
        errors.push(`Tipo esperado: ${rules.type}, tipo recebido: ${actualType}`);
      }
    }
    
    // Verificar comprimento para strings
    if (typeof input === 'string') {
      if (rules.minLength && input.length < rules.minLength) {
        errors.push(`Comprimento mínimo: ${rules.minLength}, comprimento atual: ${input.length}`);
      }
      if (rules.maxLength && input.length > rules.maxLength) {
        errors.push(`Comprimento máximo: ${rules.maxLength}, comprimento atual: ${input.length}`);
      }
      if (rules.pattern && !rules.pattern.test(input)) {
        errors.push('Formato inválido');
      }
    }
    
    // Verificar valores permitidos
    if (rules.allowedValues && !rules.allowedValues.includes(input)) {
      errors.push(`Valor não permitido. Valores permitidos: ${rules.allowedValues.join(', ')}`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Gera hash seguro para senhas
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verifica senha contra hash
   */
  verifyPassword(password: string, hash: string): boolean {
    const [saltHex, hashHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hashBuffer = Buffer.from(hashHex, 'hex');
    
    const derivedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    
    return crypto.timingSafeEqual(hashBuffer, derivedHash);
  }

  /**
   * Gera token JWT seguro
   */
  generateSecureToken(payload: Record<string, any>, expiresIn: number = this.config.tokenExpirationTime): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + Math.floor(expiresIn / 1000)
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.config.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifica token JWT
   */
  verifySecureToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      
      if (!encodedHeader || !encodedPayload || !signature) {
        return { valid: false, error: 'Formato de token inválido' };
      }
      
      // Verificar assinatura
      const expectedSignature = crypto
        .createHmac('sha256', this.config.jwtSecret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');
      
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        this.logSecurityEvent('INVALID_TOKEN_SIGNATURE', {
          token: token.substring(0, 20) + '...'
        }, 'HIGH');
        return { valid: false, error: 'Assinatura inválida' };
      }
      
      // Decodificar payload
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
      
      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logSecurityEvent('EXPIRED_TOKEN', {
          token: token.substring(0, 20) + '...',
          exp: payload.exp,
          now
        }, 'MEDIUM');
        return { valid: false, error: 'Token expirado' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      this.logSecurityEvent('TOKEN_VERIFICATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 20) + '...'
      }, 'HIGH');
      return { valid: false, error: 'Erro na verificação do token' };
    }
  }

  /**
   * Registra evento de auditoria de segurança
   */
  logSecurityEvent(
    event: string, 
    details: Record<string, any>, 
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const auditLog: SecurityAuditLog = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      ipAddress,
      userAgent,
      details: this.sanitizeInput(details),
      severity
    };
    
    this.auditLogs.push(auditLog);
    
    // Manter apenas os últimos 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
    
    // Log para console em caso de eventos críticos
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.error(`[SECURITY] ${severity}: ${event}`, details);
    }
  }

  /**
   * Detecta atividades suspeitas
   */
  detectSuspiciousActivity(identifier: string, activity: string, context: Record<string, any>): boolean {
    let suspicious = false;
    
    // Detectar múltiplas tentativas de login de diferentes IPs
    if (activity === 'LOGIN_ATTEMPT') {
      const recentLogs = this.auditLogs.filter(log => 
        log.timestamp > new Date(Date.now() - 60000).toISOString() && // Últimos 60 segundos
        log.event === 'LOGIN_ATTEMPT' &&
        log.details.identifier === identifier
      );
      
      const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress).filter(Boolean));
      if (uniqueIPs.size > 3) {
        suspicious = true;
        this.logSecurityEvent('SUSPICIOUS_MULTIPLE_IPS', {
          identifier,
          uniqueIPs: uniqueIPs.size,
          ips: Array.from(uniqueIPs)
        }, 'HIGH');
      }
    }
    
    // Detectar padrões de rate limit
    if (activity === 'RATE_LIMIT_EXCEEDED') {
      const recentRateLimits = this.auditLogs.filter(log => 
        log.timestamp > new Date(Date.now() - 300000).toISOString() && // Últimos 5 minutos
        log.event === 'RATE_LIMIT_EXCEEDED' &&
        log.details.identifier === identifier
      );
      
      if (recentRateLimits.length > 5) {
        suspicious = true;
        this.logSecurityEvent('SUSPICIOUS_RATE_LIMIT_PATTERN', {
          identifier,
          rateLimitCount: recentRateLimits.length
        }, 'HIGH');
      }
    }
    
    if (suspicious) {
      this.metrics.suspiciousActivities++;
    }
    
    return suspicious;
  }

  /**
   * Obtém métricas de segurança
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém logs de auditoria
   */
  getAuditLogs(limit: number = 100): SecurityAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Obtém logs de auditoria por severidade
   */
  getAuditLogsBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): SecurityAuditLog[] {
    return this.auditLogs.filter(log => log.severity === severity);
  }

  /**
   * Reseta métricas de segurança
   */
  resetSecurityMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      failedLogins: 0,
      successfulLogins: 0,
      suspiciousActivities: 0,
      rateLimitHits: 0,
      bruteForceAttempts: 0
    };
  }

  /**
   * Limpa logs de auditoria antigos
   */
  cleanupOldAuditLogs(olderThanDays: number = 30): void {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
  }

  /**
   * Obtém relatório de segurança
   */
  getSecurityReport(): {
    metrics: SecurityMetrics;
    recentHighSeverityEvents: SecurityAuditLog[];
    recommendations: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const recentHighSeverityEvents = this.auditLogs.filter(log => 
      (log.severity === 'HIGH' || log.severity === 'CRITICAL') &&
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
    );
    
    const recommendations: string[] = [];
    
    if (this.metrics.failedLogins > this.metrics.successfulLogins * 0.1) {
      recommendations.push('Taxa de falhas de login alta. Verifique credenciais e implemente 2FA.');
    }
    
    if (this.metrics.rateLimitHits > 100) {
      recommendations.push('Muitos hits de rate limit. Considere ajustar limites ou otimizar requisições.');
    }
    
    if (this.metrics.suspiciousActivities > 10) {
      recommendations.push('Muitas atividades suspeitas detectadas. Implemente monitoramento adicional.');
    }
    
    if (recentHighSeverityEvents.length > 5) {
      recommendations.push('Muitos eventos de alta severidade recentes. Investigação imediata necessária.');
    }
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (recentHighSeverityEvents.some(log => log.severity === 'CRITICAL')) {
      riskLevel = 'CRITICAL';
    } else if (recentHighSeverityEvents.some(log => log.severity === 'HIGH')) {
      riskLevel = 'HIGH';
    } else if (this.metrics.suspiciousActivities > 5 || this.metrics.failedLogins > 50) {
      riskLevel = 'MEDIUM';
    }
    
    return {
      metrics: this.metrics,
      recentHighSeverityEvents,
      recommendations,
      riskLevel
    };
  }
}

// Instância singleton do serviço de segurança
export const securityService = new SecurityService({
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
  rateLimitWindow: 60000, // 1 minuto
  rateLimitMaxRequests: 100,
  maxLoginAttempts: 5,
  lockoutDuration: 300000, // 5 minutos
  tokenExpirationTime: 3600000, // 1 hora
  sessionTimeout: 1800000 // 30 minutos
});
