# Constituição do Bitbucket MCP Server

Este documento define os princípios fundamentais e regras que governam o desenvolvimento e manutenção do Bitbucket MCP Server.

## 📋 Índice

- [Preâmbulo](#preâmbulo)
- [Article I: MCP Protocol First](#article-i-mcp-protocol-first)
- [Article II: Multi-Transport Protocol](#article-ii-multi-transport-protocol)
- [Article III: Selective Tool Registration](#article-iii-selective-tool-registration)
- [Article IV: Complete API Coverage](#article-iv-complete-api-coverage)
- [Article V: Test-First Development](#article-v-test-first-development)
- [Article VI: Versioning](#article-vi-versioning)
- [Article VII: Simplicity](#article-vii-simplicity)
- [Emendas](#emendas)
- [Validação](#validação)

## 📜 Preâmbulo

Nós, os desenvolvedores do Bitbucket MCP Server, estabelecemos esta Constituição para garantir a excelência, consistência e manutenibilidade do projeto. Estes princípios são fundamentais e devem ser seguidos rigorosamente em todas as decisões de desenvolvimento.

### Princípios Fundamentais

1. **Excelência Técnica**: Código de alta qualidade, bem testado e documentado
2. **Conformidade com Padrões**: Adesão rigorosa aos padrões MCP e melhores práticas
3. **Manutenibilidade**: Código limpo, organizado e fácil de manter
4. **Extensibilidade**: Arquitetura que permite crescimento e evolução
5. **Confiabilidade**: Sistema robusto e resiliente a falhas

## 🔧 Article I: MCP Protocol First

### Princípio Fundamental

O SDK oficial do Model Context Protocol (`@modelcontextprotocol/sdk`) é a única fonte de verdade para implementação do protocolo MCP.

### Regras Obrigatórias

1. **SDK Oficial**: Use exclusivamente o SDK oficial `@modelcontextprotocol/sdk`
2. **Sem Implementações Customizadas**: Não implemente protocolos MCP customizados
3. **Conformidade Rigorosa**: Siga as especificações MCP sem exceções
4. **Atualizações**: Mantenha o SDK sempre atualizado

### Implementação

```typescript
// ✅ Correto - Usar SDK oficial
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// ❌ Incorreto - Implementação customizada
class CustomMCPServer {
  // Implementação customizada proibida
}
```

### Validação

- Verificar uso exclusivo do SDK oficial
- Confirmar ausência de implementações customizadas
- Validar conformidade com especificações MCP

## 🚀 Article II: Multi-Transport Protocol

### Princípio Fundamental

O servidor deve suportar todos os transportes MCP disponíveis com fallback automático.

### Transportes Obrigatórios

1. **STDIO**: Transporte padrão para comunicação via stdin/stdout
2. **HTTP**: Transporte HTTP para comunicação via REST API
3. **SSE**: Server-Sent Events para comunicação em tempo real
4. **HTTP Streaming**: HTTP com streaming para grandes volumes de dados

### Regras de Implementação

1. **Suporte Completo**: Implementar todos os transportes obrigatórios
2. **Fallback Automático**: Sistema deve tentar transportes em ordem de prioridade
3. **Detecção de Capacidade**: Detectar automaticamente transportes disponíveis
4. **Configuração Flexível**: Permitir configuração de prioridades

### Implementação

```typescript
// ✅ Correto - Suporte multi-transporte
class TransportManager {
  private transports = [
    new StdioTransport(),
    new HttpTransport(),
    new SSETransport(),
    new StreamingTransport()
  ];

  async initialize(): Promise<void> {
    for (const transport of this.transports) {
      try {
        await transport.initialize();
        break; // Usar primeiro transporte disponível
      } catch (error) {
        continue; // Tentar próximo transporte
      }
    }
  }
}
```

### Validação

- Verificar implementação de todos os transportes
- Confirmar funcionamento do fallback automático
- Testar detecção de capacidades
- Validar configuração de prioridades

## 🎯 Article III: Selective Tool Registration

### Princípio Fundamental

O servidor deve detectar automaticamente o tipo de servidor Bitbucket e registrar apenas ferramentas compatíveis.

### Tipos de Servidor

1. **Data Center**: Instância self-hosted do Bitbucket
2. **Cloud**: Bitbucket Cloud (atlassian.net)

### Regras de Detecção

1. **Detecção Automática**: Detectar tipo de servidor via API
2. **Registro Seletivo**: Registrar apenas ferramentas compatíveis
3. **Cache de Capacidades**: Cachear capacidades detectadas
4. **Fallback Inteligente**: Fallback para Data Center 7.16 se detecção falhar

### Implementação

```typescript
// ✅ Correto - Detecção automática
class ServerDetectionService {
  async detectServerType(url: string): Promise<ServerType> {
    try {
      const response = await fetch(`${url}/rest/api/1.0/application-properties`);
      const data = await response.json();
      
      if (data.version) {
        return ServerType.DATA_CENTER;
      }
    } catch (error) {
      // Fallback para Data Center 7.16
      return ServerType.DATA_CENTER;
    }
    
    return ServerType.CLOUD;
  }

  async registerCompatibleTools(serverType: ServerType): Promise<void> {
    const tools = this.getCompatibleTools(serverType);
    await this.registerTools(tools);
  }
}
```

### Validação

- Verificar detecção automática de servidor
- Confirmar registro seletivo de ferramentas
- Testar cache de capacidades
- Validar fallback inteligente

## 📚 Article IV: Complete API Coverage

### Princípio Fundamental

O servidor deve implementar cobertura completa da API do Bitbucket com mais de 250 endpoints.

### Categorias de Endpoints

1. **Autenticação**: OAuth, tokens, sessões
2. **Repositórios**: CRUD, permissões, branches, tags
3. **Pull Requests**: CRUD, comentários, merge, diff
4. **Projetos**: CRUD, permissões, configurações
5. **Busca**: Repositórios, commits, código, usuários
6. **Dashboards**: CRUD, widgets, configurações

### Regras de Implementação

1. **Cobertura Completa**: Implementar todos os endpoints disponíveis
2. **Organização por Categoria**: Agrupar endpoints por funcionalidade
3. **Compatibilidade de Versão**: Manter compatibilidade com versões
4. **Validação Rigorosa**: Validar todas as entradas com Zod

### Implementação

```typescript
// ✅ Correto - Cobertura completa organizada
export const repositoryTools = [
  createRepositoryTool,
  getRepositoryTool,
  updateRepositoryTool,
  deleteRepositoryTool,
  listRepositoriesTool,
  // ... todos os endpoints de repositório
];

export const pullRequestTools = [
  createPullRequestTool,
  getPullRequestTool,
  updatePullRequestTool,
  deletePullRequestTool,
  listPullRequestsTool,
  // ... todos os endpoints de pull request
];
```

### Validação

- Verificar implementação de todos os endpoints
- Confirmar organização por categoria
- Testar compatibilidade de versão
- Validar schemas de entrada

## 🧪 Article V: Test-First Development

### Princípio Fundamental

**NON-NEGOTIABLE**: Desenvolvimento orientado a testes (TDD) é obrigatório com cobertura mínima de 80%.

### Regras TDD

1. **Red-Green-Refactor**: Sempre seguir o ciclo TDD
2. **Testes Primeiro**: Escrever testes antes da implementação
3. **Cobertura Mínima**: Manter cobertura >80% obrigatoriamente
4. **Gates de Aprovação**: Implementação só após aprovação dos testes

### Tipos de Testes Obrigatórios

1. **Testes Unitários**: Testar funções individuais
2. **Testes de Integração**: Testar integração entre componentes
3. **Testes de Contrato**: Testar contratos de API
4. **Testes de Performance**: Testar performance e limites

### Implementação

```typescript
// ✅ Correto - TDD rigoroso
describe('AuthenticationService', () => {
  // RED: Teste falha inicialmente
  it('should authenticate with valid OAuth2 credentials', async () => {
    const credentials = { clientId: 'test', clientSecret: 'test' };
    const result = await authService.authenticateOAuth2(credentials);
    expect(result.success).toBe(true);
  });

  // GREEN: Implementação mínima para passar
  // REFACTOR: Melhorar código mantendo testes
});
```

### Validação

- Verificar execução de testes antes da implementação
- Confirmar cobertura >80%
- Validar gates de aprovação
- Testar todos os tipos de teste

## 📦 Article VI: Versioning

### Princípio Fundamental

Use versionamento semântico rigoroso com compatibilidade de versões anteriores.

### Regras de Versionamento

1. **Semantic Versioning**: Seguir padrão MAJOR.MINOR.PATCH
2. **Compatibilidade**: Manter compatibilidade com versões anteriores
3. **Breaking Changes**: Documentar breaking changes claramente
4. **Changelog**: Manter changelog detalhado

### Estrutura de Versão

- **MAJOR**: Breaking changes incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

### Implementação

```json
// package.json
{
  "version": "1.2.3",
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

### Validação

- Verificar versionamento semântico
- Confirmar compatibilidade de versões
- Validar documentação de breaking changes
- Testar upgrade paths

## 🎨 Article VII: Simplicity

### Princípio Fundamental

Mantenha o código simples, legível e bem organizado seguindo princípios SOLID.

### Princípios de Simplicidade

1. **Código Limpo**: Código legível e bem estruturado
2. **Padrões Estabelecidos**: Usar padrões de design conhecidos
3. **Documentação Clara**: Documentar adequadamente
4. **Organização Lógica**: Estrutura de pastas lógica

### Regras de Implementação

1. **Funções Pequenas**: Funções com responsabilidade única
2. **Nomes Descritivos**: Nomes que explicam a funcionalidade
3. **Comentários Úteis**: Comentários que explicam o "porquê"
4. **Estrutura Consistente**: Estrutura de arquivos consistente

### Implementação

```typescript
// ✅ Correto - Código simples e claro
export class RepositoryService {
  async createRepository(input: CreateRepositoryInput): Promise<Repository> {
    this.validateInput(input);
    const repository = await this.bitbucketApi.createRepository(input);
    await this.cacheRepository(repository);
    return repository;
  }

  private validateInput(input: CreateRepositoryInput): void {
    CreateRepositorySchema.parse(input);
  }

  private async cacheRepository(repository: Repository): Promise<void> {
    await this.cache.set(`repo:${repository.id}`, repository, { ttl: 300 });
  }
}
```

### Validação

- Verificar clareza do código
- Confirmar uso de padrões estabelecidos
- Validar documentação adequada
- Testar organização lógica

## 📝 Emendas

### Processo de Emenda

1. **Proposta**: Propor emenda via Pull Request
2. **Discussão**: Discussão aberta na comunidade
3. **Votação**: Votação da equipe de mantenedores
4. **Aprovação**: Aprovação por maioria qualificada (2/3)
5. **Implementação**: Implementação da emenda aprovada

### Critérios para Emendas

- Deve melhorar a qualidade do projeto
- Deve ser compatível com princípios existentes
- Deve ter suporte da comunidade
- Deve ser tecnicamente viável

## ✅ Validação

### Validação Automática

Execute o script de validação constitucional:

```bash
npm run validate:constitution
```

### Checklist de Conformidade

- [ ] **Article I**: SDK oficial MCP usado exclusivamente
- [ ] **Article II**: Todos os transportes implementados
- [ ] **Article III**: Detecção automática funcionando
- [ ] **Article IV**: Cobertura completa da API
- [ ] **Article V**: TDD com cobertura >80%
- [ ] **Article VI**: Versionamento semântico
- [ ] **Article VII**: Código simples e organizado

### Validação Manual

1. **Code Review**: Revisão de código focada na conformidade
2. **Testes de Integração**: Testes end-to-end
3. **Documentação**: Verificação de documentação atualizada
4. **Performance**: Testes de performance e limites

## 🚨 Violações Constitucionais

### Tipos de Violação

1. **Crítica**: Violação de Article V (TDD) ou Article I (SDK oficial)
2. **Grave**: Violação de outros artigos obrigatórios
3. **Menor**: Violação de padrões de qualidade

### Processo de Correção

1. **Identificação**: Identificar violação via validação
2. **Notificação**: Notificar desenvolvedor responsável
3. **Correção**: Desenvolvedor corrige violação
4. **Validação**: Re-validar conformidade
5. **Aprovação**: Aprovar correção

### Consequências

- **Crítica**: Bloqueio de merge até correção
- **Grave**: Aviso e correção obrigatória
- **Menor**: Sugestão de melhoria

## 📚 Recursos

### Documentação Relacionada

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Zod Documentation](https://zod.dev/)

### Ferramentas de Validação

- `npm run validate:constitution` - Validação constitucional
- `npm run test:coverage` - Cobertura de testes
- `npm run lint` - Qualidade de código
- `npm run format` - Formatação de código

## 🏛️ Governança

### Mantenedores

- Responsáveis por manter a conformidade constitucional
- Autoridade para aprovar emendas
- Responsáveis por code reviews

### Comunidade

- Pode propor emendas
- Participa de discussões
- Contribui com melhorias

---

**Última Atualização**: 2025-01-27  
**Versão da Constituição**: 1.0.0  
**Status**: ✅ ATIVA

Esta Constituição é um documento vivo que evolui com o projeto, sempre mantendo os princípios fundamentais de excelência técnica e conformidade com padrões.
