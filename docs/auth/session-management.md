# Gerenciamento de Sessões

## Introdução

O sistema de gerenciamento de sessões do Bitbucket MCP Server implementa JWT tokens seguros com cache em memória, renovação automática e limpeza de sessões expiradas.

## Características Principais

### 🔐 JWT Tokens
- **Assinatura Segura**: Algoritmos HS256/RS256/ES256
- **Expiração Configurável**: Tokens com tempo de vida definido
- **Claims Personalizados**: Informações do usuário e servidor
- **Refresh Automático**: Renovação antes da expiração

### 💾 Cache de Sessões
- **Armazenamento em Memória**: Cache rápido com NodeCache
- **Limpeza Automática**: Remoção de sessões expiradas
- **Múltiplas Sessões**: Suporte a sessões simultâneas
- **Configuração Flexível**: Timeout e limites configuráveis

### 🔄 Renovação Automática
- **Threshold de Refresh**: Renovação antes da expiração
- **Fallback Graceful**: Tratamento de falhas de renovação
- **Logs de Auditoria**: Rastreamento de renovações

## Configuração

### Variáveis de Ambiente

```bash
# Session Configuration
SESSION_TIMEOUT=3600000          # 1 hora em ms
SESSION_REFRESH_THRESHOLD=300000 # 5 minutos em ms
SESSION_MAX_SESSIONS=100         # Máximo de sessões
SESSION_CLEANUP_INTERVAL=600000  # 10 minutos em ms

# JWT Configuration
JWT_SECRET=your-jwt-secret-32-chars-minimum
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=3600             # 1 hora em segundos
```

### Configuração Programática

```typescript
import { authConfigurationManager } from '@/config/auth';

const config = authConfigurationManager.loadConfiguration();

console.log('Session Config:', config.session);
console.log('Security Config:', config.security);
```

## Operações de Sessão

### 1. Criar Sessão

```typescript
import { mcp_bitbucket_auth_create_session } from '@/tools/shared/auth/session-management';

const session = await mcp_bitbucket_auth_create_session({
  userId: 12345,
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  serverType: 'cloud',
  authenticationMethod: 'oauth2'
});

console.log('Session Created:', {
  sessionId: session.sessionId,
  userId: session.userId,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt
});
```

### 2. Obter Sessão Atual

```typescript
import { mcp_bitbucket_auth_get_current_session } from '@/tools/shared/auth/current-user';

const currentSession = await mcp_bitbucket_auth_get_current_session();

if (currentSession) {
  console.log('Current Session:', {
    sessionId: currentSession.sessionId,
    userId: currentSession.userId,
    expiresAt: currentSession.expiresAt,
    isExpired: currentSession.isExpired
  });
} else {
  console.log('No active session');
}
```

### 3. Renovar Sessão

```typescript
import { mcp_bitbucket_auth_refresh_session } from '@/tools/shared/auth/session-management';

const refreshedSession = await mcp_bitbucket_auth_refresh_session({
  sessionId: 'your-session-id'
});

console.log('Session Refreshed:', {
  sessionId: refreshedSession.sessionId,
  newExpiresAt: refreshedSession.expiresAt,
  refreshedAt: refreshedSession.refreshedAt
});
```

### 4. Listar Sessões Ativas

```typescript
import { mcp_bitbucket_auth_list_active_sessions } from '@/tools/shared/auth/session-management';

const activeSessions = await mcp_bitbucket_auth_list_active_sessions({
  userId: 12345
});

console.log('Active Sessions:', activeSessions.map(session => ({
  sessionId: session.sessionId,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  lastActivity: session.lastActivity
})));
```

### 5. Revogar Sessão

```typescript
import { mcp_bitbucket_auth_revoke_session } from '@/tools/shared/auth/session-management';

await mcp_bitbucket_auth_revoke_session({
  sessionId: 'your-session-id'
});

console.log('Session revoked successfully');
```

## Estrutura de Sessão

### Interface UserSession

