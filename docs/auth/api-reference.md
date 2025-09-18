# API Reference - Autenticação

## Introdução

Esta documentação fornece referência completa para todas as ferramentas MCP de autenticação disponíveis no Bitbucket MCP Server.

## Ferramentas OAuth 2.0

### mcp_bitbucket_auth_get_oauth_authorization_url

Gera URL de autorização OAuth 2.0 com PKCE e proteção CSRF.

#### Parâmetros
```typescript
{
  responseType: 'code';           // Obrigatório: Tipo de resposta
  clientId: string;               // Obrigatório: ID do cliente OAuth
  redirectUri: string;            // Obrigatório: URI de redirecionamento
  scope: string;                  // Opcional: Escopo de permissões
  state?: string;                 // Opcional: Estado para proteção CSRF
  codeChallenge?: string;         // Opcional: Code challenge PKCE
  codeChallengeMethod?: 'S256';   // Opcional: Método do code challenge
}
```

#### Retorno
```typescript
{
  authorizationUrl: string;       // URL completa de autorização
  state: string;                  // Estado gerado (se não fornecido)
  codeChallenge: string;          // Code challenge gerado (se não fornecido)
  expiresAt: Date;               // Data de expiração do state
}
```

#### Exemplo
```typescript
const result = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: 'code',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'read write',
  state: 'random-state-string'
});

console.log('Authorization URL:', result.authorizationUrl);
```

### mcp_bitbucket_auth_get_oauth_token

Troca código de autorização por token de acesso OAuth 2.0.

#### Parâmetros
```typescript
{
  grantType: 'authorization_code' | 'refresh_token'; // Obrigatório: Tipo de grant
  code?: string;                  // Obrigatório para authorization_code
  redirectUri?: string;           // Obrigatório para authorization_code
  clientId: string;               // Obrigatório: ID do cliente
  clientSecret: string;           // Obrigatório: Secret do cliente
  refreshToken?: string;          // Obrigatório para refresh_token
  codeVerifier?: string;          // Opcional: Code verifier PKCE
}
```

#### Retorno
```typescript
{
  accessToken: string;            // Token de acesso
  refreshToken?: string;          // Token de refresh
  tokenType: 'Bearer';           // Tipo do token
  expiresIn: number;             // Tempo de expiração em segundos
  scope: string;                 // Escopo do token
  userId: number;                // ID do usuário
  expiresAt: Date;               // Data de expiração
}
```

#### Exemplo
```typescript
const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
  grantType: 'authorization_code',
  code: 'authorization-code',
  redirectUri: 'http://localhost:3000/callback',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  codeVerifier: 'code-verifier'
});

console.log('Access Token:', tokenResponse.accessToken);
```

### mcp_bitbucket_auth_refresh_oauth_token

Renova token de acesso usando refresh token.

#### Parâmetros
```typescript
{
  refreshToken: string;           // Obrigatório: Token de refresh
  clientId: string;               // Obrigatório: ID do cliente
  clientSecret: string;           // Obrigatório: Secret do cliente
}
```

#### Retorno
```typescript
{
  accessToken: string;            // Novo token de acesso
  refreshToken?: string;          // Novo token de refresh (se fornecido)
  tokenType: 'Bearer';           // Tipo do token
  expiresIn: number;             // Tempo de expiração em segundos
  scope: string;                 // Escopo do token
  expiresAt: Date;               // Data de expiração
}
```

#### Exemplo
```typescript
const newToken = await mcp_bitbucket_auth_refresh_oauth_token({
  refreshToken: 'your-refresh-token',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

console.log('New Access Token:', newToken.accessToken);
```

### mcp_bitbucket_auth_revoke_access_token

Revoga token de acesso OAuth 2.0.

#### Parâmetros
```typescript
{
  accessToken: string;            // Obrigatório: Token a ser revogado
}
```

#### Retorno
```typescript
{
  success: boolean;               // Indica se a revogação foi bem-sucedida
  revokedAt: Date;               // Data da revogação
}
```

#### Exemplo
```typescript
const result = await mcp_bitbucket_auth_revoke_access_token({
  accessToken: 'your-access-token'
});

console.log('Token revoked:', result.success);
```

