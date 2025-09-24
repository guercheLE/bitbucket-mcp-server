# Pipeline Management

Este documento descreve o sistema de gerenciamento de pipelines do Bitbucket MCP Server, incluindo funcionalidades, exemplos de uso e melhores práticas.

## Visão Geral

O sistema de gerenciamento de pipelines fornece funcionalidades abrangentes para criar, configurar, executar e monitorar pipelines de CI/CD no Bitbucket. Ele suporta tanto Bitbucket Data Center quanto Cloud, com recursos avançados como monitoramento em tempo real, gerenciamento de permissões e integração com webhooks.

## Funcionalidades Principais

### 1. Criação e Configuração de Pipelines
- Criação de pipelines com configurações personalizáveis
- Configuração de triggers (push, pull request, manual, agendado, webhook)
- Definição de ambientes e variáveis
- Configuração de etapas e workflows
- Gerenciamento de notificações

### 2. Execução de Pipelines
- Iniciar, parar e reiniciar execuções de pipeline
- Configuração de parâmetros de execução
- Suporte a diferentes ambientes e branches
- Rastreamento de progresso em tempo real

### 3. Monitoramento e Status
- Monitoramento em tempo real do status de pipelines
- Rastreamento de progresso e métricas
- Acesso a logs e artefatos
- Alertas e notificações

### 4. Gerenciamento de Permissões
- Controle de acesso baseado em funções
- Gerenciamento de usuários e grupos
- Permissões granulares por pipeline
- Auditoria de acesso

### 5. Integração com Webhooks
- Configuração de webhooks para triggers automáticos
- Suporte a múltiplos tipos de eventos
- Segurança avançada com assinaturas e autenticação
- Políticas de retry e tratamento de erros

## Ferramentas MCP Disponíveis

### create_pipeline
Cria um novo pipeline de CI/CD com configurações personalizáveis.

**Parâmetros:**
- `repository`: Identificador do repositório
- `name`: Nome do pipeline
- `description`: Descrição opcional
- `configuration`: Configurações do pipeline
- `permissions`: Permissões de acesso

**Exemplo:**
```json
{
  "repository": "workspace/my-repo",
  "name": "CI/CD Pipeline",
  "description": "Pipeline principal para build e deploy",
  "configuration": {
    "triggers": ["push", "pull_request"],
    "environment": "production",
    "variables": {
      "NODE_ENV": "production",
      "BUILD_VERSION": "latest"
    },
    "steps": [
      {
        "name": "Install Dependencies",
        "type": "build",
        "command": "npm install",
        "timeout": 300
      },
      {
        "name": "Run Tests",
        "type": "test",
        "command": "npm test",
        "timeout": 600
      },
      {
        "name": "Build Application",
        "type": "build",
        "command": "npm run build",
        "timeout": 900
      }
    ],
    "notifications": {
      "email": ["team@example.com"],
      "webhook": "https://hooks.slack.com/services/...",
      "slack": "#builds"
    }
  },
  "permissions": {
    "users": ["admin@example.com"],
    "groups": ["developers"],
    "public": false
  }
}
```

### execute_pipeline
Executa operações em pipelines (iniciar, parar, reiniciar).

**Parâmetros:**
- `pipeline_id`: ID do pipeline
- `repository`: Identificador do repositório
- `action`: Ação a executar (start, stop, restart)
- `parameters`: Parâmetros opcionais de execução

**Exemplo:**
```json
{
  "pipeline_id": "pipeline-123",
  "repository": "workspace/my-repo",
  "action": "start",
  "parameters": {
    "branch": "main",
    "variables": {
      "DEPLOY_ENV": "staging"
    },
    "environment": "staging",
    "timeout": 1800
  }
}
```

### monitor_pipeline
Monitora o status de execução de pipelines em tempo real.

**Parâmetros:**
- `pipeline_id`: ID do pipeline
- `repository`: Identificador do repositório
- `execution_id`: ID específico da execução (opcional)
- `include_logs`: Incluir logs na resposta
- `include_artifacts`: Incluir artefatos na resposta
- `poll_interval`: Intervalo de polling em segundos

**Exemplo:**
```json
{
  "pipeline_id": "pipeline-123",
  "repository": "workspace/my-repo",
  "execution_id": "run-456",
  "include_logs": true,
  "include_artifacts": true,
  "poll_interval": 30
}
```

### manage_pipeline_permissions
Gerencia permissões de usuários e grupos para pipelines.

**Parâmetros:**
- `pipeline_id`: ID do pipeline
- `repository`: Identificador do repositório
- `action`: Ação a executar (grant, revoke, list, update, audit)
- `permissions`: Lista de permissões
- `options`: Opções de configuração

