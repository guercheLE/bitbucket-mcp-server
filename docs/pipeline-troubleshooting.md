# Guia de Troubleshooting - Pipeline Management

Este documento fornece soluções para problemas comuns encontrados ao usar o sistema de pipeline management do Bitbucket MCP Server.

## Problemas Comuns e Soluções

### 1. Erro de Autenticação

**Problema**: Erro 401 (Unauthorized) ao tentar criar ou executar pipelines.

```
Error: Authentication failed - Invalid credentials
```

**Possíveis Causas**:
- Token de API inválido ou expirado
- Permissões insuficientes no Bitbucket
- Configuração incorreta de autenticação

**Soluções**:

1. **Verificar Token de API**:
   ```bash
   # Testar token com curl
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://api.bitbucket.org/2.0/user
   ```

2. **Verificar Permissões**:
   - Admin: Criação, execução e gerenciamento de pipelines
   - Write: Execução de pipelines existentes
   - Read: Apenas visualização

3. **Renovar Token**:
   ```typescript
   // No arquivo de configuração
   const config = {
     bitbucket: {
       token: process.env.BITBUCKET_TOKEN, // Token atualizado
       workspace: "your-workspace"
     }
   };
   ```

### 2. Pipeline Não Executa

**Problema**: Pipeline criado mas não executa quando acionado.

**Possíveis Causas**:
- Configuração de triggers incorreta
- Branch não configurado corretamente
- Variáveis de ambiente faltando

**Soluções**:

1. **Verificar Triggers**:
   ```typescript
   const pipelineConfig = {
     configuration: {
       triggers: ["push", "pull_request"], // Verificar se está correto
       branches: ["main", "develop"] // Especificar branches
     }
   };
   ```

2. **Verificar Variáveis**:
   ```typescript
   // Verificar se todas as variáveis necessárias estão definidas
   const requiredVars = ["NODE_VERSION", "BUILD_ENV"];
   const missingVars = requiredVars.filter(v => !process.env[v]);
   
   if (missingVars.length > 0) {
     throw new Error(`Variáveis faltando: ${missingVars.join(', ')}`);
   }
   ```

3. **Testar Execução Manual**:
   ```typescript
   const result = await executeExecutePipeline({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo",
     action: "start",
     parameters: {
       branch: "main",
       variables: {
         FORCE_RUN: "true"
       }
     }
   });
   ```

### 3. Pipeline Falha Durante Execução

**Problema**: Pipeline inicia mas falha em algum step.

**Possíveis Causas**:
- Comando inválido ou com erro
- Timeout insuficiente
- Dependências faltando
- Permissões de arquivo

**Soluções**:

1. **Verificar Logs**:
   ```typescript
   const logs = await executeMonitorPipeline({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo",
     execution_id: "exec-456",
     include_logs: true
   });
   
   // Filtrar logs de erro
   const errorLogs = logs.monitoring.logs.filter(log => log.level === 'error');
   console.log('Logs de erro:', errorLogs);
   ```

2. **Aumentar Timeout**:
   ```typescript
   const step = {
     name: "Long Running Task",
     type: "build",
     command: "npm run build",
     timeout: 1800 // Aumentar de 900 para 1800 segundos
   };
   ```

3. **Verificar Dependências**:
   ```typescript
   // Adicionar step para verificar dependências
   {
     name: "Check Dependencies",
     type: "test",
     command: "node --version && npm --version && docker --version",
     timeout: 60
   }
   ```

### 4. Webhooks Não Funcionam

**Problema**: Webhooks configurados mas não são acionados.

**Possíveis Causas**:
- URL do webhook inacessível
- Configuração de segurança incorreta
- Filtros muito restritivos

**Soluções**:

1. **Testar URL do Webhook**:
   ```bash
   # Testar se a URL está acessível
   curl -X POST https://your-webhook-url.com/pipeline-events \
        -H "Content-Type: application/json" \
        -d '{"test": "message"}'
   ```

2. **Verificar Configuração de Segurança**:
   ```typescript
   const webhook = {
     url: "https://your-webhook-url.com/pipeline-events",
     security: {
       secret: "your-webhook-secret",
       signature_header: "X-Hub-Signature-256",
       ssl_verification: true // Verificar certificado SSL
     }
   };
   ```