## Ferramentas de Gerenciamento de Sessão

### mcp_bitbucket_auth_get_current_session

Obtém informações da sessão atual do usuário.

#### Parâmetros
```typescript
{
  // Nenhum parâmetro obrigatório
}
```

#### Retorno
```typescript
{
  sessionId: string;              // ID da sessão
  userId: number;                 // ID do usuário
  serverType: 'datacenter' | 'cloud'; // Tipo de servidor
  authenticationMethod: string;   // Método de autenticação
  createdAt: Date;               // Data de criação
  expiresAt: Date;               // Data de expiração
  lastActivity: Date;            // Última atividade
  isActive: boolean;             // Se a sessão está ativa
  isExpired: boolean;            // Se a sessão expirou
}
```

#### Exemplo
```typescript
const session = await mcp_bitbucket_auth_get_current_session();

if (session) {
  console.log('Current Session:', {
    sessionId: session.sessionId,
    userId: session.userId,
    expiresAt: session.expiresAt
  });
} else {
  console.log('No active session');
}
```

### mcp_bitbucket_auth_create_session

Cria uma nova sessão de usuário.

#### Parâmetros
```typescript
{
  userId: number;                 // Obrigatório: ID do usuário
  accessToken: string;            // Obrigatório: Token de acesso
  refreshToken?: string;          // Opcional: Token de refresh
  serverType: 'datacenter' | 'cloud'; // Obrigatório: Tipo de servidor
  authenticationMethod: 'oauth2' | 'personal_token' | 'app_password' | 'basic_auth'; // Obrigatório: Método de auth
  metadata?: {                    // Opcional: Metadados da sessão
    userAgent?: string;
    ipAddress?: string;
    deviceInfo?: string;
  };
}
```

#### Retorno
```typescript
{
  sessionId: string;              // ID da sessão criada
  userId: number;                 // ID do usuário
  serverType: string;             // Tipo de servidor
  authenticationMethod: string;   // Método de autenticação
  createdAt: Date;               // Data de criação
  expiresAt: Date;               // Data de expiração
  lastActivity: Date;            // Última atividade
  isActive: boolean;             // Se a sessão está ativa
}
```

#### Exemplo
```typescript
const session = await mcp_bitbucket_auth_create_session({
  userId: 12345,
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  serverType: 'cloud',
  authenticationMethod: 'oauth2',
  metadata: {
    userAgent: 'Mozilla/5.0...',
    ipAddress: '192.168.1.1'
  }
});

console.log('Session created:', session.sessionId);
```

### mcp_bitbucket_auth_refresh_session

Renova uma sessão existente.

#### Parâmetros
```typescript
{
  sessionId: string;              // Obrigatório: ID da sessão
}
```

#### Retorno
```typescript
{
  sessionId: string;              // ID da sessão
  userId: number;                 // ID do usuário
  newExpiresAt: Date;            // Nova data de expiração
  refreshedAt: Date;             // Data da renovação
  isActive: boolean;             // Se a sessão está ativa
}
```

#### Exemplo
```typescript
const refreshedSession = await mcp_bitbucket_auth_refresh_session({
  sessionId: 'your-session-id'
});

console.log('Session refreshed:', {
  newExpiresAt: refreshedSession.newExpiresAt,
  refreshedAt: refreshedSession.refreshedAt
});
```

### mcp_bitbucket_auth_revoke_session

Revoga uma sessão específica.

#### Parâmetros
```typescript
{
  sessionId: string;              // Obrigatório: ID da sessão
}
```

#### Retorno
```typescript
{
  success: boolean;               // Indica se a revogação foi bem-sucedida
  revokedAt: Date;               // Data da revogação
}
```

#### Exemplo
```typescript
const result = await mcp_bitbucket_auth_revoke_session({
  sessionId: 'your-session-id'
});

console.log('Session revoked:', result.success);
```

### mcp_bitbucket_auth_list_active_sessions

Lista todas as sessões ativas de um usuário.

#### Parâmetros
```typescript
{
  userId: number;                 // Obrigatório: ID do usuário
}
```

