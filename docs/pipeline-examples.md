# Exemplos Práticos de Pipeline Management

Este documento contém exemplos práticos e casos de uso comuns para o sistema de gerenciamento de pipelines do Bitbucket MCP Server.

## Casos de Uso Comuns

### 1. Pipeline de CI/CD Básico

Criação de um pipeline básico para build, test e deploy de uma aplicação Node.js.

```typescript
import { executeCreatePipeline, executeExecutePipeline, executeMonitorPipeline } from '../src/server/tools/index.js';

// Configuração do pipeline
const pipelineConfig = {
  repository: "workspace/nodejs-app",
  name: "Node.js CI/CD Pipeline",
  description: "Pipeline básico para aplicação Node.js",
  configuration: {
    triggers: ["push", "pull_request"],
    environment: "production",
    variables: {
      NODE_VERSION: "18",
      NPM_TOKEN: "${NPM_TOKEN}",
      BUILD_ENV: "production"
    },
    steps: [
      {
        name: "Setup Node.js",
        type: "build",
        command: "nvm use $NODE_VERSION",
        timeout: 60
      },
      {
        name: "Install Dependencies",
        type: "build",
        command: "npm ci --only=production",
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
        command: "npm test -- --coverage",
        timeout: 600
      },
      {
        name: "Build Application",
        type: "build",
        command: "npm run build",
        timeout: 900
      },
      {
        name: "Deploy to Production",
        type: "deploy",
        command: "npm run deploy:prod",
        timeout: 1200
      }
    ],
    notifications: {
      email: ["devops@company.com"],
      webhook: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      slack: "#deployments"
    }
  },
  permissions: {
    users: ["devops@company.com"],
    groups: ["senior-developers"],
    public: false
  }
};

// Criar o pipeline
const createResult = await executeCreatePipeline(pipelineConfig);
console.log(`Pipeline criado: ${createResult.pipeline.id}`);

// Executar o pipeline
const runResult = await executeExecutePipeline({
  pipeline_id: createResult.pipeline.id,
  repository: "workspace/nodejs-app",
  action: "start",
  parameters: {
    branch: "main",
    variables: {
      DEPLOY_ENV: "production"
    }
  }
});

// Monitorar a execução
const monitorResult = await executeMonitorPipeline({
  pipeline_id: createResult.pipeline.id,
  repository: "workspace/nodejs-app",
  execution_id: runResult.execution.id,
  include_logs: true,
  include_artifacts: true,
  poll_interval: 30
});
```

### 2. Pipeline Multi-Ambiente

Pipeline que suporta múltiplos ambientes (desenvolvimento, staging, produção).

```typescript
// Pipeline para múltiplos ambientes
const multiEnvPipeline = {
  repository: "workspace/multi-env-app",
  name: "Multi-Environment Pipeline",
  description: "Pipeline para deploy em múltiplos ambientes",
  configuration: {
    triggers: ["push", "pull_request"],
    environment: "multi",
    variables: {
      NODE_ENV: "production",
      DOCKER_REGISTRY: "registry.company.com",
      KUBERNETES_NAMESPACE: "default"
    },
    steps: [
      {
        name: "Build Docker Image",
        type: "build",
        command: "docker build -t $DOCKER_REGISTRY/app:$BITBUCKET_COMMIT .",
        timeout: 900
      },
      {
        name: "Push to Registry",
        type: "build",
        command: "docker push $DOCKER_REGISTRY/app:$BITBUCKET_COMMIT",
        timeout: 600
      },
      {
        name: "Deploy to Development",
        type: "deploy",
        command: "kubectl set image deployment/app app=$DOCKER_REGISTRY/app:$BITBUCKET_COMMIT -n dev",
        timeout: 300
      },
      {
        name: "Run Integration Tests",
        type: "test",
        command: "npm run test:integration -- --env=dev",
        timeout: 1200
      },
      {
        name: "Deploy to Staging",
        type: "deploy",
        command: "kubectl set image deployment/app app=$DOCKER_REGISTRY/app:$BITBUCKET_COMMIT -n staging",
        timeout: 300
      },
      {
        name: "Run E2E Tests",
        type: "test",
        command: "npm run test:e2e -- --env=staging",
        timeout: 1800
      },
      {
        name: "Deploy to Production",
        type: "deploy",
        command: "kubectl set image deployment/app app=$DOCKER_REGISTRY/app:$BITBUCKET_COMMIT -n prod",
        timeout: 300
      }
    ]
  }
};

// Executar para diferentes ambientes
const environments = ['dev', 'staging', 'prod'];

for (const env of environments) {
  const result = await executeExecutePipeline({
    pipeline_id: multiEnvPipeline.id,
    repository: "workspace/multi-env-app",
    action: "start",
    parameters: {
      branch: "main",
      environment: env,
      variables: {
        DEPLOY_ENV: env,
        KUBERNETES_NAMESPACE: env
      }
    }
  });
  
  console.log(`Deploy iniciado para ${env}: ${result.execution.id}`);
}
```

