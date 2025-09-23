# Quickstart Guide: Bitbucket MCP Server

Este guia fornece instruções rápidas para configurar e executar o servidor MCP do Bitbucket.

## Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Git

## Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd bitbucket-mcp-server
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Compile o projeto:**
```bash
npm run build
```

## Execução

### Modo Desenvolvimento

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

### Com Transport HTTP

```bash
npm start -- --port 8080 --host localhost
```

### Com Logging Debug

```bash
npm start -- --log-level debug
```

## Verificação de Funcionamento

### 1. Teste de Conectividade

Execute o comando ping para verificar se o servidor está respondendo:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "ping"}' | npm start
```

**Resultado esperado:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "pong": true,
    "timestamp": "2025-09-23T17:15:00.000Z",
    "serverTime": 1758647700000
  }
}
```

### 2. Listagem de Ferramentas

Verifique as ferramentas disponíveis:

```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | npm start
```

**Resultado esperado:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "ping",
        "description": "Ping the server to check connectivity",
        "parameters": []
      },
      {
        "name": "health_check",
        "description": "Check server health status",
        "parameters": []
      }
    ]
  }
}
```

### 3. Verificação de Saúde

Execute uma verificação de saúde do servidor:

```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "health_check"}' | npm start
```

**Resultado esperado:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "status": "healthy",
    "timestamp": "2025-09-23T17:15:00.000Z",
    "components": {
      "server": true,
      "transports": {"stdio": true},
      "tools": true,
      "memory": true,
      "sessions": true
    },
    "metrics": {
      "memoryUsage": 52428800,
      "memoryLimit": 536870912,
      "activeSessions": 0,
      "maxSessions": 100,
      "errorRate": 0
    },
    "issues": []
  }
}
```

## Configuração

### Variáveis de Ambiente

```bash
# Limite de memória (em bytes)
export MCP_MEMORY_LIMIT=536870912

# Nível de log
export MCP_LOG_LEVEL=info

# Máximo de clientes
export MCP_MAX_CLIENTS=100

# Timeout de cliente (em ms)
export MCP_CLIENT_TIMEOUT=300000
```

### Arquivo de Configuração

Crie um arquivo `config.json`:

```json
{
  "name": "Bitbucket MCP Server",
  "version": "1.0.0",
  "description": "Model Context Protocol server for Bitbucket integration",
  "maxClients": 100,
  "clientTimeout": 300000,
  "memoryLimit": 536870912,
  "logging": {
    "level": "info",
    "file": "logs/mcp-server.log",
    "console": true
  },
  "transports": [
    {
      "type": "stdio",
      "timeout": 30000
    }
  ],
  "tools": {
    "autoRegister": true,
    "selectiveLoading": true,
    "validationEnabled": true
  }
}
```

## Testes

### Executar Todos os Testes

```bash
npm test
```

### Executar Testes com Cobertura

```bash
npm run test:coverage
```

### Executar Testes Específicos

```bash
# Testes unitários
npm test -- tests/unit/

# Testes de integração
npm test -- tests/integration/

# Testes de conformidade
npm test -- tests/compliance/
```

## Monitoramento

### Logs

Os logs são salvos em `logs/mcp-server.log` por padrão. Para visualizar em tempo real:

```bash
tail -f logs/mcp-server.log
```

### Métricas de Performance

O servidor coleta automaticamente métricas de:
- Uso de memória
- Tempo de resposta
- Taxa de erro
- Sessões ativas
- Ferramentas executadas

### Health Check

Execute periodicamente para monitorar a saúde do servidor:

```bash
curl -X POST http://localhost:8080/health \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "health_check"}'
```

## Solução de Problemas

### Erro de Memória

Se o servidor exceder o limite de memória:

1. Verifique o uso atual: `npm start -- --log-level debug`
2. Ajuste o limite: `export MCP_MEMORY_LIMIT=1073741824` (1GB)
3. Reinicie o servidor

### Erro de Conexão

Se houver problemas de conexão:

1. Verifique se a porta está disponível
2. Confirme as configurações de transporte
3. Verifique os logs para erros específicos

### Erro de Ferramentas

Se as ferramentas não estiverem funcionando:

1. Verifique se estão registradas: `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm start`
2. Confirme a validação de parâmetros
3. Verifique os logs de erro

## Próximos Passos

Após verificar que a infraestrutura está funcionando:

1. **Implementar autenticação** (Feature 002)
2. **Adicionar ferramentas do Bitbucket** (Feature 003)
3. **Configurar testes avançados** (Feature 004)

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs do servidor
2. Execute os testes para identificar problemas
3. Consulte a documentação da API
4. Abra uma issue no repositório

---

**Status da Infraestrutura:** ✅ Funcional
**Última Verificação:** 2025-09-23
**Versão:** 1.0.0