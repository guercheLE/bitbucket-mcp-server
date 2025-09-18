# Guia de Troubleshooting

## Introdução

Este guia fornece soluções para problemas comuns encontrados no sistema de autenticação do Bitbucket MCP Server, incluindo diagnóstico, resolução e prevenção.

## Problemas de Conectividade

### 1. Falha na Detecção de Servidor

#### Sintomas
- Erro: "Unable to detect server type"
- Timeout ao conectar com o servidor
- Erro 404 ao acessar endpoints de detecção

#### Diagnóstico
```bash
# Verificar conectividade básica
curl -I https://your-bitbucket-server.com

# Verificar endpoint de detecção Data Center
curl -I https://your-bitbucket-server.com/rest/api/1.0/application-properties

# Verificar endpoint de detecção Cloud
curl -I https://bitbucket.org/2.0/user
```

#### Soluções

**Problema de Rede**
```typescript
// Verificar configuração de proxy
const proxyConfig = {
  host: process.env.PROXY_HOST,
  port: process.env.PROXY_PORT,
  auth: process.env.PROXY_AUTH
};

// Configurar timeout maior
const axiosConfig = {
  timeout: 30000, // 30 segundos
  retry: 3,
  retryDelay: 1000
};
```

**URL Incorreta**
```typescript
// Verificar formato da URL
const serverUrl = 'https://your-bitbucket-server.com'; // Sem barra final
// ❌ ERRADO: 'https://your-bitbucket-server.com/'

// Verificar se é HTTPS
if (!serverUrl.startsWith('https://')) {
  console.warn('Servidor não usa HTTPS - pode ser inseguro');
}
```

**Certificados SSL**
```typescript
// Para desenvolvimento com certificados auto-assinados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ⚠️ APENAS DESENVOLVIMENTO

// Para produção, verificar certificados
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: true,
  checkServerIdentity: (servername, cert) => {
    // Validação customizada se necessário
    return undefined;
  }
});
```

### 2. Timeout de Conexão

#### Sintomas
- Erro: "Connection timeout"
- Requisições demoram muito para responder
- Falhas intermitentes de conectividade

#### Soluções

**Configurar Timeouts**
```typescript
import { authConfigurationManager } from '@/config/auth';

const config = authConfigurationManager.getConfiguration();

// Aumentar timeout para servidores lentos
const serverConfig = {
  ...config.server,
  timeout: 60000, // 60 segundos
  retryAttempts: 5
};

// Configurar retry com backoff exponencial
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};
```

**Implementar Circuit Breaker**
```typescript
import { authPerformanceOptimizer } from '@/services/auth/performance';

// Usar circuit breaker para operações de rede
const result = await authPerformanceOptimizer.executeWithCircuitBreaker(
  'server-detection',
  () => detectServerType(serverUrl)
);
```

## Problemas de Autenticação

### 1. OAuth 2.0

#### Sintomas
- Erro: "Invalid client"
- Erro: "Invalid grant"
- Erro: "Unauthorized"

#### Diagnóstico
```bash
# Verificar configuração OAuth
echo $OAUTH_CLIENT_ID
echo $OAUTH_CLIENT_SECRET
echo $OAUTH_REDIRECT_URI

# Testar URL de autorização
curl -v "https://bitbucket.org/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI"
```

#### Soluções

**Client ID/Secret Inválidos**
```typescript
// Verificar configuração
const oauthConfig = authConfigurationManager.getOAuthConfig();

if (!oauthConfig.clientId || oauthConfig.clientId === 'default-client-id') {
  throw new Error('OAuth Client ID não configurado');
}

if (!oauthConfig.clientSecret || oauthConfig.clientSecret === 'default-client-secret') {
  throw new Error('OAuth Client Secret não configurado');
}
```

