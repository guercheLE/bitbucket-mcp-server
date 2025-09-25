# Pipeline Management - Bitbucket MCP Server

Sistema completo de gerenciamento de pipelines CI/CD para Bitbucket, integrado ao MCP Server.

## 📋 Visão Geral

O sistema de Pipeline Management permite criar, configurar, executar e monitorar pipelines de CI/CD diretamente através de ferramentas MCP, proporcionando uma interface unificada para gerenciamento de automação de desenvolvimento.

## 🚀 Funcionalidades Principais

### ✅ Implementadas

- **Criação e Configuração de Pipelines**
  - Definição de steps, triggers e variáveis
  - Configuração de ambientes e permissões
  - Validação de configuração

- **Execução de Pipelines**
  - Execução manual e automática
  - Suporte a diferentes tipos de triggers
  - Parâmetros dinâmicos e variáveis

- **Monitoramento em Tempo Real**
  - Status de execução em tempo real
  - Logs detalhados e artefatos
  - Métricas de performance

- **Gerenciamento de Permissões**
  - Controle de acesso por usuário e grupo
  - Restrições de branch e horário
  - Roles granulares

- **Integração com Webhooks**
  - Configuração de webhooks para eventos
  - Autenticação e segurança
  - Retry policies e filtros

- **Testes Abrangentes**
  - Testes unitários para PipelineService
  - Testes de integração para ferramentas MCP
  - Cobertura de casos de uso

## 📁 Estrutura de Arquivos

```
src/
├── types/
│   └── pipeline.ts                    # Tipos TypeScript para pipelines
├── server/
│   ├── services/
│   │   ├── pipeline-service.ts        # Serviço principal de pipelines
│   │   └── index.ts                   # Exportações de serviços
│   └── tools/
│       ├── create_pipeline.ts         # Criar pipelines
│       ├── execute_pipeline.ts        # Executar pipelines
│       ├── monitor_pipeline.ts        # Monitorar execuções
│       ├── manage_pipeline_permissions.ts # Gerenciar permissões
│       └── configure_pipeline_webhooks.ts # Configurar webhooks
tests/
├── unit/
│   └── pipeline-service.test.ts       # Testes unitários
└── integration/
    └── pipeline-tools.test.ts         # Testes de integração
docs/
├── pipeline-management.md             # Documentação principal
├── pipeline-examples.md               # Exemplos práticos
├── pipeline-troubleshooting.md        # Guia de troubleshooting
└── pipeline-README.md                 # Este arquivo
```

## 🛠️ Ferramentas MCP Disponíveis

### 1. `create_pipeline`
Cria um novo pipeline com configuração completa.

**Parâmetros**:
- `repository`: Repositório do Bitbucket
- `name`: Nome do pipeline
- `description`: Descrição opcional
- `configuration`: Configuração completa do pipeline
- `permissions`: Permissões de acesso

### 2. `execute_pipeline`
Executa, para ou reinicia um pipeline.

**Parâmetros**:
- `pipeline_id`: ID do pipeline
- `repository`: Repositório
- `action`: "start", "stop", "restart"
- `parameters`: Parâmetros de execução

### 3. `monitor_pipeline`
Monitora execução de pipeline em tempo real.

**Parâmetros**:
- `pipeline_id`: ID do pipeline
- `repository`: Repositório
- `execution_id`: ID da execução (opcional)
- `include_logs`: Incluir logs
- `include_artifacts`: Incluir artefatos

### 4. `manage_pipeline_permissions`
Gerencia permissões de pipeline.

**Parâmetros**:
- `pipeline_id`: ID do pipeline
- `repository`: Repositório
- `action`: "grant", "revoke", "list", "update"
- `permissions`: Lista de permissões

### 5. `configure_pipeline_webhooks`
Configura webhooks para eventos de pipeline.

**Parâmetros**:
- `pipeline_id`: ID do pipeline
- `repository`: Repositório
- `webhooks`: Configuração de webhooks
- `options`: Opções de configuração

## 📖 Documentação

- **[Documentação Principal](pipeline-management.md)**: Visão geral completa do sistema
- **[Exemplos Práticos](pipeline-examples.md)**: Casos de uso e exemplos de código
- **[Troubleshooting](pipeline-troubleshooting.md)**: Soluções para problemas comuns

## 🧪 Testes

