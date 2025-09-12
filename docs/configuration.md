# Configuração do Bitbucket MCP Server

Este documento descreve todas as opções de configuração disponíveis para o Bitbucket MCP Server.

## 📋 Índice

- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Configuração do Servidor](#configuração-do-servidor)
- [Configuração do Bitbucket](#configuração-do-bitbucket)
- [Autenticação](#autenticação)
- [Cache](#cache)
- [Logging](#logging)
- [Performance](#performance)
- [Segurança](#segurança)
- [Transportes](#transportes)

## 🔧 Variáveis de Ambiente

### Configuração do Servidor

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `NODE_ENV` | string | `development` | Ambiente de execução (`development`, `production`, `test`) |
| `PORT` | number | `3000` | Porta do servidor HTTP |
| `HOST` | string | `localhost` | Host do servidor |
| `LOG_LEVEL` | string | `info` | Nível de log (`error`, `warn`, `info`, `debug`) |

### Configuração do Bitbucket

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `BITBUCKET_URL` | string | - | URL da instância do Bitbucket |
| `BITBUCKET_TYPE` | string | `datacenter` | Tipo do servidor (`datacenter`, `cloud`) |
| `BITBUCKET_VERSION` | string | `7.16` | Versão do Data Center (ignorado para Cloud) |
| `BITBUCKET_TIMEOUT` | number | `30000` | Timeout das requisições em ms |

### Autenticação

#### OAuth 2.0 (Recomendado)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `BITBUCKET_OAUTH_CLIENT_ID` | string | ID do cliente OAuth |
| `BITBUCKET_OAUTH_CLIENT_SECRET` | string | Segredo do cliente OAuth |
| `BITBUCKET_OAUTH_REDIRECT_URI` | string | URI de redirecionamento |

#### Personal Access Token

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `BITBUCKET_PERSONAL_TOKEN` | string | Token de acesso pessoal |

#### App Password

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `BITBUCKET_APP_PASSWORD` | string | Senha de aplicativo |

#### Basic Auth (Fallback)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `BITBUCKET_USERNAME` | string | Nome de usuário |
| `BITBUCKET_PASSWORD` | string | Senha |

### Cache

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CACHE_TYPE` | string | `memory` | Tipo de cache (`memory`, `redis`) |
| `CACHE_TTL` | number | `300` | TTL padrão em segundos |
| `CACHE_MAX_SIZE` | number | `100` | Tamanho máximo em MB |

#### Redis (Opcional)

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `REDIS_HOST` | string | `localhost` | Host do Redis |
| `REDIS_PORT` | number | `6379` | Porta do Redis |
| `REDIS_PASSWORD` | string | - | Senha do Redis |
| `REDIS_DB` | number | `0` | Database do Redis |

### Logging

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `LOG_FORMAT` | string | `json` | Formato dos logs (`json`, `simple`) |
| `LOG_FILE` | string | - | Arquivo de log (opcional) |
| `LOG_MAX_SIZE` | string | `10m` | Tamanho máximo do arquivo |
| `LOG_MAX_FILES` | number | `5` | Número máximo de arquivos |

### Performance

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `METRICS_ENABLED` | boolean | `true` | Habilitar métricas |
| `METRICS_INTERVAL` | number | `5000` | Intervalo de coleta em ms |
| `RATE_LIMIT_WINDOW` | number | `60000` | Janela de rate limiting em ms |
| `RATE_LIMIT_MAX_REQUESTS` | number | `100` | Máximo de requisições por janela |

### Segurança

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CORS_ORIGIN` | string | `*` | Origens permitidas para CORS |
| `CORS_CREDENTIALS` | boolean | `false` | Permitir credenciais |
| `HELMET_ENABLED` | boolean | `true` | Habilitar Helmet |
| `COMPRESSION_ENABLED` | boolean | `true` | Habilitar compressão |

### Transportes

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `TRANSPORT_STDIO` | boolean | `true` | Habilitar transporte STDIO |
| `TRANSPORT_HTTP` | boolean | `true` | Habilitar transporte HTTP |
| `TRANSPORT_SSE` | boolean | `true` | Habilitar transporte SSE |
| `TRANSPORT_STREAMING` | boolean | `true` | Habilitar transporte HTTP Streaming |

## 📝 Exemplo de Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Configuração do Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Configuração do Bitbucket
BITBUCKET_URL=https://bitbucket.company.com
BITBUCKET_TYPE=datacenter
BITBUCKET_VERSION=8.0
BITBUCKET_TIMEOUT=30000

# Autenticação OAuth 2.0
BITBUCKET_OAUTH_CLIENT_ID=your_client_id
BITBUCKET_OAUTH_CLIENT_SECRET=your_client_secret
BITBUCKET_OAUTH_REDIRECT_URI=https://your-app.com/auth/callback

# Cache Redis
CACHE_TYPE=redis
CACHE_TTL=600
CACHE_MAX_SIZE=200
REDIS_HOST=redis.company.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Logging
LOG_FORMAT=json
LOG_FILE=/var/log/bitbucket-mcp-server.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=10

# Performance
METRICS_ENABLED=true
METRICS_INTERVAL=10000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=200

# Segurança
CORS_ORIGIN=https://your-frontend.com
CORS_CREDENTIALS=true
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Transportes
TRANSPORT_STDIO=true
TRANSPORT_HTTP=true
TRANSPORT_SSE=true
TRANSPORT_STREAMING=true
```

## 🔐 Hierarquia de Autenticação

O servidor tenta os métodos de autenticação na seguinte ordem:

1. **OAuth 2.0** (Prioridade máxima)
2. **Personal Access Token**
3. **App Password**
4. **Basic Auth** (Fallback)

### Configuração OAuth 2.0

1. Acesse as configurações do Bitbucket
2. Vá para "Application Links" (Data Center) ou "OAuth consumers" (Cloud)
3. Crie uma nova aplicação OAuth
4. Configure as URLs de callback
5. Use o Client ID e Client Secret nas variáveis de ambiente

### Configuração Personal Access Token

1. Acesse suas configurações de usuário
2. Vá para "App passwords" ou "Personal access tokens"
3. Crie um novo token com as permissões necessárias
4. Use o token na variável `BITBUCKET_PERSONAL_TOKEN`

## 🚀 Configuração de Produção

### Recomendações de Segurança

- Use HTTPS em produção
- Configure CORS adequadamente
- Use Redis para cache em produção
- Configure logs estruturados
- Monitore métricas de performance
- Use OAuth 2.0 para autenticação

### Configuração de Performance

- Ajuste o TTL do cache baseado no uso
- Configure rate limiting apropriado
- Monitore uso de memória e CPU
- Use circuit breakers para resiliência

### Configuração de Logging

- Use formato JSON para logs estruturados
- Configure rotação de logs
- Monitore níveis de log apropriados
- Configure alertas baseados em logs

## 🔧 Validação de Configuração

O servidor valida automaticamente todas as configurações na inicialização. Erros de configuração são reportados nos logs.

Para validar manualmente:

```bash
npm run validate:constitution
```

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**: Verifique as credenciais e permissões
2. **Timeout de conexão**: Ajuste `BITBUCKET_TIMEOUT`
3. **Problemas de cache**: Verifique configuração do Redis
4. **Logs não aparecem**: Verifique `LOG_LEVEL` e `LOG_FILE`

### Logs de Debug

Para debug detalhado, configure:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

Isso habilitará logs detalhados de todas as operações.
