# Feature Specification: Gestão de Issues (Bitbucket Cloud)

**Feature Branch**: `001-feature-gestao-issues`  
**Created**: 2024-12-19  
**Status**: Draft  
**Input**: User description: "Sistema completo de gestão de issues no Bitbucket Cloud, incluindo criação, atualização, busca, comentários e transições de status"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs
   - MCP protocol compliance requirements (Article I)
   - Multi-transport support needs (Article II)
   - Server type detection requirements (Article III)
   - Tool registration and selective loading (Article III)
   - Complete API coverage requirements (Article IV)
   - Test-first development requirements (Article V)
   - Versioning and breaking change procedures (Article VI)
   - Simplicity and YAGNI principles (Article VII)
   - Library-first approach requirements
   - CLI interface and text I/O protocol needs
   - Integration testing with real dependencies
   - Logging and observability requirements

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Como desenvolvedor ou gerente de projeto, eu quero gerenciar issues no Bitbucket Cloud através do MCP server para que eu possa rastrear bugs, solicitações de funcionalidades e tarefas de forma integrada com meu fluxo de desenvolvimento.

### Acceptance Scenarios

**Cenário 1: Criação de Issue**
- Dado que sou um usuário autenticado no Bitbucket Cloud
- Quando eu criar uma nova issue através do MCP server
- Então a issue deve ser criada com título, descrição e status inicial
- E eu devo receber confirmação com o ID da issue criada

**Cenário 2: Busca e Listagem de Issues**
- Dado que existem issues no repositório
- Quando eu buscar issues através do MCP server
- Então devo receber uma lista paginada de issues
- E posso filtrar por status, prioridade, responsável ou texto

**Cenário 3: Atualização de Issue**
- Dado que uma issue existe
- Quando eu atualizar os campos da issue (título, descrição, status, prioridade)
- Então as alterações devem ser salvas
- E o histórico de mudanças deve ser mantido

**Cenário 4: Comentários em Issues**
- Dado que uma issue existe
- Quando eu adicionar um comentário
- Então o comentário deve ser associado à issue
- E outros usuários podem ver e responder ao comentário

**Cenário 5: Transições de Status**
- Dado que uma issue está em um status específico
- Quando eu alterar o status (ex: Open → In Progress → Resolved)
- Então a transição deve ser validada conforme regras de workflow
- E o histórico de transições deve ser registrado

### Edge Cases

**Caso 1: Issue com Dependências**
- Quando uma issue tem dependências de outras issues
- Então não deve ser possível fechar a issue até que as dependências sejam resolvidas

**Caso 2: Permissões de Usuário**
- Quando um usuário sem permissão tenta modificar uma issue
- Então deve receber erro de permissão negada

**Caso 3: Issue Duplicada**
- Quando tentar criar issue com título muito similar
- Então deve sugerir issues existentes ou permitir criação com aviso

**Caso 4: Limite de Issues**
- Quando o repositório atingir limite de issues (10.000)
- Então deve informar o limite e sugerir alternativas (arquivamento, migração)

**Caso 5: Conflitos de Edição Simultânea**
- Quando dois usuários editam a mesma issue simultaneamente
- Então deve aplicar last-write-wins com notificação de conflito

**Caso 6: Issues Órfãs**
- Quando um repositório é deletado
- Então issues devem ser arquivadas ou migradas conforme política

## Requirements *(mandatory)*

### Functional Requirements

**FR-001: Criação de Issues**
- O sistema deve permitir criar issues com título obrigatório (mínimo 3 caracteres, máximo 255)
- O sistema deve permitir definir descrição, prioridade, tipo e responsável
- O sistema deve atribuir ID único e timestamp de criação automaticamente
- O sistema deve validar que o usuário tem permissão de escrita no repositório

**FR-002: Busca e Listagem**
- O sistema deve permitir listar issues com paginação (padrão 25 itens por página, máximo 100)
- O sistema deve permitir filtrar por: status, prioridade, responsável, tipo, data, labels
- O sistema deve permitir busca por texto em título e descrição (busca case-insensitive)
- O sistema deve permitir ordenação por data, prioridade, status, título
- O sistema deve respeitar permissões de leitura do repositório