### Executar Testes Unitários
```bash
npm test -- --testPathPattern=pipeline-service.test.ts
```

### Executar Testes de Integração
```bash
npm test -- --testPathPattern=pipeline-tools.test.ts
```

### Executar Todos os Testes de Pipeline
```bash
npm test -- --testPathPattern=pipeline
```

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```bash
# Autenticação Bitbucket
BITBUCKET_TOKEN=your_api_token
BITBUCKET_WORKSPACE=your_workspace

# Configuração do Servidor
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Configuração do PipelineService

```typescript
import { PipelineService } from './src/server/services/pipeline-service';

const pipelineService = new PipelineService({
  bitbucket: {
    token: process.env.BITBUCKET_TOKEN,
    workspace: process.env.BITBUCKET_WORKSPACE
  },
  cache: {
    enabled: true,
    ttl: 300 // 5 minutos
  },
  monitoring: {
    pollInterval: 30, // segundos
    maxRetries: 3
  }
});
```

## 🚀 Exemplo Rápido

```typescript
import { 
  executeCreatePipeline, 
  executeExecutePipeline, 
  executeMonitorPipeline 
} from './src/server/tools';

// 1. Criar pipeline
const pipeline = await executeCreatePipeline({
  repository: "workspace/my-app",
  name: "CI/CD Pipeline",
  configuration: {
    triggers: ["push"],
    steps: [
      {
        name: "Build",
        type: "build",
        command: "npm run build",
        timeout: 300
      },
      {
        name: "Test",
        type: "test", 
        command: "npm test",
        timeout: 600
      }
    ]
  }
});

// 2. Executar pipeline
const execution = await executeExecutePipeline({
  pipeline_id: pipeline.pipeline.id,
  repository: "workspace/my-app",
  action: "start"
});

// 3. Monitorar execução
const monitoring = await executeMonitorPipeline({
  pipeline_id: pipeline.pipeline.id,
  repository: "workspace/my-app",
  execution_id: execution.execution.id,
  include_logs: true
});

console.log(`Status: ${monitoring.monitoring.status}`);
```

## 📊 Métricas e Monitoramento

O sistema coleta automaticamente métricas de:

- **Performance**: Tempo de execução, taxa de sucesso
- **Uso**: Número de execuções, usuários ativos
- **Qualidade**: Taxa de falhas, steps mais problemáticos
- **Recursos**: Uso de CPU, memória, armazenamento

## 🔒 Segurança

### Autenticação
- Suporte a OAuth2 e tokens de API
- Validação de permissões por operação
- Controle de acesso baseado em roles

### Autorização
- Permissões granulares por pipeline
- Restrições de branch e horário
- Isolamento entre workspaces

### Dados Sensíveis
- Variáveis de ambiente criptografadas
- Logs sanitizados
- Tokens mascarados em logs

## 🐛 Problemas Conhecidos

1. **Timeout em Pipelines Longos**: Pipelines com mais de 30 minutos podem ter timeout
2. **Webhooks com SSL**: Alguns webhooks podem falhar com certificados auto-assinados
3. **Permissões Complexas**: Restrições muito específicas podem causar problemas de performance

## 🔄 Roadmap

### Próximas Versões

- [ ] **v1.1**: Suporte a pipelines paralelos
- [ ] **v1.2**: Integração com sistemas de notificação avançados
- [ ] **v1.3**: Dashboard web para visualização
- [ ] **v1.4**: Templates de pipeline reutilizáveis
- [ ] **v1.5**: Integração com ferramentas de análise de código

### Melhorias Planejadas

- [ ] Cache inteligente para builds
- [ ] Suporte a múltiplos ambientes simultâneos
- [ ] Integração com ferramentas de segurança
- [ ] Automação de rollback
- [ ] Métricas avançadas e alertas

## 🤝 Contribuição

Para contribuir com o sistema de Pipeline Management:

1. Leia a [documentação de desenvolvimento](../README.md)
2. Execute os testes existentes
3. Adicione testes para novas funcionalidades
4. Siga as convenções de código do projeto
5. Documente mudanças significativas

## 📞 Suporte

- **Documentação**: Consulte os arquivos em `docs/`
- **Issues**: Reporte problemas no repositório
- **Troubleshooting**: Veja o [guia de troubleshooting](pipeline-troubleshooting.md)

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Status**: ✅ Implementado e Testado