3. **Simplificar Filtros**:
   ```typescript
   // Remover filtros temporariamente para teste
   const webhook = {
     url: "https://your-webhook-url.com/pipeline-events",
     events: ["pipeline_started", "pipeline_completed"],
     filters: {} // Sem filtros para teste
   };
   ```

### 5. Problemas de Performance

**Problema**: Pipeline executa muito lentamente.

**Possíveis Causas**:
- Steps desnecessários
- Comandos ineficientes
- Recursos insuficientes
- Cache não configurado

**Soluções**:

1. **Otimizar Steps**:
   ```typescript
   // Usar cache para dependências
   {
     name: "Install Dependencies",
     type: "build",
     command: "npm ci --cache .npm --prefer-offline",
     timeout: 300
   }
   ```

2. **Paralelizar Steps Independentes**:
   ```typescript
   const parallelSteps = [
     {
       name: "Lint Code",
       type: "test",
       command: "npm run lint",
       timeout: 120
     },
     {
       name: "Type Check",
       type: "test", 
       command: "npm run type-check",
       timeout: 120
     }
   ];
   ```

3. **Usar Build Cache**:
   ```typescript
   {
     name: "Build with Cache",
     type: "build",
     command: "npm run build -- --cache",
     timeout: 900,
     cache: {
       paths: ["dist/", "node_modules/.cache/"],
       key: "build-cache-{{ checksum 'package-lock.json' }}"
     }
   }
   ```

### 6. Problemas de Permissões

**Problema**: Usuários não conseguem executar pipelines.

**Possíveis Causas**:
- Permissões não configuradas
- Usuário não está no grupo correto
- Restrições de branch

**Soluções**:

1. **Verificar Permissões do Pipeline**:
   ```typescript
   const permissions = await executeManagePipelinePermissions({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo",
     action: "list"
   });
   
   console.log('Permissões atuais:', permissions.permissions);
   ```

2. **Adicionar Usuário**:
   ```typescript
   await executeManagePipelinePermissions({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo",
     action: "grant",
     permissions: [
       {
         user: "user@company.com",
         role: "execute",
         scope: "pipeline"
       }
     ]
   });
   ```

3. **Verificar Restrições de Branch**:
   ```typescript
   const permissions = {
     user: "user@company.com",
     role: "execute",
     scope: "pipeline",
     conditions: {
       branches: ["main", "develop"] // Verificar se branch está incluída
     }
   };
   ```

### 7. Problemas de Monitoramento

**Problema**: Monitoramento não retorna informações corretas.

**Possíveis Causas**:
- Execution ID inválido
- Pipeline não está executando
- Timeout no polling

**Soluções**:

1. **Verificar Execution ID**:
   ```typescript
   // Verificar se o execution ID é válido
   const executions = await executeMonitorPipeline({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo",
     include_logs: false
   });
   
   console.log('Execuções disponíveis:', executions.monitoring.executions);
   ```

2. **Implementar Retry Logic**:
   ```typescript
   async function monitorWithRetry(pipelineId: string, executionId: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const result = await executeMonitorPipeline({
           pipeline_id: pipelineId,
           repository: "workspace/repo",
           execution_id: executionId,
           include_logs: true
         });
         
         if (result.success) {
           return result;
         }
       } catch (error) {
         console.log(`Tentativa ${i + 1} falhou:`, error.message);
         
         if (i === maxRetries - 1) {
           throw error;
         }
         
         // Aguardar antes da próxima tentativa
         await new Promise(resolve => setTimeout(resolve, 5000));
       }
     }
   }
   ```

3. **Verificar Status do Pipeline**:
   ```typescript
   const pipeline = await executeGetPipeline({
     pipeline_id: "pipeline-123",
     repository: "workspace/repo"
   });
   
   if (pipeline.pipeline.status === 'disabled') {
     throw new Error('Pipeline está desabilitado');
   }
   ```

## Logs e Debugging

### Habilitar Logs Detalhados

```typescript
// Configurar logging detalhado
const logger = {
  level: 'debug',
  format: 'json',
  destinations: ['console', 'file']
};

// No pipeline service
const pipelineService = new PipelineService({
  logger: logger,
  debug: true
});
```

