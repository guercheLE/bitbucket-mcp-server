# Research: Gestão de Issues (Bitbucket Cloud)

**Feature**: 001-feature-gestao-issues  
**Date**: 2024-12-19  
**Status**: Complete

## Research Summary

Esta pesquisa resolve todas as incertezas identificadas na especificação da funcionalidade de gestão de issues do Bitbucket Cloud, garantindo conformidade total com a Constituição do projeto.

## Research Findings

### 1. Bitbucket Cloud Issues API v2.0

**Decision**: Implementar todos os 25 endpoints da Issues API v2.0 do Bitbucket Cloud como ferramentas MCP

**Rationale**: 
- A Issues API v2.0 é a API oficial e mais recente para gestão de issues no Bitbucket Cloud
- Fornece funcionalidades completas: CRUD, comentários, transições, anexos, relacionamentos
- Suporte a 64-bit integer IDs (efetivo em setembro de 2025)
- Integração nativa com webhooks e notificações

**Alternatives considered**:
- Issues API v1.0: Descontinuada, funcionalidades limitadas
- Jira Integration: Adiciona complexidade desnecessária para issues nativas do Bitbucket
- Custom implementation: Violaria Article IV (Complete API Coverage)

**Endpoints identificados**:
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues` - Listar issues
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues` - Criar issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Obter issue
- `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Atualizar issue
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}` - Deletar issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - Listar comentários
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments` - Criar comentário
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Obter comentário
- `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Atualizar comentário
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id}` - Deletar comentário
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/transitions` - Listar transições
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/transitions` - Transicionar issue
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers` - Listar watchers
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers` - Adicionar watcher
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/watchers/{username}` - Remover watcher
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` - Listar anexos
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments` - Upload anexo
- `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` - Obter anexo
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path}` - Deletar anexo
- `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` - Votar em issue
- `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote` - Remover voto
- `GET /2.0/repositories/{workspace}/{repo_slug}/components` - Listar componentes
- `POST /2.0/repositories/{workspace}/{repo_slug}/components` - Criar componente
- `GET /2.0/repositories/{workspace}/{repo_slug}/versions` - Listar versões
- `GET /2.0/repositories/{workspace}/{repo_slug}/milestones` - Listar milestones

### 2. MCP Tool Registration Strategy

**Decision**: Registrar ferramentas Issues apenas para servidores Bitbucket Cloud

**Rationale**:
- Issues são funcionalidade específica do Bitbucket Cloud (não disponível no Data Center)
- Article III (Selective Tool Registration) requer registro baseado em capacidades do servidor
- Degradação graciosa: servidores Data Center não terão ferramentas Issues disponíveis

**Alternatives considered**:
- Universal registration: Violaria Article III e causaria erros em servidores Data Center
- Feature detection: Adiciona complexidade desnecessária para funcionalidade Cloud-only

### 3. Authentication Strategy

**Decision**: Usar OAuth 2.0 como método primário, com fallback para Personal Access Tokens

**Rationale**:
- OAuth 2.0 é o método preferido conforme Constituição (Article I)
- Personal Access Tokens como fallback para casos onde OAuth não é viável
- Suporte a App Passwords e Basic Auth para compatibilidade com sistemas legados

**Alternatives considered**:
- Apenas OAuth 2.0: Muito restritivo para alguns casos de uso
- Apenas Personal Access Tokens: Não segue as melhores práticas de segurança

### 4. Data Model Design

**Decision**: Implementar entidades Issue, Comment, IssueRelationship, Attachment conforme especificação

**Rationale**:
- Entidades definidas na especificação cobrem todos os casos de uso identificados
- Estrutura alinhada com Bitbucket Cloud Issues API v2.0
- Suporte a relacionamentos complexos entre issues

**Alternatives considered**:
- Modelo simplificado: Não atenderia requisitos de relacionamentos e anexos
- Modelo mais complexo: Violaria Article VII (Simplicity)

### 5. Testing Strategy

**Decision**: Implementar TDD com cobertura >80% seguindo Article V

**Rationale**:
- Article V (Test-First) é NON-NEGOTIABLE
- Cobertura >80% obrigatória para qualidade
- Testes de contrato, integração e unitários para cada ferramenta

**Test categories**:
- Contract tests: Validação de schemas de request/response
- Integration tests: Testes com API real do Bitbucket Cloud
- Unit tests: Testes isolados de cada ferramenta MCP

### 6. Performance Requirements

**Decision**: Implementar cache com TTL de 5 minutos e rate limiting

**Rationale**:
- Performance targets: <2s para 95% das requisições
- Cache reduz chamadas desnecessárias à API
- Rate limiting previne abuso e garante SLA

**Alternatives considered**:
- Sem cache: Violaria requisitos de performance
- Cache muito agressivo: Dados desatualizados

### 7. Error Handling Strategy

**Decision**: Implementar retry com backoff exponencial e circuit breaker

**Rationale**:
- Falhas temporárias da API são comuns
- Circuit breaker previne cascading failures
- Backoff exponencial evita sobrecarga do servidor

**Alternatives considered**:
- Sem retry: Alta taxa de falhas temporárias
- Retry linear: Pode sobrecarregar servidor em falhas

### 8. Internationalization Support

**Decision**: Suportar 20 idiomas mais falados conforme especificação

**Rationale**:
- Requisito explícito na especificação (NFR-005)
- Usa i18next com fs-backend conforme Constituição
- Idioma padrão: pt-BR

**Alternatives considered**:
- Apenas inglês: Não atenderia requisitos de usabilidade global
- Suporte completo a todos os idiomas: Complexidade excessiva

## Technical Decisions

### MCP SDK Integration
- **SDK**: @modelcontextprotocol/sdk (latest with Zod support)
- **Schema validation**: Zod schemas integrados com MCP SDK
- **Tool registration**: Seletivo baseado em tipo de servidor

### HTTP Client Configuration
- **Client**: Axios com interceptors
- **Retry**: 3 tentativas com backoff exponencial
- **Timeout**: 30 segundos para operações longas
- **Rate limiting**: 100 requests/minuto por usuário

### Logging Strategy
- **Library**: Winston com sanitização
- **Format**: JSON estruturado
- **Levels**: error, warn, info, debug
- **Sanitization**: Dados sensíveis removidos automaticamente

## Resolved Uncertainties

✅ **API Version**: Issues API v2.0 (Cloud-only)  
✅ **Authentication**: OAuth 2.0 primário, PAT fallback  
✅ **Tool Registration**: Cloud-specific only  
✅ **Data Model**: 4 entidades principais (Issue, Comment, Relationship, Attachment)  
✅ **Testing**: TDD com >80% cobertura  
✅ **Performance**: Cache + rate limiting  
✅ **Error Handling**: Retry + circuit breaker  
✅ **Internationalization**: 20 idiomas suportados  

## Next Steps

1. **Phase 1**: Criar data-model.md com entidades detalhadas
2. **Phase 1**: Gerar contratos OpenAPI para todos os endpoints
3. **Phase 1**: Criar testes de contrato (failing)
4. **Phase 1**: Documentar quickstart.md
5. **Phase 2**: Gerar tasks.md com implementação TDD

---

*Research completed: 2024-12-19*  
*All NEEDS CLARIFICATION markers resolved*  
*Constitution compliance verified*
