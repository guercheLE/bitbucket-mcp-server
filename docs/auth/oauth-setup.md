# Configuração OAuth 2.0

## Introdução

Este guia detalha como configurar OAuth 2.0 para o Bitbucket MCP Server, incluindo configuração de aplicações OAuth, fluxo de autorização e gerenciamento de tokens.

## Configuração de Aplicação OAuth

### Bitbucket Cloud

1. **Acessar Configurações**
   - Faça login no Bitbucket Cloud
   - Vá para Settings > App passwords
   - Clique em "Add app password"

2. **Criar Aplicação OAuth**
   - Nome: "Bitbucket MCP Server"
   - Permissões: Repository (Read, Write), Account (Read)
   - Clique em "Create"

3. **Configurar Callback URL**
   ```
   http://localhost:3000/auth/callback
   ```

### Bitbucket Data Center

1. **Acessar Administração**
   - Faça login como administrador
   - Vá para Administration > Authentication > OAuth consumers
   - Clique em "Add consumer"

2. **Configurar Consumer**
   - Name: "Bitbucket MCP Server"
   - Callback URL: `http://localhost:3000/auth/callback`
   - Permissions: Repository (Read, Write), Account (Read)

3. **Obter Credenciais**
   - Client ID: Gerado automaticamente
   - Client Secret: Gerado automaticamente

## Configuração do Servidor

### Variáveis de Ambiente

```bash
# OAuth Configuration
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
OAUTH_SCOPE=read write

# Server Configuration
BITBUCKET_BASE_URL=https://bitbucket.org  # Para Cloud
# BITBUCKET_BASE_URL=https://your-datacenter.com  # Para Data Center
BITBUCKET_SERVER_TYPE=cloud  # ou 'datacenter'
```

### Configuração Programática

```typescript
import { authConfigurationManager } from '@/config/auth';

const config = authConfigurationManager.loadConfiguration();

// Verificar configuração OAuth
console.log('OAuth Config:', config.oauth);
```

## Fluxo de Autorização

### 1. Gerar URL de Autorização

```typescript
import { mcp_bitbucket_auth_get_oauth_authorization_url } from '@/tools/shared/auth/oauth-authorization';

const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: 'code',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/auth/callback',
  scope: 'read write',
  state: 'random-state-string' // Para proteção CSRF
});

console.log('Authorization URL:', authUrl);
```

### 2. Redirecionar Usuário

```html
<a href="{{ authUrl }}">Autorizar Aplicação</a>
```

### 3. Processar Callback

```typescript
// No endpoint de callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verificar state para proteção CSRF
  if (state !== expectedState) {
    return res.status(400).send('Invalid state');
  }
  
  // Trocar código por token
  const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
    grantType: 'authorization_code',
    code: code as string,
    redirectUri: 'http://localhost:3000/auth/callback',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
  });
  
  // Criar sessão
  const session = await mcp_bitbucket_auth_create_session({
    userId: tokenResponse.userId,
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken
  });
  
  res.json({ sessionId: session.sessionId });
});
```

## Gerenciamento de Tokens

### Obter Token de Acesso

```typescript
import { mcp_bitbucket_auth_get_oauth_token } from '@/tools/shared/auth/oauth-token-exchange';

const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
  grantType: 'authorization_code',
  code: 'authorization-code',
  redirectUri: 'http://localhost:3000/auth/callback',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

console.log('Access Token:', tokenResponse.accessToken);
console.log('Refresh Token:', tokenResponse.refreshToken);
console.log('Expires In:', tokenResponse.expiresIn);
```

### Renovar Token

```typescript
import { mcp_bitbucket_auth_refresh_oauth_token } from '@/tools/shared/auth/oauth-token-exchange';

const newTokenResponse = await mcp_bitbucket_auth_refresh_oauth_token({
  refreshToken: 'your-refresh-token',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

console.log('New Access Token:', newTokenResponse.accessToken);
```

### Revogar Token

```typescript
import { mcp_bitbucket_auth_revoke_access_token } from '@/tools/shared/auth/token-management';

await mcp_bitbucket_auth_revoke_access_token({
  accessToken: 'your-access-token'
});

console.log('Token revoked successfully');
```

## PKCE (Proof Key for Code Exchange)

O sistema implementa PKCE automaticamente para maior segurança:

### Geração de Code Challenge

```typescript
import { generatePKCEChallenge } from '@/services/auth/oauth';

const { codeVerifier, codeChallenge } = generatePKCEChallenge();

// Usar codeChallenge na URL de autorização
const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: 'code',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/auth/callback',
  scope: 'read write',
  codeChallenge: codeChallenge,
  codeChallengeMethod: 'S256'
});
```

### Verificação de Code Verifier

```typescript
// No callback, usar codeVerifier
const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
  grantType: 'authorization_code',
  code: code as string,
  redirectUri: 'http://localhost:3000/auth/callback',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  codeVerifier: codeVerifier
});
```

## Escopos de Permissão

### Escopos Disponíveis