**Redirect URI Mismatch**
```typescript
// Verificar se a URI de callback está configurada corretamente
const expectedRedirectUri = 'http://localhost:3000/auth/callback';
const actualRedirectUri = oauthConfig.redirectUri;

if (expectedRedirectUri !== actualRedirectUri) {
  console.error('Redirect URI mismatch:', {
    expected: expectedRedirectUri,
    actual: actualRedirectUri
  });
}
```

**Código de Autorização Expirado**
```typescript
// Implementar retry com novo código
try {
  const token = await exchangeCodeForToken(code);
} catch (error) {
  if (error.message.includes('invalid_grant')) {
    console.log('Código expirado, redirecionando para nova autorização');
    // Redirecionar para /auth/authorize
  }
}
```

### 2. Personal Access Token

#### Sintomas
- Erro: "Invalid credentials"
- Erro: "Token expired"
- Erro: "Insufficient permissions"

#### Soluções

**Token Expirado**
```typescript
// Verificar expiração do token
const tokenInfo = await getTokenInfo(accessToken);

if (tokenInfo.expiresAt && new Date() > new Date(tokenInfo.expiresAt)) {
  console.log('Token expirado, solicitando novo token');
  // Implementar renovação ou solicitar novo token
}
```

**Permissões Insuficientes**
```typescript
// Verificar escopo do token
const tokenScopes = tokenInfo.scopes;

if (!tokenScopes.includes('repository:read')) {
  throw new Error('Token não tem permissão de leitura de repositório');
}

if (!tokenScopes.includes('repository:write')) {
  throw new Error('Token não tem permissão de escrita de repositório');
}
```

### 3. App Password

#### Sintomas
- Erro: "Authentication failed"
- Erro: "Invalid username or password"

#### Soluções

**Credenciais Incorretas**
```typescript
// Verificar formato das credenciais
const credentials = {
  username: process.env.BITBUCKET_USERNAME,
  appPassword: process.env.BITBUCKET_APP_PASSWORD
};

if (!credentials.username || !credentials.appPassword) {
  throw new Error('Username ou App Password não configurados');
}

// Verificar se não é a senha normal da conta
if (credentials.appPassword.length < 20) {
  console.warn('App Password muito curto - pode ser senha normal');
}
```

## Problemas de Sessão

### 1. Sessão Expirada

#### Sintomas
- Erro: "Session expired"
- Redirecionamento para login
- Token JWT inválido

#### Soluções

**Implementar Refresh Automático**
```typescript
import { mcp_bitbucket_auth_refresh_session } from '@/tools/shared/auth/session-management';

// Middleware de refresh automático
const autoRefreshMiddleware = async (req, res, next) => {
  const session = req.session;
  
  if (session && session.expiresAt) {
    const timeUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutos
    
    if (timeUntilExpiry < refreshThreshold) {
      try {
        const refreshedSession = await mcp_bitbucket_auth_refresh_session({
          sessionId: session.sessionId
        });
        
        req.session = refreshedSession;
        res.cookie('sessionId', refreshedSession.sessionId);
      } catch (error) {
        console.error('Falha ao renovar sessão:', error);
        // Redirecionar para login
        return res.redirect('/auth/login');
      }
    }
  }
  
  next();
};
```

**Verificar Configuração de Expiração**
```typescript
const sessionConfig = authConfigurationManager.getSessionConfig();

console.log('Session Configuration:', {
  timeout: sessionConfig.timeout,
  refreshThreshold: sessionConfig.refreshThreshold,
  maxSessions: sessionConfig.maxSessions
});

// Ajustar timeout se necessário
if (sessionConfig.timeout < 3600000) { // Menos de 1 hora
  console.warn('Session timeout muito baixo para produção');
}
```

### 2. Múltiplas Sessões

#### Sintomas
- Conflito entre sessões
- Logout inesperado
- Sessões não sincronizadas

#### Soluções

