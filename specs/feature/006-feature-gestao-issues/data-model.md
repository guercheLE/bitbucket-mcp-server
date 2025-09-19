# Data Model: Gestão de Issues (Bitbucket Cloud)

**Feature**: 001-feature-gestao-issues  
**Date**: 2024-12-19  
**Status**: Complete

## Overview

Modelo de dados para gestão de issues no Bitbucket Cloud, baseado na Issues API v2.0 e alinhado com os requisitos funcionais da especificação.

## Core Entities

### 1. Issue

**Purpose**: Representa uma issue no repositório Bitbucket Cloud

**Fields**:
```typescript
interface Issue {
  // Identificadores
  id: number;                    // ID único da issue (64-bit integer)
  repository: RepositoryRef;     // Referência ao repositório
  
  // Conteúdo
  title: string;                 // Título (3-255 caracteres, obrigatório)
  content: IssueContent;         // Descrição (opcional, máximo 10.000 caracteres, Markdown)
  kind: IssueKind;              // Tipo: bug, enhancement, proposal, task
  priority: IssuePriority;      // Prioridade: trivial, minor, major, critical, blocker
  state: IssueState;            // Estado: new, open, resolved, on hold, invalid, duplicate, wontfix, closed
  
  // Metadados
  reporter: User;               // Usuário que reportou
  assignee?: User;              // Usuário atribuído (opcional)
  component?: Component;        // Componente (opcional)
  milestone?: Milestone;        // Milestone (opcional)
  version?: Version;            // Versão afetada (opcional)
  
  // Relacionamentos
  watchers: User[];             // Lista de watchers
  votes: number;                // Número de votos
  voters: User[];               // Lista de votantes
  
  // Timestamps
  created_on: string;           // Data de criação (ISO 8601)
  updated_on: string;           // Data de atualização (ISO 8601)
  edited_on?: string;           // Data de última edição (ISO 8601, opcional)
  
  // Links
  links: IssueLinks;            // Links para recursos relacionados
}
```

**Validation Rules**:
- `title`: Obrigatório, 3-255 caracteres
- `content.raw`: Opcional, máximo 10.000 caracteres
- `kind`: Deve ser um dos valores válidos
- `priority`: Deve ser um dos valores válidos
- `state`: Deve ser um dos valores válidos

**State Transitions**:
```
new → open → resolved → closed
  ↓     ↓        ↓
  └─────┴────────┴→ duplicate
  └─────┴────────┴→ wontfix
  └─────┴────────┴→ invalid
  └─────┴────────┴→ on hold
```

### 2. Comment

**Purpose**: Representa um comentário em uma issue

**Fields**:
```typescript
interface Comment {
  // Identificadores
  id: number;                   // ID único do comentário
  issue: IssueRef;              // Referência à issue
  
  // Conteúdo
  content: CommentContent;      // Conteúdo do comentário (1-10.000 caracteres, Markdown)
  
  // Metadados
  user: User;                   // Autor do comentário
  created_on: string;           // Data de criação (ISO 8601)
  updated_on: string;           // Data de atualização (ISO 8601)
  edited_on?: string;           // Data de última edição (ISO 8601, opcional)
  
  // Relacionamentos
  parent?: CommentRef;          // Comentário pai (para threads)
  replies: Comment[];           // Respostas ao comentário
  
  // Links
  links: CommentLinks;          // Links para recursos relacionados
}
```

**Validation Rules**:
- `content.raw`: Obrigatório, 1-10.000 caracteres
- `user`: Obrigatório
- Edição permitida apenas pelo autor e dentro de 24h após criação

### 3. Issue Relationship

**Purpose**: Representa relacionamentos entre issues

**Fields**:
```typescript
interface IssueRelationship {
  // Identificadores
  id: number;                   // ID único do relacionamento
  
  // Relacionamento
  source: IssueRef;             // Issue de origem
  destination: IssueRef;        // Issue relacionada
  kind: RelationshipKind;       // Tipo: relates_to, blocks, blocked_by, duplicates, duplicated_by
  
  // Metadados
  created_on: string;           // Data de criação (ISO 8601)
  user: User;                   // Usuário que criou o relacionamento
  
  // Links
  links: RelationshipLinks;     // Links para recursos relacionados
}
```

**Validation Rules**:
- `source` e `destination`: Devem ser issues diferentes
- `kind`: Deve ser um dos valores válidos
- Máximo 10 relacionamentos por issue
- Validação de dependências circulares

### 4. Attachment

**Purpose**: Representa um anexo em uma issue

**Fields**:
```typescript
interface Attachment {
  // Identificadores
  name: string;                 // Nome do arquivo (1-255 caracteres)
  path: string;                 // Caminho do arquivo no repositório
  issue: IssueRef;              // Referência à issue
  
  // Metadados
  size: number;                 // Tamanho em bytes (máximo 10MB)
  type: string;                 // MIME type
  user: User;                   // Usuário que fez upload
  created_on: string;           // Data de upload (ISO 8601)
  
  // Links
  links: AttachmentLinks;       // Links para download
}
```