#### Bitbucket Cloud
- `read` - Leitura de repositórios e dados
- `write` - Escrita em repositórios
- `account` - Informações da conta
- `repository` - Acesso completo ao repositório
- `pullrequest` - Gerenciamento de pull requests
- `issue` - Gerenciamento de issues
- `snippet` - Gerenciamento de snippets

#### Bitbucket Data Center
- `read` - Leitura de dados
- `write` - Escrita de dados
- `admin` - Administração
- `project` - Acesso a projetos
- `repository` - Acesso a repositórios

### Configuração de Escopos

```typescript
// Escopo mínimo para leitura
const readScope = 'read';

// Escopo completo para desenvolvimento
const fullScope = 'read write account repository pullrequest issue';

// Escopo específico para CI/CD
const ciScope = 'read write repository pullrequest';
```

## Tratamento de Erros

### Erros Comuns

#### 1. Invalid Client
```typescript
try {
  const token = await mcp_bitbucket_auth_get_oauth_token({...});
} catch (error) {
  if (error.message.includes('invalid_client')) {
    console.error('Client ID ou Client Secret inválidos');
  }
}
```

#### 2. Invalid Grant
```typescript
try {
  const token = await mcp_bitbucket_auth_get_oauth_token({...});
} catch (error) {
  if (error.message.includes('invalid_grant')) {
    console.error('Código de autorização inválido ou expirado');
  }
}
```

#### 3. Unsupported Grant Type
```typescript
try {
  const token = await mcp_bitbucket_auth_get_oauth_token({...});
} catch (error) {
  if (error.message.includes('unsupported_grant_type')) {
    console.error('Tipo de grant não suportado pelo servidor');
  }
}
```

### Retry Strategy

```typescript
import { retryWithBackoff } from '@/utils/retry';

const tokenResponse = await retryWithBackoff(
  () => mcp_bitbucket_auth_get_oauth_token(params),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
);
```

## Monitoramento

### Métricas OAuth

```typescript
import { oauthMetrics } from '@/services/auth/metrics';

// Métricas de autorização
oauthMetrics.incrementAuthorizationAttempts();
oauthMetrics.incrementAuthorizationSuccesses();
oauthMetrics.incrementAuthorizationFailures();

// Métricas de token
oauthMetrics.incrementTokenRequests();
oauthMetrics.incrementTokenRefreshes();
oauthMetrics.incrementTokenRevocations();
```

### Logs de Auditoria

```typescript
import { auditLogger } from '@/services/auth/audit';

// Log de autorização
auditLogger.logAuthorization({
  clientId: 'your-client-id',
  userId: 'user123',
  scope: 'read write',
  success: true
});

// Log de token
auditLogger.logTokenExchange({
  grantType: 'authorization_code',
  clientId: 'your-client-id',
  success: true
});
```

## Exemplo Completo

### Servidor Express com OAuth

```typescript
import express from 'express';
import { authConfigurationManager } from '@/config/auth';
import { mcp_bitbucket_auth_get_oauth_authorization_url } from '@/tools/shared/auth/oauth-authorization';
import { mcp_bitbucket_auth_get_oauth_token } from '@/tools/shared/auth/oauth-token-exchange';
import { mcp_bitbucket_auth_create_session } from '@/tools/shared/auth/session-management';

const app = express();
const config = authConfigurationManager.loadConfiguration();

// Estado para proteção CSRF
const stateStore = new Map();

// Rota de autorização
app.get('/auth/authorize', async (req, res) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, Date.now());
    
    const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
      responseType: 'code',
      clientId: config.oauth.clientId,
      redirectUri: config.oauth.redirectUri,
      scope: config.oauth.scope,
      state: state
    });
    
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Callback OAuth
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Verificar state
    if (!stateStore.has(state as string)) {
      return res.status(400).send('Invalid state');
    }
    stateStore.delete(state as string);
    
    // Trocar código por token
    const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
      grantType: 'authorization_code',
      code: code as string,
      redirectUri: config.oauth.redirectUri,
      clientId: config.oauth.clientId,
      clientSecret: config.oauth.clientSecret
    });
    
    // Criar sessão
    const session = await mcp_bitbucket_auth_create_session({
      userId: tokenResponse.userId,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken
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

app.listen(3000, () => {
  console.log('OAuth server running on port 3000');
});
```

## Troubleshooting

### Problemas Comuns

1. **Redirect URI Mismatch**
   - Verificar se a URI de callback está configurada corretamente
   - Verificar se a URI no código corresponde à configuração

2. **Invalid Scope**
   - Verificar se os escopos solicitados são suportados
   - Verificar se a aplicação tem permissão para os escopos

3. **Token Expired**
   - Implementar refresh automático de tokens
   - Verificar configuração de expiração

4. **Rate Limiting**
   - Implementar retry com backoff exponencial
   - Verificar limites de rate limiting

### Debug

```bash
# Habilitar debug OAuth
export DEBUG=oauth:*
export LOG_LEVEL=debug

# Executar com logs detalhados
npm run dev
```

## Próximos Passos

1. **Gerenciar Sessões**: [Session Management](./session-management.md)
2. **Configurar Segurança**: [Security Configuration](./security.md)
3. **Troubleshooting**: [Troubleshooting Guide](./troubleshooting.md)