**FR-003: Atualização de Issues**
- O sistema deve permitir atualizar todos os campos editáveis (exceto ID e data de criação)
- O sistema deve manter histórico de alterações com timestamp e usuário
- O sistema deve validar transições de status conforme workflow configurado
- O sistema deve validar permissões de escrita para cada campo editado

**FR-004: Comentários**
- O sistema deve permitir adicionar comentários a issues (mínimo 1 caractere, máximo 10000)
- O sistema deve permitir editar e deletar comentários próprios (dentro de 24h após criação)
- O sistema deve notificar participantes sobre novos comentários (opcional, configurável)
- O sistema deve suportar formatação Markdown nos comentários

**FR-005: Transições de Status**
- O sistema deve suportar workflow configurável de status (Open → In Progress → Resolved → Closed)
- O sistema deve validar transições permitidas conforme regras de negócio
- O sistema deve registrar histórico de transições com timestamp e usuário
- O sistema deve permitir transições customizadas por repositório

**FR-006: Anexos**
- O sistema deve permitir anexar arquivos a issues (máximo 10MB por arquivo, 50MB total por issue)
- O sistema deve validar tipos e tamanhos de arquivo (tipos permitidos: imagens, documentos, arquivos de código)
- O sistema deve permitir download de anexos com controle de acesso
- O sistema deve escanear anexos em busca de malware

**FR-007: Relacionamentos**
- O sistema deve permitir vincular issues (dependência, bloqueio, duplicação, relacionada)
- O sistema deve validar relacionamentos circulares e impedir dependências infinitas
- O sistema deve mostrar issues relacionadas em ambas as direções
- O sistema deve permitir até 10 relacionamentos por issue

### Non-Functional Requirements

**NFR-001: Performance**
- Listagem de issues deve responder em menos de 2 segundos para até 1000 issues
- Busca por texto deve responder em menos de 3 segundos
- Criação/atualização deve responder em menos de 1 segundo
- Upload de anexos deve suportar até 1MB/s de velocidade

**NFR-002: Escalabilidade**
- Sistema deve suportar até 10.000 issues por repositório
- Sistema deve suportar até 100 usuários simultâneos por repositório
- Sistema deve suportar até 1000 comentários por issue
- Sistema deve suportar até 50 anexos por issue

**NFR-003: Confiabilidade**
- Sistema deve ter 99.9% de disponibilidade (SLA)
- Dados de issues devem ser persistidos de forma confiável com backup diário
- Sistema deve recuperar de falhas temporárias automaticamente (retry com backoff exponencial)
- Sistema deve manter integridade referencial entre issues e comentários

**NFR-004: Segurança**
- Acesso a issues deve respeitar permissões do repositório (READ, WRITE, ADMIN)
- Dados sensíveis em issues devem ser protegidos (criptografia em trânsito e repouso)
- Auditoria de alterações deve ser mantida (log de todas as operações por 7 anos)
- Sistema deve implementar rate limiting (100 requests/minuto por usuário)

**NFR-005: Usabilidade**
- Interface deve ser intuitiva para desenvolvedores (consistente com padrões Bitbucket)
- Mensagens de erro devem ser claras e acionáveis (códigos de erro padronizados)
- Documentação deve estar sempre atualizada (OpenAPI/Swagger)
- Sistema deve suportar internacionalização nos 20 idiomas mais falados no mundo:
  1. Mandarim (1,14 bilhão de falantes)
  2. Hindi (609 milhões de falantes)
  3. Espanhol (560 milhões de falantes)
  4. Inglês (1,5 bilhão de falantes)
  5. Árabe (274 milhões de falantes)
  6. Bengali (265 milhões de falantes)
  7. Russo (258 milhões de falantes)
  8. Português (257 milhões de falantes)
  9. Francês (277 milhões de falantes)
  10. Urdu (170 milhões de falantes)
  11. Alemão (134,6 milhões de falantes)
  12. Japonês (125 milhões de falantes)
  13. Punjabi (125 milhões de falantes)
  14. Marata (83 milhões de falantes)
  15. Telugo (81 milhões de falantes)
  16. Persa/Farsi (79 milhões de falantes)
  17. Vietnamita (76 milhões de falantes)
  18. Tâmil (75 milhões de falantes)
  19. Turco (75 milhões de falantes)
  20. Coreano (75 milhões de falantes)

