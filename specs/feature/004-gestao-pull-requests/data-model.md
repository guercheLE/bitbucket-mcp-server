# Data Model: Gestão de Pull Requests

**Feature**: 004-gestao-pull-requests  
**Date**: 2025-01-27  
**Status**: Complete

## Overview
Modelo de dados completo para gestão de pull requests no Bitbucket, incluindo entidades principais, relacionamentos, validações e transições de estado, compatível com Data Center 7.16+ e Cloud APIs.

## Core Entities

### PullRequest
Representa uma solicitação de merge entre branches no Bitbucket.

```typescript
interface PullRequest {
  // Identificação
  id: number;                    // ID único do pull request
  version: number;               // Versão para controle de concorrência
  
  // Metadados básicos
  title: string;                 // Título do pull request
  description?: string;          // Descrição detalhada
  state: PullRequestState;       // Estado atual
  
  // Referências de branch
  fromRef: Ref;                  // Branch origem
  toRef: Ref;                    // Branch destino
  
  // Usuários e participantes
  author: User;                  // Autor do pull request
  reviewers: Reviewer[];         // Lista de revisores
  participants: Participant[];   // Lista de participantes
  
  // Timestamps
  createdDate: string;           // Data de criação (ISO 8601)
  updatedDate: string;           // Data da última atualização
  
  // Status e flags
  open: boolean;                 // Se está aberto
  closed: boolean;               // Se está fechado
  locked: boolean;               // Se está bloqueado
  
  // Configurações de merge
  closeSourceBranch?: boolean;   // Fechar branch origem após merge
  mergeCommit?: Commit;          // Commit de merge (se aplicável)
  
  // Links e recursos
  links: Links;                  // Links para recursos relacionados
}
```

**Validações**:
- `id`: Deve ser número positivo
- `version`: Deve ser número não-negativo
- `title`: Deve ter entre 1 e 255 caracteres
- `description`: Máximo 32768 caracteres
- `state`: Deve ser um dos valores válidos
- `fromRef` e `toRef`: Devem ser referências válidas
- `author`: Deve ser usuário válido

**Transições de Estado**:
- `OPEN` → `MERGED` (via merge)
- `OPEN` → `DECLINED` (via decline)
- `MERGED` → `OPEN` (via reopen)
- `DECLINED` → `OPEN` (via reopen)

### Comment
Representa um comentário em um pull request.

```typescript
interface Comment {
  // Identificação
  id: number;                    // ID único do comentário
  version: number;               // Versão para controle de concorrência
  
  // Conteúdo
  text: string;                  // Texto do comentário
  
  // Metadados
  author: User;                  // Autor do comentário
  createdDate: string;           // Data de criação
  updatedDate?: string;          // Data da última atualização
  
  // Hierarquia
  parent?: Comment;              // Comentário pai (para threads)
  comments?: Comment[];          // Comentários filhos
  
  // Contexto
  anchor?: CommentAnchor;        // Âncora no código (se aplicável)
  
  // Status
  deleted?: boolean;             // Se foi deletado
  severity?: CommentSeverity;    // Severidade do comentário
  
  // Links
  links: Links;                  // Links para recursos relacionados
}
```

**Validações**:
- `id`: Deve ser número positivo
- `version`: Deve ser número não-negativo
- `text`: Deve ter entre 1 e 32768 caracteres
- `author`: Deve ser usuário válido
- `parent`: Se especificado, deve ser comentário válido

### Reviewer
Representa um revisor designado para um pull request.

```typescript
interface Reviewer {
  // Usuário
  user: User;                    // Usuário revisor
  
  // Status de revisão
  approved: boolean;             // Se aprovou
  status: ReviewStatus;          // Status da revisão
  
  // Metadados
  lastReviewedCommit?: string;   // Último commit revisado
  role: ReviewRole;              // Papel na revisão
  
  // Timestamps
  participatedOn?: string;       // Data de participação
}
```

**Validações**:
- `user`: Deve ser usuário válido
- `status`: Deve ser um dos valores válidos
- `role`: Deve ser um dos valores válidos

### Participant
Representa um participante em um pull request.

```typescript
interface Participant {
  // Usuário
  user: User;                    // Usuário participante
  
  // Papel e status
  role: ParticipantRole;         // Papel do participante
  approved: boolean;             // Se aprovou
  status?: ParticipantStatus;    // Status do participante
  
  // Timestamps
  participatedOn: string;        // Data de participação
}
```