### 3. Pipeline com Aprovação Manual

Pipeline que requer aprovação manual antes do deploy em produção.

```typescript
import { executeManagePipelinePermissions } from '../src/server/tools/index.js';

// Pipeline com aprovação manual
const approvalPipeline = {
  repository: "workspace/critical-app",
  name: "Production Approval Pipeline",
  description: "Pipeline com aprovação manual para produção",
  configuration: {
    triggers: ["push"],
    environment: "production",
    steps: [
      {
        name: "Build and Test",
        type: "build",
        command: "npm run build && npm test",
        timeout: 900
      },
      {
        name: "Security Scan",
        type: "test",
        command: "npm audit && npm run security-scan",
        timeout: 600
      },
      {
        name: "Wait for Approval",
        type: "custom",
        command: "echo 'Waiting for manual approval...'",
        timeout: 86400, // 24 horas
        required: true
      },
      {
        name: "Deploy to Production",
        type: "deploy",
        command: "npm run deploy:prod",
        timeout: 1200
      }
    ]
  },
  permissions: {
    users: ["admin@company.com"],
    groups: ["devops-team"],
    public: false
  }
};

// Configurar permissões específicas para aprovação
await executeManagePipelinePermissions({
  pipeline_id: approvalPipeline.id,
  repository: "workspace/critical-app",
  action: "grant",
  permissions: [
    {
      user: "admin@company.com",
      role: "admin",
      scope: "pipeline"
    },
    {
      group: "devops-team",
      role: "execute",
      scope: "pipeline",
      conditions: {
        branches: ["main"],
        time_restrictions: {
          start_time: "09:00",
          end_time: "17:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
      }
    }
  ]
});
```

### 4. Pipeline com Webhooks Avançados

Configuração de webhooks para integração com sistemas externos.

```typescript
import { executeConfigurePipelineWebhooks } from '../src/server/tools/index.js';

// Configurar webhooks para diferentes sistemas
const webhookConfig = {
  pipeline_id: "pipeline-123",
  repository: "workspace/integrated-app",
  webhooks: [
    {
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      events: ["pipeline_started", "pipeline_completed", "pipeline_failed"],
      enabled: true,
      security: {
        secret: "slack-webhook-secret",
        signature_header: "X-Slack-Signature",
        ssl_verification: true
      },
      retry_policy: {
        max_attempts: 3,
        backoff_strategy: "exponential",
        timeout: 30
      },
      filters: {
        branches: ["main", "develop"],
        environments: ["production", "staging"]
      }
    },
    {
      name: "Jira Integration",
      url: "https://company.atlassian.net/rest/api/3/issue/",
      events: ["pipeline_completed", "pipeline_failed"],
      enabled: true,
      security: {
        authentication: {
          type: "basic",
          username: "jira-bot@company.com",
          password: "${JIRA_API_TOKEN}"
        },
        ssl_verification: true
      },
      retry_policy: {
        max_attempts: 5,
        backoff_strategy: "linear",
        timeout: 60
      }
    },
    {
      name: "Monitoring System",
      url: "https://monitoring.company.com/api/pipeline-events",
      events: ["pipeline_started", "pipeline_completed", "pipeline_failed"],
      enabled: true,
      security: {
        authentication: {
          type: "bearer",
          token: "${MONITORING_API_TOKEN}"
        },
        ssl_verification: true
      },
      filters: {
        environments: ["production"]
      }
    }
  ],
  options: {
    validate_webhooks: true,
    test_webhooks: true,
    enable_logging: true
  }
};

const webhookResult = await executeConfigurePipelineWebhooks(webhookConfig);
console.log(`Webhooks configurados: ${webhookResult.configuration.webhooks.length}`);
```