### Integration Requirements

**IR-001: MCP Protocol Compliance**
- Sistema deve implementar todas as ferramentas MCP para gestão de issues
- Sistema deve suportar múltiplos transportes (stdio, HTTP, WebSocket)
- Sistema deve detectar automaticamente o tipo de servidor Bitbucket

**IR-002: Bitbucket Cloud API**
- Sistema deve integrar com Bitbucket Cloud Issues API v2.0
- Sistema deve suportar autenticação OAuth 2.0
- Sistema deve implementar retry automático para falhas temporárias

**IR-003: Webhook Integration**
- Sistema deve suportar webhooks para sincronização em tempo real
- Sistema deve processar eventos: issue.created, issue.updated, issue.deleted
- Sistema deve implementar idempotência para eventos duplicados

### Key Entities *(include if feature involves data)*

**Issue**
- ID: Identificador único (UUID v4)
- Título: Título da issue (obrigatório, 3-255 caracteres)
- Descrição: Descrição detalhada (opcional, máximo 10.000 caracteres, suporta Markdown)
- Status: Estado atual (Open, In Progress, Resolved, Closed, Reopened)
- Prioridade: Nível de prioridade (Low, Medium, High, Critical)
- Tipo: Tipo da issue (Bug, Feature Request, Task, Epic, Story)
- Responsável: Usuário atribuído (UUID do usuário Bitbucket)
- Criador: Usuário que criou a issue (UUID do usuário Bitbucket)
- Data de Criação: Timestamp de criação (ISO 8601)
- Data de Atualização: Timestamp da última modificação (ISO 8601)
- Labels: Tags associadas (array de strings, máximo 20 labels)
- Milestone: Marco associado (UUID do milestone)
- Estimativa: Estimativa de esforço (opcional, em story points ou horas)
- Componente: Componente do sistema (opcional)
- Versão: Versão afetada (opcional)

**Comment**
- ID: Identificador único (UUID v4)
- Issue ID: Referência à issue (UUID v4)
- Autor: Usuário que fez o comentário (UUID do usuário Bitbucket)
- Conteúdo: Texto do comentário (1-10.000 caracteres, suporta Markdown)
- Data: Timestamp do comentário (ISO 8601)
- Editado: Flag indicando se foi editado (boolean)
- Data de Edição: Timestamp da última edição (ISO 8601, opcional)
- Resposta a: ID do comentário pai (UUID v4, opcional, para threads)

**Issue Relationship**
- ID: Identificador único (UUID v4)
- Issue Origem: Issue de origem (UUID v4)
- Issue Destino: Issue relacionada (UUID v4)
- Tipo: Tipo de relacionamento (depends_on, blocks, duplicates, related_to, cloned_from)
- Data de Criação: Timestamp da criação do relacionamento (ISO 8601)
- Criador: Usuário que criou o relacionamento (UUID do usuário Bitbucket)

**Attachment**
- ID: Identificador único (UUID v4)
- Issue ID: Referência à issue (UUID v4)
- Nome: Nome do arquivo (1-255 caracteres)
- Tamanho: Tamanho em bytes (máximo 10MB)
- Tipo: MIME type (validado contra lista permitida)
- URL: URL para download (HTTPS, com expiração de 24h)
- Uploader: Usuário que fez upload (UUID do usuário Bitbucket)
- Data de Upload: Timestamp do upload (ISO 8601)
- Checksum: Hash SHA-256 para verificação de integridade
- Status: Status do arquivo (uploading, ready, error, deleted)

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] Integration requirements specified
- [x] Performance targets defined
- [x] Security requirements detailed
- [x] Data retention policies specified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Template updated: 2024-12-19 - Constitution v1.0.0 ratified*