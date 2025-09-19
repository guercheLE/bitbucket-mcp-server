# Research: Sistema de Busca

**Feature**: Sistema de Busca  
**Date**: 2024-12-19  
**Status**: Complete

## Research Summary

Esta pesquisa resolve todas as incógnitas identificadas na especificação da feature Sistema de Busca, focando na implementação de ferramentas MCP para busca no Bitbucket seguindo os princípios constitucionais.

## Research Findings

### 1. MCP Tool Implementation for Search

**Decision**: Implementar ferramentas MCP individuais para cada tipo de busca  
**Rationale**: 
- Segue Article I (MCP Protocol First) - toda funcionalidade via ferramentas MCP padronizadas
- Permite registro seletivo baseado em tipo de servidor (Article III)
- Facilita testes individuais e cobertura >80% (Article V)
- Mantém simplicidade com abordagem YAGNI (Article VII)

**Alternatives considered**:
- Ferramenta única de busca: Rejeitada por violar simplicidade e dificultar testes
- Implementação direta na API: Rejeitada por violar Article I (MCP Protocol First)

### 2. Bitbucket Search API Coverage

**Decision**: Implementar cobertura completa dos endpoints de busca do Bitbucket  
**Rationale**:
- Data Center (7.16+): `/rest/api/1.0/search/*` endpoints
- Cloud: `/2.0/*` search endpoints  
- Segue Article IV (Complete API Coverage)
- Documentação oficial Atlassian como fonte única de verdade

**Endpoints identificados**:
- `GET /rest/api/1.0/search/repositories` - Busca de repositórios
- `GET /rest/api/1.0/search/commits` - Busca de commits  
- `GET /rest/api/1.0/search/pull-requests` - Busca de pull requests
- `GET /rest/api/1.0/search/code` - Busca de código
- `GET /rest/api/1.0/search/users` - Busca de usuários
- `GET /rest/api/1.0/search/analytics` - Analytics de busca
- `GET /rest/api/1.0/search/configuration` - Configuração de busca
- `GET /rest/api/1.0/search/indexes` - Índices de busca
- `GET /2.0/repositories` - Busca de repositórios (Cloud)
- `GET /2.0/commits` - Busca de commits (Cloud)
- `GET /2.0/pullrequests` - Busca de pull requests (Cloud)
- `GET /2.0/code` - Busca de código (Cloud)
- `GET /2.0/users` - Busca de usuários (Cloud)

**Alternatives considered**:
- Implementação parcial: Rejeitada por violar Article IV
- Endpoints customizados: Rejeitada por violar Article IV (documentação oficial como fonte única)

### 3. Search Query and Result Models

**Decision**: Usar modelos de dados definidos na especificação  
**Rationale**:
- SearchQuery: query, filters, sortBy, sortOrder, page, limit
- SearchResult: type, id, title, description, url, metadata, relevanceScore
- SearchHistory: userId, query, timestamp, resultCount, filters
- Segue padrões REST e facilita validação com Zod

**Alternatives considered**:
- Modelos customizados: Rejeitada por violar simplicidade (Article VII)
- Modelos complexos: Rejeitada por violar YAGNI (Article VII)

### 4. Test-First Development Approach

**Decision**: Implementar TDD com cobertura >80% obrigatória  
**Rationale**:
- Article V (Test-First NON-NEGOTIABLE)
- Red-Green-Refactor cycle obrigatório
- Testes de contrato, integração e unitários para cada ferramenta
- Gates de aprovação de testes antes da implementação

**Estrutura de testes**:
- `tests/contract/search-*.test.ts` - Testes de contrato para cada endpoint
- `tests/integration/search-*.test.ts` - Testes de integração com API real
- `tests/unit/search-*.test.ts` - Testes unitários para cada ferramenta

**Alternatives considered**:
- Testes após implementação: Rejeitada por violar Article V
- Cobertura <80%: Rejeitada por violar Article V

### 5. Selective Tool Registration Strategy

**Decision**: Registrar ferramentas baseado em tipo e versão do servidor  
**Rationale**:
- Article III (Selective Tool Registration)
- Detecção automática de tipo de servidor (datacenter/cloud)
- Degradação elegante para recursos indisponíveis
- Comandos de console cliente registrados seletivamente

**Estratégia de registro**:
- Data Center 7.16+: Todas as ferramentas de busca disponíveis
- Cloud: Ferramentas de busca compatíveis com API 2.0
- Fallback: Ferramentas básicas se detecção falhar

**Alternatives considered**:
- Registro universal: Rejeitada por violar Article III
- Registro manual: Rejeitada por violar princípio de detecção automática

### 6. Performance and Scalability

**Decision**: Implementar paginação, cache e rate limiting  
**Rationale**:
- NFR-001: Busca <5 segundos para consultas típicas
- NFR-002: Suporte até 1000 resultados por página
- NFR-003: Histórico de buscas por 90 dias
- Segue padrões constitucionais de performance

**Implementação**:
- Paginação usando parâmetros `start` e `limit`
- Cache com TTL de 5 minutos para resultados de busca
- Rate limiting por usuário/IP
- Histórico de busca com limpeza automática após 90 dias

**Alternatives considered**:
- Sem paginação: Rejeitada por violar NFR-002
- Cache permanente: Rejeitada por violar NFR-003 (limpeza de histórico)

### 7. Error Handling and Validation

**Decision**: Usar Zod para validação e tratamento elegante de erros  
**Rationale**:
- NFR-007: Tratamento elegante de erros sem expor detalhes internos
- Integração com MCP SDK para validação de schemas
- Logs estruturados para auditoria (NFR-006)

**Implementação**:
- Schemas Zod para validação de entrada/saída
- Sanitização de dados sensíveis nos logs
- Mensagens de erro padronizadas
- Circuit breaker para falhas de API

**Alternatives considered**:
- Validação manual: Rejeitada por violar simplicidade (Article VII)
- Exposição de detalhes internos: Rejeitada por violar NFR-007

## Technical Dependencies Resolved

### MCP SDK Integration
- **@modelcontextprotocol/sdk**: Última versão com suporte Zod
- **Zod**: Validação de schemas integrada com MCP SDK
- **Axios**: Cliente HTTP com interceptors para autenticação

### Testing Framework
- **Jest**: Framework de testes com cobertura >80%
- **Supertest**: Testes de integração HTTP
- **Mocks**: Para testes unitários isolados

### Logging and Monitoring
- **Winston**: Logs estruturados com sanitização
- **Performance metrics**: Tempo de resposta e taxa de erro
- **Health checks**: Monitoramento contínuo

## Constitution Compliance Verification

✅ **Article I**: Todas as funcionalidades via ferramentas MCP padronizadas  
✅ **Article II**: Suporte multi-transport herdado da arquitetura do servidor  
✅ **Article III**: Registro seletivo baseado em tipo/versão do servidor  
✅ **Article IV**: Cobertura completa dos endpoints de busca do Bitbucket  
✅ **Article V**: TDD obrigatório com cobertura >80%  
✅ **Article VI**: Versionamento semântico para releases  
✅ **Article VII**: Simplicidade com 1 projeto, sem over-engineering  

## Research Complete

Todas as incógnitas da especificação foram resolvidas. A implementação seguirá os princípios constitucionais com foco em simplicidade, cobertura completa de API e desenvolvimento test-first. Não há violações constitucionais identificadas.

**Próximos passos**: Prosseguir para Phase 1 (Design & Contracts) com base nesta pesquisa.