**Validações**:
- `user`: Deve ser usuário válido
- `role`: Deve ser um dos valores válidos
- `status`: Se especificado, deve ser um dos valores válidos

### Activity
Representa uma atividade no histórico do pull request.

```typescript
interface Activity {
  // Identificação
  id: number;                    // ID único da atividade
  
  // Tipo e ação
  action: ActivityAction;        // Tipo de atividade
  commentAction?: CommentAction; // Ação específica de comentário
  
  // Usuário e contexto
  user: User;                    // Usuário que executou a atividade
  createdDate: string;           // Data da atividade
  
  // Detalhes específicos
  comment?: Comment;             // Comentário associado (se aplicável)
  fromHash?: string;             // Hash de origem (se aplicável)
  toHash?: string;               // Hash de destino (se aplicável)
  
  // Metadados adicionais
  added?: boolean;               // Se foi adicionado
  removed?: boolean;             // Se foi removido
}
```

**Validações**:
- `id`: Deve ser número positivo
- `action`: Deve ser um dos valores válidos
- `user`: Deve ser usuário válido
- `comment`: Se especificado, deve ser comentário válido

## Supporting Entities

### Ref
Representa uma referência de branch ou tag.

```typescript
interface Ref {
  id: string;                    // ID da referência (ex: refs/heads/main)
  displayId: string;             // ID de exibição (ex: main)
  latestCommit: string;          // Último commit
  repository: Repository;        // Repositório da referência
}
```

### User
Representa um usuário do Bitbucket.

```typescript
interface User {
  name: string;                  // Nome do usuário
  emailAddress?: string;         // Email do usuário
  id?: number;                   // ID numérico (Data Center)
  slug?: string;                 // Slug do usuário (Cloud)
  displayName?: string;          // Nome de exibição
  active?: boolean;              // Se está ativo
  type?: string;                 // Tipo do usuário
  links?: Links;                 // Links para recursos
}
```

### Repository
Representa um repositório do Bitbucket.

```typescript
interface Repository {
  slug: string;                  // Slug do repositório
  name: string;                  // Nome do repositório
  project: Project;              // Projeto do repositório
  scmId?: string;                // Tipo de SCM (git, hg)
  public?: boolean;              // Se é público
  forkable?: boolean;            // Se pode ser forkado
  links?: Links;                 // Links para recursos
}
```

### Project
Representa um projeto do Bitbucket.

```typescript
interface Project {
  key: string;                   // Chave do projeto
  name: string;                  // Nome do projeto
  description?: string;          // Descrição do projeto
  public?: boolean;              // Se é público
  type?: string;                 // Tipo do projeto
  links?: Links;                 // Links para recursos
}
```

### Commit
Representa um commit do Git.

```typescript
interface Commit {
  id: string;                    // Hash do commit
  displayId: string;             // ID de exibição
  author: User;                  // Autor do commit
  authorTimestamp: string;       // Timestamp do autor
  committer?: User;              // Committer (se diferente do autor)
  committerTimestamp?: string;   // Timestamp do committer
  message: string;               // Mensagem do commit
  parents?: Commit[];            // Commits pais
}
```

### Links
Representa links para recursos relacionados.

```typescript
interface Links {
  self?: Link[];                 // Link para o próprio recurso
  html?: Link[];                 // Link para interface web
  clone?: Link[];                // Links de clone
  [key: string]: Link[];         // Outros links
}

interface Link {
  href: string;                  // URL do link
  name?: string;                 // Nome do link
}
```

## Enums and Types

### PullRequestState
```typescript
type PullRequestState = 
  | 'OPEN'       // Aberto
  | 'MERGED'     // Mergeado
  | 'DECLINED'   // Recusado
  | 'SUPERSEDED' // Substituído
  | 'DRAFT';     // Rascunho (Cloud apenas)
```

### ReviewStatus
```typescript
type ReviewStatus = 
  | 'APPROVED'   // Aprovado
  | 'NEEDS_WORK' // Precisa de trabalho
  | 'UNAPPROVED'; // Não aprovado
```

### ReviewRole
```typescript
type ReviewRole = 
  | 'REVIEWER'   // Revisor
  | 'AUTHOR'     // Autor
  | 'PARTICIPANT'; // Participante
```

### ParticipantRole
```typescript
type ParticipantRole = 
  | 'AUTHOR'     // Autor
  | 'REVIEWER'   // Revisor
  | 'PARTICIPANT'; // Participante
```

