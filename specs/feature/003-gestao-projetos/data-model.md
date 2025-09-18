# Data Model: Gestão de Projetos e Repositórios

**Feature**: 003-gestao-projetos  
**Date**: 2025-01-27  
**Status**: Complete

## Core Entities

### 1. Project (Data Center)
**Purpose**: Container organizacional que agrupa repositórios relacionados

**Fields**:
- `key`: string (required, unique) - Chave única do projeto (ex: "PROJ")
- `name`: string (required) - Nome do projeto
- `description`: string (optional) - Descrição do projeto
- `avatar`: string (optional) - URL do avatar do projeto
- `isPublic`: boolean (default: false) - Visibilidade do projeto
- `links`: object - Links para recursos relacionados
- `createdDate`: string (ISO 8601) - Data de criação
- `updatedDate`: string (ISO 8601) - Data da última atualização

**Validation Rules**:
- `key`: 1-10 caracteres, alfanumérico, maiúsculo
- `name`: 1-255 caracteres, não vazio
- `description`: máximo 1000 caracteres
- `avatar`: URL válida se fornecida

**State Transitions**:
- Created → Active (após criação)
- Active → Archived (quando arquivado)
- Archived → Active (quando restaurado)
- Active → Deleted (quando excluído)

### 2. Workspace (Cloud)
**Purpose**: Equivalente funcional ao Projeto no Bitbucket Cloud

**Fields**:
- `uuid`: string (required, unique) - UUID do workspace
- `name`: string (required) - Nome do workspace
- `slug`: string (required, unique) - Slug do workspace
- `description`: string (optional) - Descrição do workspace
- `isPrivate`: boolean (default: true) - Visibilidade do workspace
- `createdOn`: string (ISO 8601) - Data de criação
- `updatedOn`: string (ISO 8601) - Data da última atualização
- `links`: object - Links para recursos relacionados

**Validation Rules**:
- `name`: 1-255 caracteres, não vazio
- `slug`: 1-50 caracteres, alfanumérico, hífen permitido
- `description`: máximo 1000 caracteres

**State Transitions**:
- Created → Active (após criação)
- Active → Archived (quando arquivado)
- Archived → Active (quando restaurado)
- Active → Deleted (quando excluído)

### 3. Repository
**Purpose**: Repositório Git dentro de um projeto/workspace

**Fields**:
- `slug`: string (required, unique) - Slug do repositório
- `name`: string (required) - Nome do repositório
- `description`: string (optional) - Descrição do repositório
- `scmId`: string (default: "git") - Tipo de controle de versão
- `forkable`: boolean (default: true) - Permite forks
- `isPublic`: boolean (default: false) - Visibilidade do repositório
- `project`: object (Data Center) - Projeto pai
- `workspace`: object (Cloud) - Workspace pai
- `links`: object - Links para recursos relacionados
- `createdDate`: string (ISO 8601) - Data de criação
- `updatedDate`: string (ISO 8601) - Data da última atualização

**Validation Rules**:
- `slug`: 1-50 caracteres, alfanumérico, hífen permitido
- `name`: 1-255 caracteres, não vazio
- `description`: máximo 1000 caracteres
- `scmId`: deve ser "git" (único suportado)

**State Transitions**:
- Created → Active (após criação)
- Active → Archived (quando arquivado)
- Archived → Active (quando restaurado)
- Active → Deleted (quando excluído)

### 4. Permission
**Purpose**: Define o nível de acesso de usuários ou grupos

**Fields**:
- `user`: string (optional) - Nome do usuário
- `group`: string (optional) - Nome do grupo
- `permission`: string (required) - Nível de permissão
- `grantedBy`: string - Usuário que concedeu a permissão
- `grantedDate`: string (ISO 8601) - Data da concessão

**Validation Rules**:
- `user` ou `group` deve ser fornecido (não ambos)
- `permission`: deve ser um dos valores válidos
- `grantedBy`: usuário válido

**Permission Levels**:
- `PROJECT_READ` / `REPO_READ`: Apenas leitura
- `PROJECT_WRITE` / `REPO_WRITE`: Leitura e escrita
- `PROJECT_ADMIN` / `REPO_ADMIN`: Administração completa

**State Transitions**:
- Granted → Active (após concessão)
- Active → Revoked (quando revogada)
- Revoked → Active (quando re-concedida)

### 5. Webhook
**Purpose**: Configuração de notificação automática para eventos

**Fields**:
- `id`: string (required, unique) - ID do webhook
- `url`: string (required) - URL de callback
- `description`: string (optional) - Descrição do webhook
- `events`: array (required) - Lista de eventos monitorados
- `active`: boolean (default: true) - Status do webhook
- `createdDate`: string (ISO 8601) - Data de criação
- `updatedDate`: string (ISO 8601) - Data da última atualização

**Validation Rules**:
- `url`: URL válida e acessível
- `events`: array não vazio com eventos válidos
- `description`: máximo 500 caracteres

**Supported Events**:
- `repo:push`: Push para repositório
- `pullrequest:created`: Pull request criado
- `pullrequest:updated`: Pull request atualizado
- `pullrequest:approved`: Pull request aprovado
- `pullrequest:merged`: Pull request mesclado
- `pullrequest:declined`: Pull request recusado

**State Transitions**:
- Created → Active (após criação)
- Active → Inactive (quando desativado)
- Inactive → Active (quando reativado)
- Active → Deleted (quando excluído)

### 6. Avatar
**Purpose**: Imagem representativa de projeto ou workspace

**Fields**:
- `id`: string (required, unique) - ID do avatar
- `data`: string (required) - Dados da imagem (base64)
- `contentType`: string (required) - Tipo MIME da imagem
- `size`: number (required) - Tamanho em bytes
- `width`: number (optional) - Largura em pixels
- `height`: number (optional) - Altura em pixels
- `uploadedDate`: string (ISO 8601) - Data do upload