### Analisar Logs de Pipeline

```typescript
async function analyzePipelineLogs(pipelineId: string, executionId: string) {
  const result = await executeMonitorPipeline({
    pipeline_id: pipelineId,
    repository: "workspace/repo",
    execution_id: executionId,
    include_logs: true
  });
  
  if (result.success && result.monitoring.logs) {
    const logs = result.monitoring.logs;
    
    // Agrupar logs por step
    const logsByStep = logs.reduce((acc, log) => {
      if (!acc[log.step]) {
        acc[log.step] = [];
      }
      acc[log.step].push(log);
      return acc;
    }, {});
    
    // Analisar erros
    const errors = logs.filter(log => log.level === 'error');
    const warnings = logs.filter(log => log.level === 'warning');
    
    console.log(`Total de logs: ${logs.length}`);
    console.log(`Erros: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    // Mostrar erros
    errors.forEach(error => {
      console.error(`[${error.step}] ${error.message}`);
    });
  }
}
```

### Verificar Métricas de Performance

```typescript
async function checkPipelinePerformance(pipelineId: string) {
  const metrics = await executeGetPipelineMetrics({
    pipeline_id: pipelineId,
    repository: "workspace/repo",
    time_range: "7d"
  });
  
  if (metrics.success) {
    const stats = metrics.metrics;
    
    console.log('Métricas de Performance:');
    console.log(`Execuções totais: ${stats.total_executions}`);
    console.log(`Taxa de sucesso: ${stats.success_rate}%`);
    console.log(`Tempo médio: ${stats.average_duration}s`);
    console.log(`Tempo mais longo: ${stats.longest_duration}s`);
    console.log(`Tempo mais curto: ${stats.shortest_duration}s`);
    
    // Identificar steps mais lentos
    if (stats.step_metrics) {
      const slowestSteps = stats.step_metrics
        .sort((a, b) => b.average_duration - a.average_duration)
        .slice(0, 3);
      
      console.log('Steps mais lentos:');
      slowestSteps.forEach(step => {
        console.log(`- ${step.name}: ${step.average_duration}s`);
      });
    }
  }
}
```

## Checklist de Troubleshooting

### Antes de Reportar um Problema

- [ ] Verificar se o token de API está válido e tem permissões adequadas
- [ ] Confirmar que o repositório existe e está acessível
- [ ] Verificar se todas as variáveis de ambiente necessárias estão definidas
- [ ] Testar com um pipeline simples primeiro
- [ ] Verificar logs detalhados para identificar o erro específico
- [ ] Confirmar que a configuração do pipeline está correta
- [ ] Testar webhooks com uma URL simples primeiro
- [ ] Verificar se há restrições de rede ou firewall

### Informações para Reportar

Ao reportar um problema, inclua:

1. **Versão do MCP Server**
2. **Configuração do Pipeline** (sem dados sensíveis)
3. **Logs de Erro Completos**
4. **Passos para Reproduzir**
5. **Ambiente** (Bitbucket Cloud/Server, versão)
6. **Configuração de Autenticação** (tipo, permissões)

### Exemplo de Report de Bug

```markdown
## Bug Report: Pipeline não executa

**Versão**: 1.0.0
**Ambiente**: Bitbucket Cloud
**Repositório**: workspace/test-repo

### Configuração do Pipeline
```json
{
  "name": "Test Pipeline",
  "triggers": ["push"],
  "steps": [
    {
      "name": "Test Step",
      "command": "echo 'Hello World'",
      "timeout": 60
    }
  ]
}
```

### Erro
```
Error: Pipeline execution failed - Invalid step configuration
```

### Logs
```
[2024-01-15 10:30:00] ERROR: Step validation failed
[2024-01-15 10:30:00] ERROR: Missing required field 'type'
```

### Passos para Reproduzir
1. Criar pipeline com a configuração acima
2. Tentar executar o pipeline
3. Erro ocorre imediatamente

### Configuração de Autenticação
- Tipo: OAuth2
- Permissões: Admin no repositório
- Token válido até: 2024-02-15
```

Este guia deve ajudar a resolver a maioria dos problemas comuns encontrados ao usar o sistema de pipeline management.
