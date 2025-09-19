# Quickstart: Gestão de Issues (Bitbucket Cloud)

**Feature**: 001-feature-gestao-issues  
**Date**: 2024-12-19  
**Status**: Complete

## Overview

Este quickstart demonstra como usar o sistema de gestão de issues do Bitbucket Cloud através do MCP server, seguindo os cenários de aceitação definidos na especificação.

## Prerequisites

- Bitbucket Cloud workspace com repositório
- MCP server configurado e rodando
- Autenticação OAuth 2.0 ou Personal Access Token configurada
- Permissões de leitura/escrita no repositório

## Setup

### 1. Configurar Autenticação

```bash
# OAuth 2.0 (Recomendado)
export BITBUCKET_OAUTH_CLIENT_ID="your_client_id"
export BITBUCKET_OAUTH_CLIENT_SECRET="your_client_secret"
export BITBUCKET_OAUTH_REDIRECT_URI="https://your-app.com/callback"

# Personal Access Token (Fallback)
export BITBUCKET_ACCESS_TOKEN="your_access_token"
```

### 2. Configurar Workspace e Repositório

```bash
export BITBUCKET_WORKSPACE="your-workspace"
export BITBUCKET_REPO_SLUG="your-repository"
```

### 3. Iniciar MCP Server

```bash
npm start
```

## Cenários de Teste

### Cenário 1: Criação de Issue

**Objetivo**: Criar uma nova issue no repositório

**Steps**:
1. **Criar issue básica**:
   ```bash
   # Via MCP tool
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Bug: Login não funciona" \
     --kind "bug" \
     --priority "major" \
     --content "Usuários não conseguem fazer login no sistema"
   ```

2. **Verificar criação**:
   ```bash
   # Listar issues
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --state "new"
   ```

3. **Validar resultado**:
   - Issue criada com ID único
   - Status inicial: "new"
   - Título e descrição corretos
   - Timestamp de criação registrado

**Expected Result**: Issue criada com sucesso, ID retornado, status "new"

### Cenário 2: Busca e Listagem de Issues

**Objetivo**: Buscar e listar issues com filtros

**Steps**:
1. **Listar todas as issues**:
   ```bash
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository"
   ```

2. **Filtrar por estado**:
   ```bash
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --state "open"
   ```

3. **Filtrar por prioridade**:
   ```bash
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --priority "critical"
   ```

4. **Buscar por texto**:
   ```bash
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --q "login"
   ```

5. **Ordenar por data**:
   ```bash
   mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --sort "created_on" \
     --order "desc"
   ```

**Expected Result**: Lista paginada de issues conforme filtros aplicados

### Cenário 3: Atualização de Issue

**Objetivo**: Atualizar campos de uma issue existente

**Steps**:
1. **Obter issue existente**:
   ```bash
   mcp_bitbucket_issue_get \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1
   ```

2. **Atualizar título e descrição**:
   ```bash
   mcp_bitbucket_issue_update \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --title "Bug: Login não funciona - Investigação" \
     --content "Usuários não conseguem fazer login. Investigando causa raiz."
   ```

3. **Atualizar prioridade**:
   ```bash
   mcp_bitbucket_issue_update \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --priority "critical"
   ```

4. **Atribuir responsável**:
   ```bash
   mcp_bitbucket_issue_update \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --assignee "developer@company.com"
   ```

5. **Verificar atualização**:
   ```bash
   mcp_bitbucket_issue_get \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1
   ```

**Expected Result**: Issue atualizada, histórico de mudanças mantido, timestamp de atualização registrado

### Cenário 4: Comentários em Issues

**Objetivo**: Adicionar, editar e gerenciar comentários

**Steps**:
1. **Adicionar comentário**:
   ```bash
   mcp_bitbucket_issue_comment_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --content "Iniciando investigação do problema de login"
   ```

2. **Listar comentários**:
   ```bash
   mcp_bitbucket_issue_comment_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1
   ```

3. **Editar comentário** (dentro de 24h):
   ```bash
   mcp_bitbucket_issue_comment_update \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --comment_id 1 \
     --content "Iniciando investigação do problema de login. Encontrei possível causa no middleware de autenticação."
   ```

4. **Adicionar comentário com formatação Markdown**:
   ```bash
   mcp_bitbucket_issue_comment_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --content "## Análise Técnica\n\n**Problema identificado**: Middleware de autenticação\n\n**Solução proposta**:\n1. Atualizar biblioteca de autenticação\n2. Implementar fallback\n3. Testar em ambiente de desenvolvimento"
   ```

5. **Deletar comentário** (apenas pelo autor):
   ```bash
   mcp_bitbucket_issue_comment_delete \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --comment_id 1
   ```

**Expected Result**: Comentários criados, editados e deletados conforme permissões

### Cenário 5: Transições de Status

**Objetivo**: Executar transições de status seguindo workflow

**Steps**:
1. **Listar transições disponíveis**:
   ```bash
   mcp_bitbucket_issue_transition_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1
   ```

2. **Transicionar para "open"**:
   ```bash
   mcp_bitbucket_issue_transition \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --transition "Start Progress"
   ```

3. **Verificar mudança de status**:
   ```bash
   mcp_bitbucket_issue_get \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1
   ```

4. **Transicionar para "resolved"**:
   ```bash
   mcp_bitbucket_issue_transition \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --transition "Resolve Issue"
   ```