**Limitar Sessões por Usuário**
```typescript
import { mcp_bitbucket_auth_list_active_sessions } from '@/tools/shared/auth/session-management';

const createSessionWithLimit = async (userId, newSession) => {
  const activeSessions = await mcp_bitbucket_auth_list_active_sessions({ userId });
  const maxSessions = 5; // Limite de 5 sessões por usuário
  
  if (activeSessions.length >= maxSessions) {
    // Revogar sessão mais antiga
    const oldestSession = activeSessions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    
    await mcp_bitbucket_auth_revoke_session({
      sessionId: oldestSession.sessionId
    });
  }
  
  return await mcp_bitbucket_auth_create_session(newSession);
};
```

## Problemas de Performance

### 1. Cache de Sessão Cheio

#### Sintomas
- Erro: "Cache is full"
- Performance degradada
- Sessões não encontradas

#### Soluções

**Configurar Limpeza Automática**
```typescript
import { authPerformanceOptimizer } from '@/services/auth/performance';

// Configurar limpeza automática
const cleanupInterval = setInterval(async () => {
  const cacheStats = authPerformanceOptimizer.getCacheStats();
  
  if (cacheStats.session.keys > 800) { // 80% do limite
    console.log('Cache de sessão próximo do limite, iniciando limpeza');
    
    // Limpar sessões expiradas
    await mcp_bitbucket_auth_cleanup_expired_sessions();
  }
}, 60000); // A cada minuto
```

**Aumentar Limite de Cache**
```typescript
const cacheConfig = {
  session: {
    ttl: 3600000, // 1 hora
    maxKeys: 2000 // Aumentar limite
  }
};

const optimizer = new AuthPerformanceOptimizer(cacheConfig);
```

### 2. Rate Limiting Excessivo

#### Sintomas
- Erro: "Rate limit exceeded"
- Requisições bloqueadas
- Performance degradada

#### Soluções

**Implementar Retry com Backoff**
```typescript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

**Configurar Rate Limiting Adequado**
```typescript
const rateLimitConfig = {
  windowMs: 60000, // 1 minuto
  maxRequests: 50, // Reduzir limite
  skipSuccessfulRequests: true
};
```

## Problemas de Configuração

### 1. Variáveis de Ambiente

#### Sintomas
- Erro: "Configuration not found"
- Valores padrão sendo usados
- Configuração incorreta

#### Diagnóstico
```bash
# Verificar variáveis de ambiente
env | grep -E "(OAUTH|BITBUCKET|JWT|SESSION)"

# Verificar arquivo .env
cat .env

# Verificar se está sendo carregado
node -e "require('dotenv').config(); console.log(process.env.OAUTH_CLIENT_ID)"
```

#### Soluções

**Carregar Variáveis de Ambiente**
```typescript
import dotenv from 'dotenv';

// Carregar .env
dotenv.config();

// Verificar variáveis obrigatórias
const requiredVars = [
  'OAUTH_CLIENT_ID',
  'OAUTH_CLIENT_SECRET',
  'JWT_SECRET',
  'BITBUCKET_BASE_URL'
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${varName}`);
  }
}
```

**Validar Configuração**
```typescript
import { authConfigurationManager } from '@/config/auth';

try {
  const config = authConfigurationManager.loadConfiguration();
  console.log('Configuração carregada com sucesso');
} catch (error) {
  console.error('Erro na configuração:', error.message);
  
  // Usar configuração padrão
  const defaultConfig = authConfigurationManager.loadDefaultConfiguration();
  console.log('Usando configuração padrão');
}
```

### 2. Certificados SSL

#### Sintomas
- Erro: "SSL certificate problem"
- Erro: "Self-signed certificate"
- Conexão rejeitada

#### Soluções

**Para Desenvolvimento**
```typescript
// ⚠️ APENAS PARA DESENVOLVIMENTO
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**Para Produção**
```typescript
// Verificar certificados
const https = require('https');
const tls = require('tls');

const checkCertificate = (hostname, port = 443) => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, hostname, (err) => {
      if (err) {
        reject(err);
      } else {
        const cert = socket.getPeerCertificate();
        socket.end();
        resolve(cert);
      }
    });
    
    socket.on('error', reject);
  });
};