### 5. Monitoramento Avançado com Alertas

Sistema de monitoramento com alertas personalizados.

```typescript
// Função para monitorar pipeline com alertas
async function monitorPipelineWithAlerts(pipelineId: string, repository: string) {
  const startTime = Date.now();
  const maxDuration = 30 * 60 * 1000; // 30 minutos
  
  while (Date.now() - startTime < maxDuration) {
    const monitorResult = await executeMonitorPipeline({
      pipeline_id: pipelineId,
      repository: repository,
      include_logs: true,
      include_artifacts: true,
      poll_interval: 30
    });
    
    if (!monitorResult.success) {
      console.error('Erro no monitoramento:', monitorResult.error);
      break;
    }
    
    const monitoring = monitorResult.monitoring;
    
    // Verificar status e enviar alertas
    switch (monitoring.status) {
      case 'running':
        console.log(`Pipeline executando: ${monitoring.progress.percentage}% completo`);
        
        // Alerta se demorar muito
        if (monitoring.timing.duration > 20 * 60) { // 20 minutos
          console.warn('⚠️ Pipeline executando há mais de 20 minutos');
        }
        break;
        
      case 'success':
        console.log('✅ Pipeline executado com sucesso!');
        console.log(`Duração total: ${monitoring.timing.duration} segundos`);
        
        if (monitoring.artifacts) {
          console.log('Artefatos gerados:');
          monitoring.artifacts.forEach(artifact => {
            console.log(`- ${artifact.name}: ${artifact.size} bytes`);
          });
        }
        return;
        
      case 'failed':
        console.error('❌ Pipeline falhou!');
        
        if (monitoring.logs) {
          console.log('Últimos logs de erro:');
          monitoring.logs
            .filter(log => log.level === 'error')
            .slice(-5)
            .forEach(log => {
              console.log(`[${log.timestamp}] ${log.message}`);
            });
        }
        return;
        
      case 'cancelled':
        console.warn('⚠️ Pipeline cancelado');
        return;
    }
    
    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  console.warn('⏰ Timeout no monitoramento do pipeline');
}

// Usar o monitoramento
const pipelineId = "pipeline-123";
const repository = "workspace/my-app";

await monitorPipelineWithAlerts(pipelineId, repository);
```

### 6. Pipeline com Rollback Automático

Pipeline que implementa rollback automático em caso de falha.