**Validation Rules**:
- `data`: base64 válido
- `contentType`: image/jpeg, image/png, image/gif
- `size`: máximo 2MB
- `width`: máximo 1024px
- `height`: máximo 1024px

**State Transitions**:
- Uploaded → Active (após upload)
- Active → Replaced (quando substituído)
- Active → Deleted (quando excluído)

## Relationships

### Project/Workspace ↔ Repository
- **Type**: One-to-Many
- **Constraint**: Repository deve pertencer a um Project (Data Center) ou Workspace (Cloud)
- **Cascade**: Delete Project/Workspace → Delete all Repositories

### Project/Workspace ↔ Permission
- **Type**: One-to-Many
- **Constraint**: Permission pode ser aplicada a Project/Workspace ou Repository
- **Cascade**: Delete Project/Workspace → Delete all Permissions

### Repository ↔ Webhook
- **Type**: One-to-Many
- **Constraint**: Webhook deve estar associado a um Repository
- **Cascade**: Delete Repository → Delete all Webhooks

### Project/Workspace ↔ Avatar
- **Type**: One-to-One
- **Constraint**: Project/Workspace pode ter no máximo um Avatar
- **Cascade**: Delete Project/Workspace → Delete Avatar

## Data Validation Schemas

### Project Schema (Zod)
```typescript
const ProjectSchema = z.object({
  key: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  isPublic: z.boolean().default(false),
  links: z.object({
    self: z.array(z.object({ href: z.string().url() }))
  }),
  createdDate: z.string().datetime(),
  updatedDate: z.string().datetime()
});
```

### Repository Schema (Zod)
```typescript
const RepositorySchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  scmId: z.literal("git"),
  forkable: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  project: z.object({
    key: z.string()
  }).optional(),
  workspace: z.object({
    uuid: z.string(),
    name: z.string(),
    slug: z.string()
  }).optional(),
  links: z.object({
    self: z.array(z.object({ href: z.string().url() })),
    clone: z.array(z.object({ 
      href: z.string().url(),
      name: z.string()
    }))
  }),
  createdDate: z.string().datetime(),
  updatedDate: z.string().datetime()
});
```

### Permission Schema (Zod)
```typescript
const PermissionSchema = z.object({
  user: z.string().optional(),
  group: z.string().optional(),
  permission: z.enum([
    "PROJECT_READ", "PROJECT_WRITE", "PROJECT_ADMIN",
    "REPO_READ", "REPO_WRITE", "REPO_ADMIN"
  ]),
  grantedBy: z.string(),
  grantedDate: z.string().datetime()
}).refine(data => data.user || data.group, {
  message: "Either user or group must be provided"
});
```

### Webhook Schema (Zod)
```typescript
const WebhookSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  events: z.array(z.enum([
    "repo:push", "pullrequest:created", "pullrequest:updated",
    "pullrequest:approved", "pullrequest:merged", "pullrequest:declined"
  ])).min(1),
  active: z.boolean().default(true),
  createdDate: z.string().datetime(),
  updatedDate: z.string().datetime()
});
```

## Business Rules

### Project/Workspace Rules
1. **Unique Key/Slug**: Chave do projeto e slug do workspace devem ser únicos
2. **Name Validation**: Nome não pode ser vazio ou apenas espaços
3. **Public Visibility**: Projetos/Workspaces públicos são visíveis para todos os usuários
4. **Deletion Constraint**: Não é possível excluir projeto/workspace com repositórios ativos

### Repository Rules
1. **Unique Slug**: Slug deve ser único dentro do projeto/workspace
2. **SCM Type**: Apenas Git é suportado
3. **Fork Policy**: Repositórios podem permitir ou não forks
4. **Deletion Constraint**: Não é possível excluir repositório com branches ativas

### Permission Rules
1. **User or Group**: Permissão deve ser concedida a usuário ou grupo (não ambos)
2. **Permission Levels**: Hierarquia de permissões (READ < WRITE < ADMIN)
3. **Inheritance**: Permissões de projeto são herdadas por repositórios
4. **Revocation**: Permissões podem ser revogadas a qualquer momento

### Webhook Rules
1. **URL Accessibility**: URL deve ser acessível e válida
2. **Event Validation**: Apenas eventos suportados podem ser monitorados
3. **Active Status**: Webhooks inativos não enviam notificações
4. **Retry Policy**: Falhas de entrega devem seguir política de retry

### Avatar Rules
1. **File Size**: Máximo 2MB por avatar
2. **Image Format**: Apenas JPEG, PNG e GIF suportados
3. **Dimensions**: Máximo 1024x1024 pixels
4. **Replacement**: Upload de novo avatar substitui o anterior

## Error Handling

### Validation Errors
- **Field Required**: Campo obrigatório não fornecido
- **Invalid Format**: Formato inválido (ex: URL, email, data)
- **Length Exceeded**: Tamanho excede limite permitido
- **Invalid Value**: Valor não está na lista de valores permitidos

### Business Logic Errors
- **Duplicate Key**: Chave/slug já existe
- **Permission Denied**: Usuário não tem permissão para operação
- **Dependency Exists**: Recurso tem dependências que impedem exclusão
- **Resource Not Found**: Recurso solicitado não existe

### System Errors
- **API Unavailable**: API do Bitbucket não está disponível
- **Authentication Failed**: Falha na autenticação
- **Rate Limit Exceeded**: Limite de requisições excedido
- **Network Error**: Erro de conectividade

---

*Data model completed: 2025-01-27*  
*All entities defined with validation rules and relationships*  
*Ready for contract generation*
