# Research: Gestão de Pull Requests

**Feature**: 004-gestao-pull-requests  
**Date**: 2025-01-27  
**Status**: Complete

## Research Summary
Análise completa dos requisitos para implementação de gestão de pull requests no Bitbucket MCP Server, incluindo operações CRUD, comentários, análise de diffs, merge/decline/reopen, com suporte para Data Center 7.16+ e Cloud.

## Technology Research

### MCP Protocol Implementation
**Decision**: Usar @modelcontextprotocol/sdk oficial com Zod schemas
**Rationale**: 
- Garante compatibilidade total com clientes MCP
- Zod integrado para validação de schemas
- Suporte nativo para múltiplos transportes
- Documentação oficial como fonte única de verdade

**Alternatives considered**:
- Implementação customizada: Rejeitada por violar Article I
- Outras bibliotecas MCP: Rejeitadas por não serem oficiais

### Bitbucket API Integration
**Decision**: Implementar cobertura completa de 18 endpoints de pull requests
**Rationale**:
- Data Center API 1.0: 18 endpoints para pull requests
- Cloud API 2.0: 18 endpoints equivalentes
- Suporte para todas as operações: CRUD, comentários, atividades, diffs, merge
- Detecção automática de tipo de servidor (Article III)

**Endpoints identificados**:
- Data Center: `/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/*`
- Cloud: `/2.0/repositories/{workspace}/{repo_slug}/pullrequests/*`

**Alternatives considered**:
- Implementação parcial: Rejeitada por violar Article IV
- Endpoints customizados: Rejeitados por não seguirem padrões Bitbucket

### Authentication Strategy
**Decision**: Suporte completo para OAuth 2.0, Personal Access Tokens, App Passwords, Basic Auth
**Rationale**:
- Prioridade: OAuth 2.0 → Personal Access Tokens → App Passwords → Basic Auth
- Detecção automática de método disponível
- Fallback gracioso entre métodos
- Validação de tokens antes de cada operação

**Alternatives considered**:
- Apenas OAuth 2.0: Rejeitado por limitar compatibilidade
- Apenas Basic Auth: Rejeitado por questões de segurança

### Error Handling and Resilience
**Decision**: Implementar circuit breaker, retry automático, rate limiting
**Rationale**:
- Circuit breaker para prevenir falhas em cascata
- Retry com exponential backoff para falhas temporárias
- Rate limiting para controlar uso da API
- Fallback gracioso quando Bitbucket está indisponível

**Alternatives considered**:
- Sem circuit breaker: Rejeitado por risco de falhas em cascata
- Retry infinito: Rejeitado por risco de sobrecarga

### Testing Strategy
**Decision**: TDD obrigatório com cobertura >80% (Article V)
**Rationale**:
- Testes escritos antes da implementação
- Cobertura de linha >80% obrigatória
- Testes de contrato, integração e unitários
- Gates de aprovação antes da implementação

**Estrutura de testes**:
- Contract tests: Validação de schemas MCP
- Integration tests: Comunicação com Bitbucket API
- Unit tests: Lógica de negócio isolada

**Alternatives considered**:
- Testes após implementação: Rejeitado por violar Article V
- Cobertura <80%: Rejeitado por não atender padrões de qualidade

### Performance and Caching
**Decision**: Cache com TTL de 5 minutos, response time <2s para 95% das requisições
**Rationale**:
- Cache de pull requests para reduzir chamadas à API
- TTL de 5 minutos para balancear performance e consistência
- Response time <2s para operações de pull request
- Suporte para até 1000 pull requests por página

**Alternatives considered**:
- Sem cache: Rejeitado por performance inadequada
- Cache permanente: Rejeitado por inconsistência de dados

### Multi-Transport Support
**Decision**: Suporte completo para stdio, HTTP, SSE, HTTP streaming
**Rationale**:
- Conformidade com Article II
- Implementações independentes e testáveis
- Fallback automático entre transportes
- CLI interface com text I/O

**Alternatives considered**:
- Apenas stdio: Rejeitado por violar Article II
- Transportes customizados: Rejeitados por não seguirem padrão MCP

### Selective Tool Registration
**Decision**: Detecção automática de tipo de servidor e registro seletivo de ferramentas
**Rationale**:
- Conformidade com Article III
- Detecção via `/rest/api/1.0/application-properties`
- Fallback para Data Center 7.16 quando detecção falha
- Comandos CLI registrados seletivamente baseado em capacidades

**Alternatives considered**:
- Registro manual: Rejeitado por não ser automático
- Sem fallback: Rejeitado por não ser gracioso

## Data Model Research

### Pull Request Entity
**Decision**: Modelo completo com todos os metadados do Bitbucket
**Rationale**:
- ID, versão, título, descrição, estado
- Referências de branch origem e destino
- Lista de revisores e participantes
- Timestamps de criação e atualização
- Links para recursos relacionados