```typescript
interface UserSession {
  sessionId: string;
  userId: number;
  accessToken: string;
  refreshToken?: string;
  serverType: 'datacenter' | 'cloud';
  authenticationMethod: 'oauth2' | 'personal_token' | 'app_password' | 'basic_auth';
  createdAt: Date;
  expiresAt: Date;
  refreshedAt?: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    deviceInfo?: string;
  };
}
```

### JWT Claims

```typescript
interface JWTPayload {
  sub: string;           // User ID
  iss: string;           // Issuer (Bitbucket MCP Server)
  aud: string;           // Audience
  exp: number;           // Expiration time
  iat: number;           // Issued at
  jti: string;           // JWT ID (Session ID)
  serverType: string;    // Data Center or Cloud
  authMethod: string;    // Authentication method
  permissions: string[]; // User permissions
}
```

## Middleware de Sessão

### Express Middleware

```typescript
import express from 'express';
import { sessionMiddleware } from '@/services/auth/session';

const app = express();

// Middleware de sessão
app.use(sessionMiddleware({
  secret: process.env.JWT_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 3600000 // 1 hora
  }
}));

// Rota protegida
app.get('/api/protected', (req, res) => {
  if (req.session) {
    res.json({ 
      message: 'Access granted',
      userId: req.session.userId 
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```

### Middleware de Renovação Automática

```typescript
import { autoRefreshMiddleware } from '@/services/auth/session';

// Middleware de renovação automática
app.use(autoRefreshMiddleware({
  refreshThreshold: 300000, // 5 minutos
  onRefresh: (session) => {
    console.log(`Session ${session.sessionId} refreshed`);
  },
  onExpired: (session) => {
    console.log(`Session ${session.sessionId} expired`);
  }
}));
```

## Cache de Sessões

### Configuração do Cache

```typescript
import NodeCache from 'node-cache';

const sessionCache = new NodeCache({
  stdTTL: 3600,        // 1 hora
  checkperiod: 600,    // 10 minutos
  useClones: false,    // Performance
  deleteOnExpire: true // Limpeza automática
});

// Eventos do cache
sessionCache.on('expired', (key, value) => {
  console.log(`Session ${key} expired`);
});

sessionCache.on('del', (key, value) => {
  console.log(`Session ${key} deleted`);
});
```

### Operações de Cache

```typescript
import { sessionCache } from '@/services/auth/session';

// Armazenar sessão
sessionCache.set(sessionId, sessionData, 3600);

// Obter sessão
const session = sessionCache.get(sessionId);

// Verificar se existe
const exists = sessionCache.has(sessionId);

// Deletar sessão
sessionCache.del(sessionId);

// Limpar todas as sessões
sessionCache.flushAll();

// Estatísticas do cache
const stats = sessionCache.getStats();
console.log('Cache Stats:', stats);
```

## Limpeza Automática

### Limpeza de Sessões Expiradas

```typescript
import { sessionCleanupService } from '@/services/auth/session';

// Iniciar limpeza automática
sessionCleanupService.start({
  interval: 600000, // 10 minutos
  batchSize: 100,   // Processar 100 por vez
  onCleanup: (count) => {
    console.log(`Cleaned up ${count} expired sessions`);
  }
});

// Parar limpeza
sessionCleanupService.stop();
```

### Limpeza Manual

```typescript
import { mcp_bitbucket_auth_cleanup_expired_sessions } from '@/tools/shared/auth/session-management';

const cleanupResult = await mcp_bitbucket_auth_cleanup_expired_sessions();

console.log('Cleanup Result:', {
  expiredSessionsRemoved: cleanupResult.expiredSessionsRemoved,
  activeSessionsRemaining: cleanupResult.activeSessionsRemaining,
  cleanupDuration: cleanupResult.cleanupDuration
});
```

## Monitoramento

### Métricas de Sessão

```typescript
import { sessionMetrics } from '@/services/auth/metrics';

// Métricas de criação
sessionMetrics.incrementSessionsCreated();
sessionMetrics.incrementSessionsRefreshed();
sessionMetrics.incrementSessionsRevoked();
sessionMetrics.incrementSessionsExpired();

// Métricas de performance
sessionMetrics.recordSessionCreationTime(duration);
sessionMetrics.recordSessionRefreshTime(duration);
sessionMetrics.recordSessionLookupTime(duration);

// Obter estatísticas
const stats = sessionMetrics.getStats();
console.log('Session Metrics:', stats);
```