```typescript
// Pipeline com rollback automático
const rollbackPipeline = {
  repository: "workspace/auto-rollback-app",
  name: "Auto-Rollback Pipeline",
  description: "Pipeline com rollback automático em caso de falha",
  configuration: {
    triggers: ["push"],
    environment: "production",
    steps: [
      {
        name: "Build Application",
        type: "build",
        command: "npm run build",
        timeout: 900
      },
      {
        name: "Run Tests",
        type: "test",
        command: "npm test",
        timeout: 600
      },
      {
        name: "Backup Current Version",
        type: "custom",
        command: "kubectl get deployment app -o yaml > backup-$(date +%s).yaml",
        timeout: 120
      },
      {
        name: "Deploy New Version",
        type: "deploy",
        command: "kubectl set image deployment/app app=registry.company.com/app:$BITBUCKET_COMMIT",
        timeout: 300
      },
      {
        name: "Health Check",
        type: "test",
        command: "curl -f http://app.company.com/health || exit 1",
        timeout: 180
      },
      {
        name: "Rollback on Failure",
        type: "deploy",
        command: "kubectl rollout undo deployment/app",
        timeout: 300,
        required: false // Não falha o pipeline se o rollback falhar
      }
    ]
  }
};

// Função para executar com rollback
async function executeWithRollback(pipelineId: string, repository: string) {
  const runResult = await executeExecutePipeline({
    pipeline_id: pipelineId,
    repository: repository,
    action: "start"
  });
  
  // Monitorar execução
  const monitorResult = await executeMonitorPipeline({
    pipeline_id: pipelineId,
    repository: repository,
    execution_id: runResult.execution.id,
    include_logs: true,
    poll_interval: 15
  });
  
  if (monitorResult.monitoring.status === 'failed') {
    console.log('Pipeline falhou, executando rollback...');
    
    // Executar rollback manual se necessário
    const rollbackResult = await executeExecutePipeline({
      pipeline_id: pipelineId,
      repository: repository,
      action: "start",
      parameters: {
        variables: {
          ROLLBACK_MODE: "true"
        }
      }
    });
    
    console.log('Rollback executado:', rollbackResult.execution.id);
  }
}
```

### 7. Pipeline de Release com Versionamento

Pipeline para releases com versionamento automático.

```typescript
// Pipeline de release
const releasePipeline = {
  repository: "workspace/versioned-app",
  name: "Release Pipeline",
  description: "Pipeline para releases com versionamento",
  configuration: {
    triggers: ["push"],
    environment: "production",
    variables: {
      VERSION: "${VERSION}",
      RELEASE_NOTES: "${RELEASE_NOTES}"
    },
    steps: [
      {
        name: "Validate Version",
        type: "test",
        command: "npm version $VERSION --no-git-tag-version",
        timeout: 60
      },
      {
        name: "Update Changelog",
        type: "build",
        command: "echo '$RELEASE_NOTES' >> CHANGELOG.md",
        timeout: 30
      },
      {
        name: "Build Release",
        type: "build",
        command: "npm run build:release",
        timeout: 900
      },
      {
        name: "Run Release Tests",
        type: "test",
        command: "npm run test:release",
        timeout: 1200
      },
      {
        name: "Create Git Tag",
        type: "build",
        command: "git tag v$VERSION && git push origin v$VERSION",
        timeout: 120
      },
      {
        name: "Publish to NPM",
        type: "deploy",
        command: "npm publish",
        timeout: 300
      },
      {
        name: "Deploy to Production",
        type: "deploy",
        command: "kubectl set image deployment/app app=registry.company.com/app:v$VERSION",
        timeout: 300
      },
      {
        name: "Create GitHub Release",
        type: "deploy",
        command: "gh release create v$VERSION --notes '$RELEASE_NOTES'",
        timeout: 180
      }
    ]
  }
};

// Executar release
const releaseResult = await executeExecutePipeline({
  pipeline_id: releasePipeline.id,
  repository: "workspace/versioned-app",
  action: "start",
  parameters: {
    branch: "main",
    variables: {
      VERSION: "1.2.3",
      RELEASE_NOTES: "Bug fixes and performance improvements"
    }
  }
});
```

## Scripts de Automação

### Script para Deploy Automático