**Exemplo:**
```json
{
  "pipeline_id": "pipeline-123",
  "repository": "workspace/my-repo",
  "action": "grant",
  "permissions": [
    {
      "user": "developer@example.com",
      "role": "execute",
      "scope": "pipeline",
      "conditions": {
        "branches": ["main", "develop"],
        "time_restrictions": {
          "start_time": "09:00",
          "end_time": "17:00",
          "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
      }
    }
  ],
  "options": {
    "notify_users": true,
    "audit_changes": true
  }
}
```

### configure_pipeline_webhooks
Configura webhooks para triggers automáticos de pipelines.

**Parâmetros:**
- `pipeline_id`: ID do pipeline
- `repository`: Identificador do repositório
- `webhooks`: Lista de configurações de webhook
- `options`: Opções de configuração

**Exemplo:**
```json
{
  "pipeline_id": "pipeline-123",
  "repository": "workspace/my-repo",
  "webhooks": [
    {
      "name": "Slack Notifications",
      "url": "https://hooks.slack.com/services/...",
      "events": ["pipeline_started", "pipeline_completed", "pipeline_failed"],
      "enabled": true,
      "security": {
        "secret": "webhook-secret-key",
        "signature_header": "X-Hub-Signature-256",
        "ssl_verification": true,
        "authentication": {
          "type": "bearer",
          "token": "slack-bot-token"
        }
      },
      "retry_policy": {
        "max_attempts": 3,
        "backoff_strategy": "exponential",
        "timeout": 30
      },
      "filters": {
        "branches": ["main", "develop"],
        "environments": ["production", "staging"]
      }
    }
  ],
  "options": {
    "validate_webhooks": true,
    "test_webhooks": true,
    "enable_logging": true
  }
}
```

## Exemplos de Uso

### 1. Configuração Completa de Pipeline

```typescript
// 1. Criar pipeline
const createResult = await executeCreatePipeline({
  repository: "workspace/my-repo",
  name: "Full CI/CD Pipeline",
  description: "Pipeline completo com build, test e deploy",
  configuration: {
    triggers: ["push", "pull_request"],
    environment: "production",
    variables: {
      NODE_ENV: "production",
      BUILD_VERSION: "latest"
    },
    steps: [
      {
        name: "Checkout Code",
        type: "build",
        command: "git checkout $BITBUCKET_COMMIT",
        timeout: 60
      },
      {
        name: "Install Dependencies",
        type: "build",
        command: "npm ci",
        timeout: 300
      },
      {
        name: "Run Linting",
        type: "test",
        command: "npm run lint",
        timeout: 120
      },
      {
        name: "Run Tests",
        type: "test",
        command: "npm test",
        timeout: 600
      },
      {
        name: "Build Application",
        type: "build",
        command: "npm run build",
        timeout: 900
      },
      {
        name: "Deploy to Staging",
        type: "deploy",
        command: "npm run deploy:staging",
        timeout: 1200
      }
    ],
    notifications: {
      email: ["team@example.com"],
      webhook: "https://hooks.slack.com/services/...",
      slack: "#deployments"
    }
  },
  permissions: {
    users: ["admin@example.com"],
    groups: ["developers"],
    public: false
  }
});

// 2. Configurar webhooks
const webhookResult = await executeConfigurePipelineWebhooks({
  pipeline_id: createResult.pipeline.id,
  repository: "workspace/my-repo",
  webhooks: [
    {
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/...",
      events: ["pipeline_started", "pipeline_completed", "pipeline_failed"],
      enabled: true,
      security: {
        secret: "webhook-secret",
        ssl_verification: true
      }
    }
  ],
  options: {
    validate_webhooks: true,
    test_webhooks: true
  }
});

// 3. Executar pipeline
const runResult = await executeExecutePipeline({
  pipeline_id: createResult.pipeline.id,
  repository: "workspace/my-repo",
  action: "start",
  parameters: {
    branch: "main",
    variables: {
      DEPLOY_ENV: "production"
    }
  }
});

// 4. Monitorar execução
const monitorResult = await executeMonitorPipeline({
  pipeline_id: createResult.pipeline.id,
  repository: "workspace/my-repo",
  execution_id: runResult.execution.id,
  include_logs: true,
  include_artifacts: true,
  poll_interval: 30
});
```

### 2. Gerenciamento de Permissões

```typescript
// Conceder permissões para desenvolvedores
await executeManagePipelinePermissions({
  pipeline_id: "pipeline-123",
  repository: "workspace/my-repo",
  action: "grant",
  permissions: [
    {
      group: "developers",
      role: "execute",
      scope: "pipeline",
      conditions: {
        branches: ["main", "develop"],
        time_restrictions: {
          start_time: "09:00",
          end_time: "17:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
      }
    },
    {
      user: "viewer@example.com",
      role: "view",
      scope: "pipeline"
    }
  ],
  options: {
    notify_users: true,
    audit_changes: true
  }
});

// Listar permissões atuais
const permissions = await executeManagePipelinePermissions({
  pipeline_id: "pipeline-123",
  repository: "workspace/my-repo",
  action: "list"
});

// Auditoria de permissões
const audit = await executeManagePipelinePermissions({
  pipeline_id: "pipeline-123",
  repository: "workspace/my-repo",
  action: "audit"
});
```