### ParticipantStatus
```typescript
type ParticipantStatus = 
  | 'APPROVED'   // Aprovado
  | 'NEEDS_WORK' // Precisa de trabalho
  | 'UNAPPROVED'; // Não aprovado
```

### ActivityAction
```typescript
type ActivityAction = 
  | 'COMMENTED'      // Comentou
  | 'OPENED'         // Abriu
  | 'MERGED'         // Mergeou
  | 'DECLINED'       // Recusou
  | 'REOPENED'       // Reabriu
  | 'RESCOPED'       // Reescopo
  | 'UPDATED'        // Atualizou
  | 'APPROVED'       // Aprovou
  | 'UNAPPROVED'     // Desaprovou
  | 'REVIEWED'       // Revisou
  | 'COMMENTED_ON_COMMIT'; // Comentou em commit
```

### CommentAction
```typescript
type CommentAction = 
  | 'ADDED'      // Adicionado
  | 'UPDATED'    // Atualizado
  | 'DELETED';   // Deletado
```

### CommentSeverity
```typescript
type CommentSeverity = 
  | 'NORMAL'     // Normal
  | 'BLOCKER'    // Bloqueador
  | 'WARNING';   // Aviso
```

### CommentAnchor
```typescript
interface CommentAnchor {
  line: number;                  // Linha do código
  lineType: 'ADDED' | 'REMOVED' | 'CONTEXT'; // Tipo de linha
  fileType: 'FROM' | 'TO';       // Tipo de arquivo
  path: string;                  // Caminho do arquivo
  srcPath?: string;              // Caminho de origem (se diferente)
}
```

## Validation Rules

### PullRequest Validation
- `title`: Obrigatório, 1-255 caracteres
- `description`: Opcional, máximo 32768 caracteres
- `fromRef`: Obrigatório, deve existir
- `toRef`: Obrigatório, deve existir
- `reviewers`: Opcional, lista de usuários válidos
- `closeSourceBranch`: Opcional, boolean

### Comment Validation
- `text`: Obrigatório, 1-32768 caracteres
- `parent`: Opcional, deve ser comentário válido
- `anchor`: Opcional, deve ter linha e caminho válidos

### Reviewer Validation
- `user`: Obrigatório, deve ser usuário válido
- `status`: Opcional, deve ser status válido
- `role`: Opcional, deve ser role válido

## State Transitions

### PullRequest State Machine
```
OPEN ──merge──→ MERGED
 │                │
 │                └──reopen──→ OPEN
 │
 └──decline──→ DECLINED
     │
     └──reopen──→ OPEN
```

### Comment Lifecycle
```
CREATED ──update──→ UPDATED
   │
   └──delete──→ DELETED
```

### Reviewer Lifecycle
```
ASSIGNED ──approve──→ APPROVED
    │
    └──needs_work──→ NEEDS_WORK
        │
        └──approve──→ APPROVED
```

## API Mapping

### Data Center API (1.0)
- PullRequest → `/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`
- Comment → `/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments`
- Activity → `/rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities`

### Cloud API (2.0)
- PullRequest → `/2.0/repositories/{workspace}/{repo_slug}/pullrequests`
- Comment → `/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments`
- Activity → `/2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity`

## Performance Considerations

### Pagination
- PullRequests: Máximo 1000 por página
- Comments: Máximo 1000 por página
- Activities: Máximo 1000 por página

### Caching
- PullRequest metadata: TTL 5 minutos
- Comments: TTL 2 minutos
- Activities: TTL 1 minuto

### Response Time Targets
- CRUD operations: <500ms
- List operations: <2s
- Diff operations: <5s
- Merge operations: <30s

## Security Considerations

### Data Sanitization
- Sanitizar tokens de autenticação em logs
- Sanitizar senhas e chaves em metadados
- Sanitizar URLs com credenciais

### Permission Validation
- Verificar acesso ao repositório
- Verificar permissões de pull request
- Verificar permissões de comentário
- Verificar permissões de merge

### Audit Trail
- Log de todas as operações críticas
- Log de mudanças de estado
- Log de operações de merge/decline
- Log de adição/remoção de revisores

## Conclusion
O modelo de dados fornece uma representação completa e consistente das entidades de pull request do Bitbucket, com validações adequadas, transições de estado bem definidas e mapeamento completo para as APIs do Data Center e Cloud. O modelo é otimizado para performance, segurança e conformidade com os requisitos constitucionais.