// Verificar certificado
checkCertificate('your-bitbucket-server.com')
  .then(cert => {
    console.log('Certificado válido:', cert.subject);
  })
  .catch(error => {
    console.error('Problema com certificado:', error.message);
  });
```

## Logs e Debug

### 1. Habilitar Logs Detalhados

```bash
# Variáveis de ambiente para debug
export DEBUG=*
export LOG_LEVEL=debug
export NODE_ENV=development

# Executar com logs detalhados
npm run dev
```

### 2. Logs de Autenticação

```typescript
import winston from 'winston';

const authLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console()
  ]
});

// Log de tentativas de autenticação
authLogger.debug('Authentication attempt', {
  method: 'oauth2',
  userId: 'user123',
  success: true,
  duration: 150
});
```

### 3. Métricas de Performance

```typescript
import { authPerformanceOptimizer } from '@/services/auth/performance';

// Obter métricas
const metrics = authPerformanceOptimizer.getMetrics();

console.log('Performance Metrics:', {
  cacheHitRate: metrics.cacheHitRate,
  authAverageTime: metrics.authAverageTime,
  sessionAverageTime: metrics.sessionAverageTime,
  memoryUsage: metrics.memoryUsage
});
```

## Scripts de Diagnóstico

### 1. Script de Teste de Conectividade

```bash
#!/bin/bash
# test-connectivity.sh

echo "Testando conectividade com Bitbucket..."

# Testar servidor
if curl -s -o /dev/null -w "%{http_code}" https://bitbucket.org | grep -q "200"; then
  echo "✅ Bitbucket Cloud acessível"
else
  echo "❌ Bitbucket Cloud inacessível"
fi

# Testar endpoint de detecção
if curl -s -o /dev/null -w "%{http_code}" https://bitbucket.org/2.0/user | grep -q "401"; then
  echo "✅ Endpoint de detecção Cloud funcionando"
else
  echo "❌ Endpoint de detecção Cloud com problema"
fi

# Testar configuração OAuth
if [ -n "$OAUTH_CLIENT_ID" ]; then
  echo "✅ OAuth Client ID configurado"
else
  echo "❌ OAuth Client ID não configurado"
fi
```

### 2. Script de Validação de Configuração

```bash
#!/bin/bash
# validate-config.sh

echo "Validando configuração..."

# Verificar variáveis obrigatórias
required_vars=("OAUTH_CLIENT_ID" "OAUTH_CLIENT_SECRET" "JWT_SECRET" "BITBUCKET_BASE_URL")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var não configurado"
  else
    echo "✅ $var configurado"
  fi
done

# Verificar arquivos de configuração
if [ -f ".env" ]; then
  echo "✅ Arquivo .env encontrado"
else
  echo "❌ Arquivo .env não encontrado"
fi

# Executar validação de segurança
npm run validate:auth-security
```

## Contato e Suporte

### Recursos Adicionais

1. **Documentação Oficial**: [Bitbucket API Documentation](https://developer.atlassian.com/bitbucket/api/2/reference/)
2. **Comunidade**: [Bitbucket Community](https://community.atlassian.com/t5/Bitbucket/ct-p/bitbucket)
3. **Issues**: [GitHub Issues](https://github.com/guercheLE/bitbucket-mcp-server/issues)

### Logs para Suporte

Ao reportar problemas, inclua:

1. **Logs de erro** completos
2. **Configuração** (sem dados sensíveis)
3. **Versão** do Node.js e dependências
4. **Ambiente** (desenvolvimento/produção)
5. **Passos para reproduzir** o problema

```bash
# Coletar informações para suporte
echo "Node.js Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "OS: $(uname -a)"
echo "Environment: $NODE_ENV"

# Logs de erro
tail -n 100 logs/error.log

# Configuração (sem dados sensíveis)
npm run validate:auth-security
```