### Logs de Auditoria

```typescript
import { auditLogger } from '@/services/auth/audit';

// Log de criação de sessão
auditLogger.logSessionCreated({
  sessionId: 'session-123',
  userId: 12345,
  serverType: 'cloud',
  authMethod: 'oauth2',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Log de renovação
auditLogger.logSessionRefreshed({
  sessionId: 'session-123',
  userId: 12345,
  oldExpiresAt: new Date(),
  newExpiresAt: new Date()
});

// Log de revogação
auditLogger.logSessionRevoked({
  sessionId: 'session-123',
  userId: 12345,
  reason: 'user_logout'
});
```

## Segurança

### Validação de Sessão

```typescript
import { validateSession } from '@/services/auth/session';

const isValid = await validateSession(sessionId, {
  checkExpiration: true,
  checkRevocation: true,
  checkActivity: true,
  maxInactivity: 1800000 // 30 minutos
});

if (!isValid) {
  throw new Error('Invalid or expired session');
}
```

### Proteção contra Ataques

```typescript
import { sessionSecurity } from '@/services/auth/security';

// Verificar múltiplas sessões
const sessionCount = await sessionSecurity.getUserSessionCount(userId);
if (sessionCount > maxSessionsPerUser) {
  throw new Error('Too many active sessions');
}

// Verificar atividade suspeita
const isSuspicious = await sessionSecurity.detectSuspiciousActivity({
  sessionId,
  ipAddress,
  userAgent,
  timestamp: new Date()
});

if (isSuspicious) {
  await sessionSecurity.revokeSession(sessionId, 'suspicious_activity');
}
```

## Exemplo Completo

### Servidor com Gerenciamento de Sessão

```typescript
import express from 'express';
import { sessionMiddleware } from '@/services/auth/session';
import { mcp_bitbucket_auth_create_session } from '@/tools/shared/auth/session-management';
import { mcp_bitbucket_auth_get_current_session } from '@/tools/shared/auth/current-user';

const app = express();

// Middleware de sessão
app.use(sessionMiddleware({
  secret: process.env.JWT_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 3600000
  }
}));

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { accessToken, refreshToken, userId } = req.body;
    
    // Criar sessão
    const session = await mcp_bitbucket_auth_create_session({
      userId,
      accessToken,
      refreshToken,
      serverType: 'cloud',
      authenticationMethod: 'oauth2',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    
    // Definir cookie de sessão
    res.cookie('sessionId', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000
    });
    
    res.json({ 
      success: true, 
      sessionId: session.sessionId,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/auth/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    
    if (sessionId) {
      await mcp_bitbucket_auth_revoke_session({ sessionId });
      res.clearCookie('sessionId');
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota protegida
app.get('/api/profile', async (req, res) => {
  try {
    const session = await mcp_bitbucket_auth_get_current_session();
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({
      userId: session.userId,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Session server running on port 3000');
});
```

## Troubleshooting

### Problemas Comuns

1. **Sessão Expirada**
   ```typescript
   // Verificar expiração
   if (session.expiresAt < new Date()) {
     console.log('Session expired');
     // Renovar ou redirecionar para login
   }
   ```

2. **Token JWT Inválido**
   ```typescript
   try {
     const session = await validateSession(sessionId);
   } catch (error) {
     if (error.message.includes('jwt malformed')) {
       console.log('Invalid JWT token');
     }
   }
   ```

3. **Cache de Sessão Cheio**
   ```typescript
   const stats = sessionCache.getStats();
   if (stats.keys > maxSessions) {
     console.log('Session cache is full');
     // Implementar limpeza ou LRU
   }
   ```

### Debug

```bash
# Habilitar debug de sessão
export DEBUG=session:*
export LOG_LEVEL=debug

# Executar com logs detalhados
npm run dev
```

## Próximos Passos

1. **Configurar Segurança**: [Security Configuration](./security.md)
2. **Troubleshooting**: [Troubleshooting Guide](./troubleshooting.md)
3. **API Reference**: [API Reference](./api-reference.md)