#### Retorno
```typescript
{
  sessions: Array<{
    sessionId: string;            // ID da sessão
    userId: number;               // ID do usuário
    serverType: string;           // Tipo de servidor
    authenticationMethod: string; // Método de autenticação
    createdAt: Date;             // Data de criação
    expiresAt: Date;             // Data de expiração
    lastActivity: Date;          // Última atividade
    isActive: boolean;           // Se a sessão está ativa
  }>;
  totalCount: number;             // Total de sessões
  activeCount: number;            // Sessões ativas
}
```

#### Exemplo
```typescript
const sessions = await mcp_bitbucket_auth_list_active_sessions({
  userId: 12345
});

console.log('Active Sessions:', {
  total: sessions.totalCount,
  active: sessions.activeCount,
  sessions: sessions.sessions.map(s => ({
    sessionId: s.sessionId,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt
  }))
});
```

## Ferramentas de Gerenciamento de Tokens

### mcp_bitbucket_auth_get_access_token_info

Obtém informações detalhadas de um token de acesso.

#### Parâmetros
```typescript
{
  accessToken: string;            // Obrigatório: Token de acesso
}
```

#### Retorno
```typescript
{
  tokenId: string;                // ID do token
  userId: number;                 // ID do usuário
  scopes: string[];               // Escopos do token
  expiresAt: Date;               // Data de expiração
  createdAt: Date;               // Data de criação
  lastUsed: Date;                // Último uso
  isActive: boolean;             // Se o token está ativo
  isExpired: boolean;            // Se o token expirou
  permissions: {                  // Permissões detalhadas
    read: boolean;
    write: boolean;
    admin: boolean;
  };
}
```

#### Exemplo
```typescript
const tokenInfo = await mcp_bitbucket_auth_get_access_token_info({
  accessToken: 'your-access-token'
});

console.log('Token Info:', {
  userId: tokenInfo.userId,
  scopes: tokenInfo.scopes,
  expiresAt: tokenInfo.expiresAt,
  isExpired: tokenInfo.isExpired
});
```

## Ferramentas de Aplicações OAuth (Data Center)

### mcp_bitbucket_auth_create_oauth_application

Cria uma nova aplicação OAuth no Bitbucket Data Center.

#### Parâmetros
```typescript
{
  name: string;                   // Obrigatório: Nome da aplicação
  description?: string;           // Opcional: Descrição
  url?: string;                   // Opcional: URL da aplicação
  callbackUrl?: string;           // Opcional: URL de callback
}
```

#### Retorno
```typescript
{
  applicationId: string;          // ID da aplicação
  name: string;                   // Nome da aplicação
  description?: string;           // Descrição
  url?: string;                   // URL da aplicação
  callbackUrl?: string;           // URL de callback
  clientId: string;               // Client ID gerado
  clientSecret: string;           // Client Secret gerado
  createdAt: Date;               // Data de criação
  isActive: boolean;             // Se a aplicação está ativa
}
```

#### Exemplo
```typescript
const application = await mcp_bitbucket_auth_create_oauth_application({
  name: 'My Application',
  description: 'Application for API access',
  url: 'https://myapp.com',
  callbackUrl: 'https://myapp.com/callback'
});

console.log('OAuth Application created:', {
  applicationId: application.applicationId,
  clientId: application.clientId,
  clientSecret: application.clientSecret
});
```

### mcp_bitbucket_auth_get_oauth_application

Obtém informações de uma aplicação OAuth específica.

#### Parâmetros
```typescript
{
  applicationId: string;          // Obrigatório: ID da aplicação
}
```

#### Retorno
```typescript
{
  applicationId: string;          // ID da aplicação
  name: string;                   // Nome da aplicação
  description?: string;           // Descrição
  url?: string;                   // URL da aplicação
  callbackUrl?: string;           // URL de callback
  clientId: string;               // Client ID
  createdAt: Date;               // Data de criação
  lastModified: Date;            // Última modificação
  isActive: boolean;             // Se a aplicação está ativa
  usage: {                        // Estatísticas de uso
    totalRequests: number;
    lastRequest: Date;
    activeTokens: number;
  };
}
```