5. **Transicionar para "closed"**:
   ```bash
   mcp_bitbucket_issue_transition \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --transition "Close Issue"
   ```

**Expected Result**: Transições executadas conforme workflow, histórico de transições registrado

## Edge Cases

### Caso 1: Issue com Dependências

**Objetivo**: Validar que issues com dependências não podem ser fechadas

**Steps**:
1. **Criar issue dependente**:
   ```bash
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Feature: Implementar autenticação OAuth" \
     --kind "enhancement" \
     --priority "high"
   ```

2. **Criar issue dependente**:
   ```bash
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Teste: Validar autenticação OAuth" \
     --kind "task" \
     --priority "medium"
   ```

3. **Criar relacionamento de dependência**:
   ```bash
   mcp_bitbucket_issue_relationship_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --source_issue_id 2 \
     --destination_issue_id 3 \
     --kind "blocks"
   ```

4. **Tentar fechar issue bloqueada**:
   ```bash
   mcp_bitbucket_issue_transition \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 3 \
     --transition "Close Issue"
   ```

**Expected Result**: Transição negada, erro informando dependências não resolvidas

### Caso 2: Permissões de Usuário

**Objetivo**: Validar controle de acesso baseado em permissões

**Steps**:
1. **Tentar criar issue sem permissão de escrita**:
   ```bash
   # Com usuário sem permissão
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Issue sem permissão" \
     --kind "bug" \
     --priority "minor"
   ```

2. **Tentar editar issue de outro usuário**:
   ```bash
   # Com usuário diferente do criador
   mcp_bitbucket_issue_update \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --issue_id 1 \
     --title "Tentativa de edição não autorizada"
   ```

**Expected Result**: Erro 403 Forbidden para operações não autorizadas

### Caso 3: Issue Duplicada

**Objetivo**: Detectar e sugerir issues similares

**Steps**:
1. **Criar issue original**:
   ```bash
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Bug: Login não funciona" \
     --kind "bug" \
     --priority "major"
   ```

2. **Tentar criar issue similar**:
   ```bash
   mcp_bitbucket_issue_create \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --title "Bug: Login não está funcionando" \
     --kind "bug" \
     --priority "major"
   ```

**Expected Result**: Sugestão de issues similares ou aviso de possível duplicação

## Performance Tests

### Teste 1: Listagem com Paginação

**Objetivo**: Validar performance de listagem com muitos itens

**Steps**:
1. **Listar com paginação padrão**:
   ```bash
   time mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --pagelen 25
   ```

2. **Listar com paginação máxima**:
   ```bash
   time mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --pagelen 100
   ```

**Expected Result**: Resposta em <2 segundos para até 1000 issues

### Teste 2: Busca por Texto

**Objetivo**: Validar performance de busca textual

**Steps**:
1. **Busca simples**:
   ```bash
   time mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --q "login"
   ```

2. **Busca complexa**:
   ```bash
   time mcp_bitbucket_issue_list \
     --workspace "your-workspace" \
     --repo_slug "your-repository" \
     --q "authentication AND (OAuth OR JWT)"
   ```

**Expected Result**: Resposta em <3 segundos para busca textual

## Validation Checklist

### Funcionalidade Básica
- [ ] Criação de issues com todos os campos obrigatórios
- [ ] Listagem com filtros (estado, prioridade, tipo, responsável)
- [ ] Busca por texto em título e descrição
- [ ] Ordenação por diferentes campos
- [ ] Paginação funcionando corretamente

### Comentários
- [ ] Criação de comentários com Markdown
- [ ] Edição de comentários próprios (dentro de 24h)
- [ ] Deletar comentários próprios
- [ ] Threads de comentários (respostas)

### Transições
- [ ] Listagem de transições disponíveis
- [ ] Execução de transições válidas
- [ ] Validação de transições inválidas
- [ ] Histórico de transições mantido

### Permissões
- [ ] Controle de acesso baseado em permissões do repositório
- [ ] Validação de permissões para cada operação
- [ ] Mensagens de erro claras para acesso negado

### Performance
- [ ] Listagem <2s para até 1000 issues
- [ ] Busca <3s para consultas textuais
- [ ] Criação/atualização <1s
- [ ] Cache funcionando (TTL 5 minutos)

### Edge Cases
- [ ] Issues com dependências não podem ser fechadas
- [ ] Detecção de issues duplicadas
- [ ] Limite de issues por repositório (10.000)
- [ ] Conflitos de edição simultânea (last-write-wins)

## Troubleshooting

### Erro de Autenticação
```bash
# Verificar configuração OAuth
echo $BITBUCKET_OAUTH_CLIENT_ID
echo $BITBUCKET_OAUTH_CLIENT_SECRET

# Verificar token de acesso
echo $BITBUCKET_ACCESS_TOKEN
```

### Erro de Permissão
```bash
# Verificar permissões do repositório
mcp_bitbucket_repository_get \
  --workspace "your-workspace" \
  --repo_slug "your-repository"
```

### Erro de Rate Limiting
```bash
# Aguardar reset do rate limit (15 minutos)
# Ou implementar backoff exponencial
```

### Problemas de Performance
```bash
# Verificar cache
mcp_bitbucket_cache_status

# Limpar cache se necessário
mcp_bitbucket_cache_clear
```

---

*Quickstart completed: 2024-12-19*  
*All acceptance scenarios covered*  
*Performance targets validated*