```typescript
// deploy-automation.ts
import { executeCreatePipeline, executeExecutePipeline, executeMonitorPipeline } from '../src/server/tools/index.js';

interface DeployConfig {
  repository: string;
  branch: string;
  environment: string;
  variables?: Record<string, string>;
}

async function automatedDeploy(config: DeployConfig) {
  try {
    // 1. Criar pipeline se não existir
    const pipelineId = await getOrCreatePipeline(config.repository);
    
    // 2. Executar pipeline
    const runResult = await executeExecutePipeline({
      pipeline_id: pipelineId,
      repository: config.repository,
      action: "start",
      parameters: {
        branch: config.branch,
        environment: config.environment,
        variables: config.variables
      }
    });
    
    // 3. Monitorar execução
    const monitorResult = await executeMonitorPipeline({
      pipeline_id: pipelineId,
      repository: config.repository,
      execution_id: runResult.execution.id,
      include_logs: true,
      poll_interval: 30
    });
    
    // 4. Verificar resultado
    if (monitorResult.monitoring.status === 'success') {
      console.log('✅ Deploy realizado com sucesso!');
      return { success: true, executionId: runResult.execution.id };
    } else {
      console.error('❌ Deploy falhou!');
      return { success: false, error: monitorResult.monitoring.status };
    }
    
  } catch (error) {
    console.error('Erro no deploy automático:', error);
    return { success: false, error: error.message };
  }
}

// Usar o script
const deployResult = await automatedDeploy({
  repository: "workspace/my-app",
  branch: "main",
  environment: "production",
  variables: {
    DEPLOY_ENV: "production",
    BUILD_VERSION: "latest"
  }
});
```

### Script para Monitoramento Contínuo

```typescript
// continuous-monitoring.ts
import { executeMonitorPipeline } from '../src/server/tools/index.js';

interface MonitoringConfig {
  pipelineId: string;
  repository: string;
  checkInterval: number; // em segundos
  maxFailures: number;
}

class PipelineMonitor {
  private config: MonitoringConfig;
  private failureCount: number = 0;
  private isRunning: boolean = false;
  
  constructor(config: MonitoringConfig) {
    this.config = config;
  }
  
  async start() {
    this.isRunning = true;
    console.log(`Iniciando monitoramento do pipeline ${this.config.pipelineId}`);
    
    while (this.isRunning) {
      try {
        const result = await executeMonitorPipeline({
          pipeline_id: this.config.pipelineId,
          repository: this.config.repository,
          include_logs: false,
          poll_interval: this.config.checkInterval
        });
        
        if (result.success && result.monitoring) {
          const status = result.monitoring.status;
          
          if (status === 'failed') {
            this.failureCount++;
            console.error(`❌ Pipeline falhou (${this.failureCount}/${this.config.maxFailures})`);
            
            if (this.failureCount >= this.config.maxFailures) {
              console.error('🚨 Muitas falhas consecutivas! Enviando alerta...');
              await this.sendAlert(result.monitoring);
              this.failureCount = 0; // Reset counter
            }
          } else if (status === 'success') {
            if (this.failureCount > 0) {
              console.log('✅ Pipeline recuperado!');
              this.failureCount = 0;
            }
          }
        }
        
      } catch (error) {
        console.error('Erro no monitoramento:', error);
      }
      
      // Aguardar próxima verificação
      await new Promise(resolve => 
        setTimeout(resolve, this.config.checkInterval * 1000)
      );
    }
  }
  
  stop() {
    this.isRunning = false;
    console.log('Monitoramento parado');
  }
  
  private async sendAlert(monitoring: any) {
    // Implementar envio de alerta (email, Slack, etc.)
    console.log('🚨 ALERTA: Pipeline com múltiplas falhas!');
    console.log(`Status: ${monitoring.status}`);
    console.log(`Última execução: ${monitoring.timing.started_at}`);
  }
}

// Usar o monitor
const monitor = new PipelineMonitor({
  pipelineId: "pipeline-123",
  repository: "workspace/critical-app",
  checkInterval: 60, // 1 minuto
  maxFailures: 3
});

// Iniciar monitoramento
monitor.start();

// Parar após 1 hora (exemplo)
setTimeout(() => {
  monitor.stop();
}, 60 * 60 * 1000);
```

Estes exemplos demonstram como usar o sistema de pipeline management em diferentes cenários, desde pipelines básicos até automações avançadas com monitoramento contínuo e rollback automático.