#### Exemplo
```typescript
const application = await mcp_bitbucket_auth_get_oauth_application({
  applicationId: 'your-application-id'
});

console.log('OAuth Application:', {
  name: application.name,
  clientId: application.clientId,
  isActive: application.isActive,
  usage: application.usage
});
```

### mcp_bitbucket_auth_update_oauth_application

Atualiza uma aplicação OAuth existente.

#### Parâmetros
```typescript
{
  applicationId: string;          // Obrigatório: ID da aplicação
  name?: string;                  // Opcional: Novo nome
  description?: string;           // Opcional: Nova descrição
  url?: string;                   // Opcional: Nova URL
  callbackUrl?: string;           // Opcional: Nova URL de callback
}
```

#### Retorno
```typescript
{
  applicationId: string;          // ID da aplicação
  name: string;                   // Nome atualizado
  description?: string;           // Descrição atualizada
  url?: string;                   // URL atualizada
  callbackUrl?: string;           // URL de callback atualizada
  lastModified: Date;            // Data da última modificação
  isActive: boolean;             // Se a aplicação está ativa
}
```

#### Exemplo
```typescript
const updatedApp = await mcp_bitbucket_auth_update_oauth_application({
  applicationId: 'your-application-id',
  name: 'Updated Application Name',
  description: 'Updated description',
  callbackUrl: 'https://newcallback.com/callback'
});

console.log('Application updated:', updatedApp.name);
```

### mcp_bitbucket_auth_delete_oauth_application

Remove uma aplicação OAuth.

#### Parâmetros
```typescript
{
  applicationId: string;          // Obrigatório: ID da aplicação
}
```

#### Retorno
```typescript
{
  success: boolean;               // Indica se a remoção foi bem-sucedida
  deletedAt: Date;               // Data da remoção
  applicationId: string;          // ID da aplicação removida
}
```

#### Exemplo
```typescript
const result = await mcp_bitbucket_auth_delete_oauth_application({
  applicationId: 'your-application-id'
});

console.log('Application deleted:', result.success);
```

### mcp_bitbucket_auth_list_oauth_applications

Lista todas as aplicações OAuth do usuário.

#### Parâmetros
```typescript
{
  // Nenhum parâmetro obrigatório
}
```

#### Retorno
```typescript
{
  applications: Array<{
    applicationId: string;        // ID da aplicação
    name: string;                 // Nome da aplicação
    description?: string;         // Descrição
    url?: string;                 // URL da aplicação
    callbackUrl?: string;         // URL de callback
    clientId: string;             // Client ID
    createdAt: Date;             // Data de criação
    isActive: boolean;           // Se a aplicação está ativa
  }>;
  totalCount: number;             // Total de aplicações
  activeCount: number;            // Aplicações ativas
}
```

#### Exemplo
```typescript
const applications = await mcp_bitbucket_auth_list_oauth_applications();

console.log('OAuth Applications:', {
  total: applications.totalCount,
  active: applications.activeCount,
  applications: applications.applications.map(app => ({
    applicationId: app.applicationId,
    name: app.name,
    isActive: app.isActive
  }))
});
```

## Códigos de Erro

### Erros de Autenticação

| Código | Descrição | Solução |
|--------|-----------|---------|
| `INVALID_CLIENT` | Client ID ou Secret inválidos | Verificar credenciais OAuth |
| `INVALID_GRANT` | Código de autorização inválido | Solicitar novo código |
| `UNAUTHORIZED` | Token inválido ou expirado | Renovar token |
| `INSUFFICIENT_SCOPE` | Escopo insuficiente | Verificar permissões |
| `RATE_LIMIT_EXCEEDED` | Limite de requisições excedido | Aguardar e tentar novamente |

### Erros de Sessão

| Código | Descrição | Solução |
|--------|-----------|---------|
| `SESSION_EXPIRED` | Sessão expirada | Renovar sessão |
| `SESSION_NOT_FOUND` | Sessão não encontrada | Criar nova sessão |
| `SESSION_INVALID` | Sessão inválida | Verificar token JWT |
| `TOO_MANY_SESSIONS` | Muitas sessões ativas | Revogar sessões antigas |

