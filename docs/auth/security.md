# Configuração de Segurança

## Introdução

Este documento detalha as medidas de segurança implementadas no sistema de autenticação do Bitbucket MCP Server, incluindo criptografia, sanitização, rate limiting e proteção contra ataques comuns.

## Medidas de Segurança Implementadas

### 🔐 Criptografia

#### Algoritmos Suportados
- **AES-256-GCM**: Criptografia simétrica para tokens sensíveis
- **AES-256-CBC**: Criptografia simétrica alternativa
- **ChaCha20-Poly1305**: Criptografia moderna e rápida

#### Implementação

```typescript
import CryptoJS from 'crypto-js';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  
  encrypt(text: string, key: string): string {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
  }
  
  decrypt(encryptedText: string, key: string): string {
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedText);
    const iv = CryptoJS.lib.WordArray.create(encryptedData.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(encryptedData.words.slice(4));
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as any,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
```

### 🧹 Sanitização de Dados

#### Validação de Entrada

```typescript
import { z } from 'zod';

// Schema de validação para dados de entrada
const UserInputSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username contém caracteres inválidos'),
  
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter maiúscula, minúscula, número e símbolo')
});

// Sanitização de dados
class SanitizationService {
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remover tags HTML
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/on\w+=/gi, ''); // Remover event handlers
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
  
  validateAndSanitize<T>(input: any, schema: z.ZodSchema<T>): T {
    const sanitized = this.sanitizeInput(input);
    return schema.parse(sanitized);
  }
}
```

### ⏱️ Rate Limiting

#### Configuração

```typescript
import rateLimit from 'express-rate-limit';

// Rate limiting para autenticação
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não contar requisições bem-sucedidas
  skipFailedRequests: false, // Contar requisições falhadas
  keyGenerator: (req) => {
    // Usar IP + User-Agent para identificação única
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});

// Rate limiting para API
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: {
    error: 'Muitas requisições. Tente novamente em 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

#### Rate Limiting Personalizado

```typescript
class CustomRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private windowMs: number = 60000,
    private maxRequests: number = 100
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remover requisições antigas
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    // Verificar limite
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Adicionar requisição atual
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}
```

### 🛡️ Proteção CSRF

#### Implementação

```typescript
import crypto from 'crypto';

class CSRFProtection {
  private stateStore: Map<string, { timestamp: number; used: boolean }> = new Map();
  private readonly stateTimeout = 10 * 60 * 1000; // 10 minutos
  
  generateState(): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      timestamp: Date.now(),
      used: false
    });
    
    // Limpeza de estados expirados
    this.cleanupExpiredStates();
    
    return state;
  }
  
  validateState(state: string): boolean {
    const stateData = this.stateStore.get(state);
    
    if (!stateData) {
      return false; // Estado não encontrado
    }
    
    if (stateData.used) {
      return false; // Estado já foi usado
    }
    
    if (Date.now() - stateData.timestamp > this.stateTimeout) {
      this.stateStore.delete(state);
      return false; // Estado expirado
    }
    
    // Marcar como usado
    stateData.used = true;
    
    return true;
  }
  
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > this.stateTimeout) {
        this.stateStore.delete(state);
      }
    }
  }
}
```

### 🔑 PKCE (Proof Key for Code Exchange)

#### Implementação

```typescript
import crypto from 'crypto';

class PKCEService {
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
  
  generateCodeChallenge(codeVerifier: string): string {
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }
  
  generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    return { codeVerifier, codeChallenge };
  }
  
  validateCodeVerifier(codeVerifier: string, codeChallenge: string): boolean {
    const expectedChallenge = this.generateCodeChallenge(codeVerifier);
    return expectedChallenge === codeChallenge;
  }
}
```

### 🎫 JWT Security

#### Configuração Segura

```typescript
import jwt from 'jsonwebtoken';

class JWTSecurity {
  private readonly algorithm = 'HS256';
  private readonly expiresIn = '1h';
  
  sign(payload: any, secret: string): string {
    return jwt.sign(payload, secret, {
      algorithm: this.algorithm,
      expiresIn: this.expiresIn,
      issuer: 'bitbucket-mcp-server',
      audience: 'bitbucket-api'
    });
  }
  
  verify(token: string, secret: string): any {
    return jwt.verify(token, secret, {
      algorithms: [this.algorithm],
      issuer: 'bitbucket-mcp-server',
      audience: 'bitbucket-api'
    });
  }
  
  decode(token: string): any {
    return jwt.decode(token, { complete: true });
  }
  
  isExpired(token: string): boolean {
    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.payload.exp) {
        return true;
      }
      