**Campos principais**:
- `id`: Identificador único
- `version`: Versão para controle de concorrência
- `title`: Título do pull request
- `description`: Descrição detalhada
- `state`: Estado (OPEN, MERGED, DECLINED)
- `fromRef/toRef`: Referências de branch
- `reviewers`: Lista de revisores
- `participants`: Lista de participantes

### Comment Entity
**Decision**: Suporte para comentários e threads
**Rationale**:
- Texto do comentário
- Autor e timestamp
- Comentário pai para threads
- Versão para controle de concorrência
- Links para recursos relacionados

**Campos principais**:
- `id`: Identificador único
- `version`: Versão para controle de concorrência
- `text`: Texto do comentário
- `author`: Autor do comentário
- `createdDate`: Data de criação
- `parent`: Comentário pai (para threads)

### Activity Entity
**Decision**: Histórico completo de atividades
**Rationale**:
- Tipo de atividade (criação, comentário, aprovação, merge)
- Usuário que executou a atividade
- Timestamp da atividade
- Detalhes específicos da atividade

**Campos principais**:
- `id`: Identificador único
- `action`: Tipo de atividade
- `user`: Usuário que executou
- `createdDate`: Data da atividade
- `commentAction`: Detalhes da atividade

## Integration Patterns Research

### Bitbucket API Client
**Decision**: Cliente HTTP com Axios e interceptors
**Rationale**:
- Interceptors para autenticação automática
- Interceptors para logging e sanitização
- Suporte para retry automático
- Validação de schemas com Zod

**Alternatives considered**:
- Fetch nativo: Rejeitado por falta de interceptors
- Outras bibliotecas HTTP: Rejeitadas por não terem interceptors adequados

### Schema Validation
**Decision**: Zod schemas para validação de entrada e saída
**Rationale**:
- Integração nativa com MCP SDK
- Validação de tipos TypeScript
- Mensagens de erro descritivas
- Schemas reutilizáveis

**Alternatives considered**:
- Validação manual: Rejeitada por propensão a erros
- Outras bibliotecas de validação: Rejeitadas por não integrarem com MCP SDK

### Logging and Observability
**Decision**: Winston com logs estruturados e sanitização
**Rationale**:
- Logs estruturados em JSON
- Sanitização automática de dados sensíveis
- Níveis de log configuráveis
- Rotação de logs configurável

**Alternatives considered**:
- Console.log: Rejeitado por não ser estruturado
- Outras bibliotecas de log: Rejeitadas por não terem sanitização adequada

## Security Research

### Data Sanitization
**Decision**: Sanitização automática de dados sensíveis em logs
**Rationale**:
- Tokens de autenticação
- Senhas e chaves
- Dados pessoais de usuários
- URLs com credenciais

**Alternatives considered**:
- Sanitização manual: Rejeitada por propensão a erros
- Sem sanitização: Rejeitada por riscos de segurança

### Rate Limiting
**Decision**: Rate limiting por usuário/IP
**Rationale**:
- Controle de uso da API Bitbucket
- Prevenção de abuso
- Configuração flexível
- Headers de retry-after

**Alternatives considered**:
- Sem rate limiting: Rejeitado por risco de abuso
- Rate limiting global: Rejeitado por não ser granular

### Permission Validation
**Decision**: Validação de permissões antes de cada operação
**Rationale**:
- Verificação de acesso ao repositório
- Verificação de permissões de pull request
- Erros descritivos para operações não autorizadas
- Auditoria de operações críticas

**Alternatives considered**:
- Validação após operação: Rejeitada por ineficiência
- Sem validação: Rejeitada por riscos de segurança

## Performance Research

### Response Time Targets
**Decision**: <2s para 95% das operações de pull request
**Rationale**:
- Operações CRUD: <500ms
- Operações de busca: <2s
- Operações em lote: <30s
- Operações administrativas: <5min

**Alternatives considered**:
- Targets mais altos: Rejeitados por experiência inadequada
- Targets mais baixos: Rejeitados por não serem realistas

### Caching Strategy
**Decision**: Cache com TTL de 5 minutos
**Rationale**:
- Balance entre performance e consistência
- Cache de pull requests e metadados
- Invalidação automática por TTL
- Fallback para chamadas diretas

**Alternatives considered**:
- Cache permanente: Rejeitado por inconsistência
- Sem cache: Rejeitado por performance inadequada

### Pagination Support
**Decision**: Suporte para até 1000 pull requests por página
**Rationale**:
- Paginação eficiente para grandes volumes
- Filtros por estado, autor, revisor
- Ordenação por data, prioridade
- Metadados de paginação

**Alternatives considered**:
- Paginação limitada: Rejeitada por não atender casos de uso
- Paginação infinita: Rejeitada por problemas de performance

## Conclusion
Todas as decisões de tecnologia e arquitetura foram baseadas nos requisitos constitucionais e nas melhores práticas para implementação de servidores MCP. A abordagem garante conformidade total com o protocolo MCP, suporte completo para APIs do Bitbucket, e implementação de qualidade com TDD e cobertura de testes adequada.

**Status**: Research complete - Ready for Phase 1 design