### Erros de Configuração

| Código | Descrição | Solução |
|--------|-----------|---------|
| `CONFIG_NOT_FOUND` | Configuração não encontrada | Verificar variáveis de ambiente |
| `INVALID_CONFIG` | Configuração inválida | Validar configuração |
| `SERVER_DETECTION_FAILED` | Falha na detecção de servidor | Verificar conectividade |

## Exemplos de Uso

### Fluxo OAuth Completo

```typescript
import {
  mcp_bitbucket_auth_get_oauth_authorization_url,
  mcp_bitbucket_auth_get_oauth_token,
  mcp_bitbucket_auth_create_session
} from '@/tools/shared/auth';

// 1. Gerar URL de autorização
const authUrl = await mcp_bitbucket_auth_get_oauth_authorization_url({
  responseType: 'code',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'read write'
});

// 2. Usuário autoriza e retorna com código
const code = 'authorization-code-from-callback';

// 3. Trocar código por token
const tokenResponse = await mcp_bitbucket_auth_get_oauth_token({
  grantType: 'authorization_code',
  code: code,
  redirectUri: 'http://localhost:3000/callback',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

// 4. Criar sessão
const session = await mcp_bitbucket_auth_create_session({
  userId: tokenResponse.userId,
  accessToken: tokenResponse.accessToken,
  refreshToken: tokenResponse.refreshToken,
  serverType: 'cloud',
  authenticationMethod: 'oauth2'
});

console.log('Authentication complete:', session.sessionId);
```

### Gerenciamento de Sessões

```typescript
import {
  mcp_bitbucket_auth_get_current_session,
  mcp_bitbucket_auth_refresh_session,
  mcp_bitbucket_auth_list_active_sessions
} from '@/tools/shared/auth';

// Verificar sessão atual
const currentSession = await mcp_bitbucket_auth_get_current_session();

if (currentSession && currentSession.isExpired) {
  // Renovar sessão se expirada
  const refreshedSession = await mcp_bitbucket_auth_refresh_session({
    sessionId: currentSession.sessionId
  });
  
  console.log('Session refreshed:', refreshedSession.newExpiresAt);
}

// Listar todas as sessões ativas
const activeSessions = await mcp_bitbucket_auth_list_active_sessions({
  userId: currentSession.userId
});

console.log('Active sessions:', activeSessions.totalCount);
```

### Gerenciamento de Aplicações OAuth

```typescript
import {
  mcp_bitbucket_auth_create_oauth_application,
  mcp_bitbucket_auth_list_oauth_applications,
  mcp_bitbucket_auth_delete_oauth_application
} from '@/tools/datacenter/auth';

// Criar nova aplicação
const newApp = await mcp_bitbucket_auth_create_oauth_application({
  name: 'My API Application',
  description: 'Application for accessing Bitbucket API',
  callbackUrl: 'https://myapp.com/oauth/callback'
});

// Listar aplicações existentes
const applications = await mcp_bitbucket_auth_list_oauth_applications();

// Remover aplicação se necessário
if (applications.applications.length > 5) {
  const oldestApp = applications.applications[0];
  await mcp_bitbucket_auth_delete_oauth_application({
    applicationId: oldestApp.applicationId
  });
}
```

## Limitações e Considerações

### Rate Limiting
- **OAuth**: 100 requisições por minuto por IP
- **Sessões**: 10 criações por minuto por usuário
- **Aplicações**: 5 criações por hora por usuário

### Timeouts
- **Detecção de servidor**: 30 segundos
- **Autenticação OAuth**: 60 segundos
- **Operações de sessão**: 10 segundos

### Limites de Cache
- **Configurações de servidor**: 100 itens, 5 minutos
- **Sessões**: 1000 itens, 1 hora
- **Tokens**: 500 itens, 30 minutos
- **Informações do usuário**: 200 itens, 5 minutos

### Segurança
- **JWT**: Algoritmos HS256, RS256, ES256
- **PKCE**: Obrigatório para OAuth 2.0
- **CSRF**: State parameter obrigatório
- **HTTPS**: Obrigatório em produção