### 3. Monitoramento Avançado

```typescript
// Monitorar pipeline com logs e artefatos
const monitoring = await executeMonitorPipeline({
  pipeline_id: "pipeline-123",
  repository: "workspace/my-repo",
  include_logs: true,
  include_artifacts: true,
  poll_interval: 15
});

console.log(`Status: ${monitoring.monitoring.status}`);
console.log(`Progresso: ${monitoring.monitoring.progress.percentage}%`);
console.log(`Etapa atual: ${monitoring.monitoring.progress.current_step}`);

if (monitoring.monitoring.logs) {
  monitoring.monitoring.logs.forEach(log => {
    console.log(`[${log.timestamp}] ${log.level}: ${log.message}`);
  });
}

if (monitoring.monitoring.artifacts) {
  monitoring.monitoring.artifacts.forEach(artifact => {
    console.log(`Artefato: ${artifact.name} (${artifact.size} bytes)`);
    console.log(`URL: ${artifact.url}`);
  });
}
```

## Melhores Práticas

### 1. Configuração de Pipelines
- Use nomes descritivos para pipelines e etapas
- Configure timeouts apropriados para cada etapa
- Use variáveis de ambiente para configurações sensíveis
- Implemente etapas de rollback para deploys

### 2. Gerenciamento de Permissões
- Use o princípio do menor privilégio
- Configure restrições de tempo e branch quando apropriado
- Mantenha auditoria de todas as mudanças de permissão
- Use grupos em vez de usuários individuais quando possível

### 3. Monitoramento
- Configure alertas para falhas de pipeline
- Monitore métricas de performance regularmente
- Mantenha logs de execução para debugging
- Use artefatos para distribuição de builds

### 4. Webhooks
- Use HTTPS para todos os webhooks
- Configure assinaturas para validação de segurança
- Implemente políticas de retry apropriadas
- Teste webhooks antes de ativá-los em produção

### 5. Segurança
- Nunca exponha tokens ou senhas em logs
- Use variáveis de ambiente para credenciais
- Configure SSL/TLS para todas as comunicações
- Implemente autenticação adequada para webhooks

## Tratamento de Erros

O sistema de pipeline management inclui tratamento abrangente de erros:

### Códigos de Erro Comuns
- `PIPELINE_NOT_FOUND`: Pipeline não encontrado
- `REPOSITORY_ACCESS_DENIED`: Acesso negado ao repositório
- `INVALID_CONFIGURATION`: Configuração inválida
- `PERMISSION_DENIED`: Permissão insuficiente
- `WEBHOOK_VALIDATION_FAILED`: Falha na validação de webhook

### Exemplo de Tratamento de Erros

```typescript
try {
  const result = await executeCreatePipeline(input);
  if (!result.success) {
    console.error(`Erro ao criar pipeline: ${result.error}`);
    // Tratar erro específico
    if (result.error.includes('REPOSITORY_ACCESS_DENIED')) {
      // Verificar permissões do usuário
    } else if (result.error.includes('INVALID_CONFIGURATION')) {
      // Validar configuração
    }
  }
} catch (error) {
  console.error('Erro inesperado:', error);
}
```

## Limitações e Considerações

### Limitações
- Máximo de 50 etapas por pipeline
- Máximo de 100 variáveis de ambiente
- Timeout máximo de 3600 segundos por etapa
- Máximo de 10 tentativas de retry para webhooks

### Considerações de Performance
- Use cache quando apropriado
- Configure intervalos de polling adequados
- Monitore uso de memória e CPU
- Implemente rate limiting para webhooks

### Compatibilidade
- Suporta Bitbucket Data Center 7.16+
- Suporta Bitbucket Cloud API 2.0
- Requer Node.js 18+
- Compatível com TypeScript 4.5+

## Suporte e Troubleshooting

### Logs
O sistema gera logs detalhados para debugging:
- Logs de criação e execução de pipeline
- Logs de monitoramento e status
- Logs de webhook e notificações
- Logs de auditoria de permissões

### Métricas
Métricas disponíveis incluem:
- Tempo de execução de pipeline
- Taxa de sucesso/falha
- Uso de recursos
- Performance de webhooks

### Troubleshooting Comum
1. **Pipeline não executa**: Verificar triggers e permissões
2. **Webhooks falham**: Verificar URL, autenticação e SSL
3. **Permissões negadas**: Verificar configuração de usuários/grupos
4. **Timeout de execução**: Ajustar timeouts ou otimizar etapas

Para mais informações, consulte a documentação da API do Bitbucket ou entre em contato com a equipe de suporte.