**Validation Rules**:
- `name`: Obrigatório, 1-255 caracteres
- `size`: Máximo 10MB por arquivo, 50MB total por issue
- `type`: Deve ser um tipo permitido (imagens, documentos, código)
- Verificação de malware obrigatória

## Supporting Types

### User
```typescript
interface User {
  uuid: string;                 // UUID do usuário
  display_name: string;         // Nome de exibição
  account_id: string;           // Account ID
  nickname: string;             // Apelido
  links: UserLinks;             // Links do usuário
}
```

### Repository Reference
```typescript
interface RepositoryRef {
  type: "repository";
  uuid: string;                 // UUID do repositório
  name: string;                 // Nome do repositório
  full_name: string;            // Nome completo (workspace/repo)
  links: RepositoryLinks;       // Links do repositório
}
```

### Issue Reference
```typescript
interface IssueRef {
  type: "issue";
  id: number;                   // ID da issue
  title: string;                // Título da issue
  links: IssueLinks;            // Links da issue
}
```

### Content Types
```typescript
interface IssueContent {
  raw: string;                  // Conteúdo bruto (Markdown)
  markup: "markdown";           // Tipo de markup
  html: string;                 // Conteúdo renderizado em HTML
}

interface CommentContent {
  raw: string;                  // Conteúdo bruto (Markdown)
  markup: "markdown";           // Tipo de markup
  html: string;                 // Conteúdo renderizado em HTML
}
```

### Enums
```typescript
type IssueKind = "bug" | "enhancement" | "proposal" | "task";
type IssuePriority = "trivial" | "minor" | "major" | "critical" | "blocker";
type IssueState = "new" | "open" | "resolved" | "on hold" | "invalid" | "duplicate" | "wontfix" | "closed";
type RelationshipKind = "relates_to" | "blocks" | "blocked_by" | "duplicates" | "duplicated_by";
```

### Link Types
```typescript
interface IssueLinks {
  self: Link;
  html: Link;
  comments: Link;
  attachments: Link;
  watch: Link;
  vote: Link;
}

interface CommentLinks {
  self: Link;
  html: Link;
}

interface AttachmentLinks {
  self: Link;
  download: Link;
}

interface Link {
  href: string;
}
```

## Data Relationships

### Issue Relationships
```
Issue (1) ←→ (N) Comment
Issue (1) ←→ (N) Attachment
Issue (1) ←→ (N) IssueRelationship (source)
Issue (1) ←→ (N) IssueRelationship (destination)
Issue (N) ←→ (1) User (reporter)
Issue (N) ←→ (1) User (assignee)
Issue (N) ←→ (1) Component
Issue (N) ←→ (1) Milestone
Issue (N) ←→ (1) Version
```

### Comment Relationships
```
Comment (N) ←→ (1) Issue
Comment (N) ←→ (1) User (author)
Comment (1) ←→ (N) Comment (replies)
Comment (N) ←→ (1) Comment (parent)
```

## Validation Rules Summary

### Issue Validation
- Título: 3-255 caracteres, obrigatório
- Descrição: máximo 10.000 caracteres, opcional
- Tipo: deve ser um dos valores válidos
- Prioridade: deve ser um dos valores válidos
- Estado: deve ser um dos valores válidos
- Transições de estado: validadas conforme workflow

### Comment Validation
- Conteúdo: 1-10.000 caracteres, obrigatório
- Edição: apenas pelo autor, dentro de 24h
- Markdown: suportado para formatação

### Relationship Validation
- Máximo 10 relacionamentos por issue
- Sem dependências circulares
- Issues diferentes (source ≠ destination)

### Attachment Validation
- Nome: 1-255 caracteres
- Tamanho: máximo 10MB por arquivo, 50MB total por issue
- Tipo: apenas tipos permitidos
- Verificação de malware

## Performance Considerations

### Indexing Strategy
- Issues: indexado por repository, state, assignee, reporter
- Comments: indexado por issue, user, created_on
- Relationships: indexado por source, destination, kind
- Attachments: indexado por issue, user, created_on

### Caching Strategy
- Issues: cache de 5 minutos (TTL)
- Comments: cache de 2 minutos (TTL)
- Relationships: cache de 10 minutos (TTL)
- Attachments: cache de 1 hora (TTL)

### Pagination
- Issues: 25 itens por página (padrão), máximo 100
- Comments: 25 itens por página (padrão), máximo 100
- Relationships: 25 itens por página (padrão), máximo 100
- Attachments: 25 itens por página (padrão), máximo 100

---

*Data model completed: 2024-12-19*  
*Based on Bitbucket Cloud Issues API v2.0*  
*Constitution compliant*