      return Date.now() >= decoded.payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
```

## Configuração de Segurança

### Variáveis de Ambiente

```bash
# Configurações de Segurança
JWT_SECRET=your-jwt-secret-32-chars-minimum
ENCRYPTION_KEY=your-encryption-key-32-chars-minimum
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=3600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
RATE_LIMIT_AUTH_WINDOW_MS=900000

# Proteção contra Brute Force
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=300000
BRUTE_FORCE_PROTECTION=true

# Configurações de Sessão
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict
SESSION_MAX_AGE=3600000

# Configurações de CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization
```

### Configuração Programática

```typescript
import { authConfigurationManager } from '@/config/auth';

const securityConfig = authConfigurationManager.getSecurityConfig();

console.log('Security Configuration:', {
  encryptionKey: securityConfig.encryptionKey ? '[REDACTED]' : 'Not set',
  jwtSecret: securityConfig.jwtSecret ? '[REDACTED]' : 'Not set',
  rateLimitWindow: securityConfig.rateLimitWindow,
  rateLimitMaxRequests: securityConfig.rateLimitMaxRequests,
  maxLoginAttempts: securityConfig.maxLoginAttempts,
  lockoutDuration: securityConfig.lockoutDuration
});
```

## Middleware de Segurança

### Helmet para Segurança HTTP

```typescript
import helmet from 'helmet';

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

app.use(securityMiddleware);
```

### CORS Seguro

```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
};

app.use(cors(corsOptions));
```

## Proteção contra Ataques

### SQL Injection Prevention

```typescript
// Usar parâmetros preparados (exemplo com Prisma)
const user = await prisma.user.findUnique({
  where: {
    email: sanitizedEmail // Email já sanitizado
  }
});

// Nunca fazer concatenação direta
// ❌ ERRADO
// const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRETO
// const query = 'SELECT * FROM users WHERE email = ?';
// const result = await db.query(query, [email]);
```

### XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

class XSSProtection {
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }
  
  escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

### Session Hijacking Prevention

```typescript
class SessionSecurity {
  generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  validateSessionFingerprint(session: any, req: any): boolean {
    const currentFingerprint = this.generateFingerprint(req);
    return session.fingerprint === currentFingerprint;
  }
  
  private generateFingerprint(req: any): string {
    const components = [
      req.get('User-Agent'),
      req.get('Accept-Language'),
      req.get('Accept-Encoding'),
      req.ip
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
}
```

## Monitoramento de Segurança

### Logs de Auditoria

```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
});

class SecurityAudit {
  logLoginAttempt(userId: string, success: boolean, ip: string): void {
    securityLogger.info('Login attempt', {
      userId,
      success,
      ip,
      timestamp: new Date().toISOString(),
      event: 'login_attempt'
    });
  }
  
  logSuspiciousActivity(activity: string, details: any): void {
    securityLogger.warn('Suspicious activity detected', {
      activity,
      details,
      timestamp: new Date().toISOString(),
      event: 'suspicious_activity'
    });
  }
  
  logSecurityViolation(violation: string, details: any): void {
    securityLogger.error('Security violation', {
      violation,
      details,
      timestamp: new Date().toISOString(),
      event: 'security_violation'
    });
  }
}
```

### Detecção de Ataques

```typescript
class AttackDetection {
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  detectBruteForce(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    const now = Date.now();
    
    if (!attempts) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Reset se passou muito tempo
    if (now - attempts.lastAttempt > 15 * 60 * 1000) { // 15 minutos
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    
    return attempts.count > 5; // Mais de 5 tentativas
  }
  
  detectRateLimitAbuse(identifier: string, requests: number[]): boolean {
    const now = Date.now();
    const recentRequests = requests.filter(
      timestamp => now - timestamp < 60000 // Último minuto
    );
    
    return recentRequests.length > 100; // Mais de 100 requisições por minuto
  }
}
```

## Validação de Segurança

### Script de Validação

```bash
# Executar validação de segurança
npm run validate:auth-security
```

### Checklist de Segurança

- [ ] **Criptografia**: Chaves de 32+ caracteres
- [ ] **JWT**: Algoritmos seguros (HS256, RS256, ES256)
- [ ] **Rate Limiting**: Configurado e funcionando
- [ ] **CSRF Protection**: State parameter implementado
- [ ] **PKCE**: Implementado para OAuth
- [ ] **Sanitização**: Validação de entrada
- [ ] **HTTPS**: Certificados SSL válidos
- [ ] **Headers de Segurança**: Helmet configurado
- [ ] **CORS**: Configuração restritiva
- [ ] **Logs de Auditoria**: Implementados
- [ ] **Monitoramento**: Detecção de ataques
- [ ] **Backup**: Estratégia de backup segura

## Troubleshooting

### Problemas Comuns

1. **JWT Token Inválido**
   ```typescript
   try {
     const decoded = jwt.verify(token, secret);
   } catch (error) {
     if (error.name === 'TokenExpiredError') {
       console.log('Token expirado');
     } else if (error.name === 'JsonWebTokenError') {
       console.log('Token inválido');
     }
   }
   ```

2. **Rate Limit Exceeded**
   ```typescript
   if (rateLimitExceeded) {
     const retryAfter = Math.ceil(windowMs / 1000);
     res.set('Retry-After', retryAfter.toString());
     res.status(429).json({ error: 'Rate limit exceeded' });
   }
   ```

3. **CSRF Token Mismatch**
   ```typescript
   if (!csrfProtection.validateState(state)) {
     res.status(403).json({ error: 'CSRF token mismatch' });
   }
   ```

### Debug de Segurança

```bash
# Habilitar debug de segurança
export DEBUG=security:*
export LOG_LEVEL=debug

# Executar com logs detalhados
npm run dev
```

## Próximos Passos

1. **Troubleshooting**: [Troubleshooting Guide](./troubleshooting.md)
2. **API Reference**: [API Reference](./api-reference.md)
3. **Performance**: [Performance Optimization](./performance.md)
