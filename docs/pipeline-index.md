# Pipeline Management - Índice de Documentação

Este é o índice completo da documentação do sistema de Pipeline Management do Bitbucket MCP Server.

## 📚 Documentação Principal

### [README do Pipeline Management](pipeline-README.md)
Visão geral completa do sistema, funcionalidades, estrutura de arquivos e configuração básica.

### [Documentação Técnica](pipeline-management.md)
Documentação detalhada do sistema, incluindo:
- Visão geral e arquitetura
- Entidades e tipos de dados
- Ferramentas MCP disponíveis
- Configuração e autenticação
- Monitoramento e métricas
- Segurança e permissões

## 🛠️ Guias Práticos

### [Exemplos Práticos](pipeline-examples.md)
Casos de uso comuns e exemplos de código:
- Pipeline de CI/CD básico
- Pipeline multi-ambiente
- Pipeline com aprovação manual
- Pipeline com webhooks avançados
- Monitoramento com alertas
- Pipeline com rollback automático
- Pipeline de release com versionamento
- Scripts de automação

### [Guia de Troubleshooting](pipeline-troubleshooting.md)
Soluções para problemas comuns:
- Erro de autenticação
- Pipeline não executa
- Pipeline falha durante execução
- Webhooks não funcionam
- Problemas de performance
- Problemas de permissões
- Problemas de monitoramento
- Logs e debugging

## 🏗️ Arquitetura e Implementação

### Estrutura de Código
```
src/
├── types/pipeline.ts                    # Tipos TypeScript
├── server/services/pipeline-service.ts  # Serviço principal
└── server/tools/                        # Ferramentas MCP
    ├── create_pipeline.ts
    ├── execute_pipeline.ts
    ├── monitor_pipeline.ts
    ├── manage_pipeline_permissions.ts
    └── configure_pipeline_webhooks.ts
```

### Testes
```
tests/
├── unit/pipeline-service.test.ts        # Testes unitários
└── integration/pipeline-tools.test.ts   # Testes de integração
```

## 🚀 Início Rápido

### 1. Configuração Básica
```typescript
import { PipelineService } from './src/server/services/pipeline-service';

const pipelineService = new PipelineService({
  bitbucket: {
    token: process.env.BITBUCKET_TOKEN,
    workspace: process.env.BITBUCKET_WORKSPACE
  }
});
```

### 2. Criar um Pipeline
```typescript
import { executeCreatePipeline } from './src/server/tools';

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
      }
    ]
  }
});
```

### 3. Executar e Monitorar
```typescript
import { executeExecutePipeline, executeMonitorPipeline } from './src/server/tools';

// Executar
const execution = await executeExecutePipeline({
  pipeline_id: pipeline.pipeline.id,
  repository: "workspace/my-app",
  action: "start"
});

// Monitorar
const monitoring = await executeMonitorPipeline({
  pipeline_id: pipeline.pipeline.id,
  repository: "workspace/my-app",
  execution_id: execution.execution.id,
  include_logs: true
});
```

## 🔧 Ferramentas MCP

| Ferramenta | Descrição | Status |
|------------|-----------|--------|
| `create_pipeline` | Criar novos pipelines | ✅ |
| `execute_pipeline` | Executar, parar ou reiniciar pipelines | ✅ |
| `monitor_pipeline` | Monitorar execuções em tempo real | ✅ |
| `manage_pipeline_permissions` | Gerenciar permissões de acesso | ✅ |
| `configure_pipeline_webhooks` | Configurar webhooks para eventos | ✅ |

## 📊 Funcionalidades

### ✅ Implementadas
- [x] Criação e configuração de pipelines
- [x] Execução manual e automática
- [x] Monitoramento em tempo real
- [x] Gerenciamento de permissões
- [x] Integração com webhooks
- [x] Testes unitários e de integração
- [x] Documentação completa

### 🔄 Em Desenvolvimento
- [ ] Dashboard web
- [ ] Templates de pipeline
- [ ] Integração com ferramentas de análise
- [ ] Automação de rollback
- [ ] Métricas avançadas

## 🧪 Testes

### Executar Todos os Testes
```bash
npm test -- --testPathPattern=pipeline
```

### Testes Específicos
```bash
# Testes unitários
npm test -- --testPathPattern=pipeline-service.test.ts

# Testes de integração
npm test -- --testPathPattern=pipeline-tools.test.ts
```

## 🔒 Segurança

### Autenticação
- OAuth2 e tokens de API
- Validação de permissões
- Controle de acesso baseado em roles

### Autorização
- Permissões granulares
- Restrições de branch e horário
- Isolamento entre workspaces

### Dados Sensíveis
- Variáveis criptografadas
- Logs sanitizados
- Tokens mascarados

## 📈 Métricas

O sistema coleta automaticamente:
- **Performance**: Tempo de execução, taxa de sucesso
- **Uso**: Execuções, usuários ativos
- **Qualidade**: Taxa de falhas, steps problemáticos
- **Recursos**: CPU, memória, armazenamento

## 🐛 Problemas Conhecidos

1. **Timeout em Pipelines Longos**: Pipelines > 30min podem ter timeout
2. **Webhooks SSL**: Problemas com certificados auto-assinados
3. **Permissões Complexas**: Restrições específicas podem afetar performance

## 🤝 Contribuição

Para contribuir:
1. Leia a documentação de desenvolvimento
2. Execute os testes existentes
3. Adicione testes para novas funcionalidades
4. Siga as convenções de código
5. Documente mudanças significativas

## 📞 Suporte

- **Documentação**: Consulte os arquivos em `docs/`
- **Issues**: Reporte problemas no repositório
- **Troubleshooting**: Veja o guia específico

---

**Versão**: 1.0.0  
**Status**: ✅ Implementado e Documentado  
**Última Atualização**: Janeiro 2024
