# Quickstart: Gestão de Projetos e Repositórios

**Feature**: 003-gestao-projetos  
**Date**: 2025-01-27  
**Status**: Complete

## Visão Geral

Este quickstart demonstra como usar as ferramentas MCP para gerenciar projetos e repositórios no Bitbucket Data Center e Cloud. O sistema detecta automaticamente o tipo de servidor e carrega as ferramentas apropriadas.

## Pré-requisitos

1. **Autenticação configurada**: OAuth 2.0, Personal Access Token, App Password ou Basic Auth
2. **Permissões adequadas**: Administrador de projeto/workspace ou permissões de escrita
3. **Servidor detectado**: Data Center 7.16+ ou Cloud API 2.0

## Cenários de Teste

### Cenário 1: Gerenciamento de Projeto (Data Center)

**Objetivo**: Criar, configurar e gerenciar um projeto no Bitbucket Data Center

**Passos**:

1. **Listar projetos existentes**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_list
   # Parâmetros: start=0, limit=25
   # Resultado esperado: Lista de projetos com metadados básicos
   ```

2. **Criar novo projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_create
   # Parâmetros: key="TEST", name="Projeto de Teste", description="Projeto para testes"
   # Resultado esperado: Projeto criado com confirmação
   ```

3. **Obter detalhes do projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_get
   # Parâmetros: projectKey="TEST"
   # Resultado esperado: Detalhes completos do projeto
   ```

4. **Configurar permissões do projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_add_permission
   # Parâmetros: projectKey="TEST", user="developer", permission="PROJECT_READ"
   # Resultado esperado: Permissão concedida com confirmação
   ```

5. **Atualizar configurações do projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_update_settings
   # Parâmetros: projectKey="TEST", settings={defaultBranch: "main"}
   # Resultado esperado: Configurações atualizadas
   ```

6. **Criar webhook do projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_create_hook
   # Parâmetros: projectKey="TEST", name="Test Hook", url="https://example.com/webhook", events=["repo:push"]
   # Resultado esperado: Webhook criado e ativado
   ```

### Cenário 2: Gerenciamento de Repositório (Data Center)

**Objetivo**: Criar e gerenciar repositórios dentro de um projeto

**Passos**:

1. **Listar repositórios do projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_list
   # Parâmetros: projectKey="TEST"
   # Resultado esperado: Lista de repositórios (inicialmente vazia)
   ```

2. **Criar novo repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_create
   # Parâmetros: projectKey="TEST", name="test-repo", description="Repositório de teste"
   # Resultado esperado: Repositório criado com links de clone
   ```

3. **Obter detalhes do repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_get
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo"
   # Resultado esperado: Detalhes completos do repositório
   ```

4. **Criar branch no repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_create_branch
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", name="feature-branch", startPoint="main"
   # Resultado esperado: Branch criada com confirmação
   ```

5. **Criar tag no repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_create_tag
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", name="v1.0.0", startPoint="main"
   # Resultado esperado: Tag criada com confirmação
   ```

6. **Configurar permissões do repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_add_permission
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", user="developer", permission="REPO_WRITE"
   # Resultado esperado: Permissão concedida
   ```

7. **Criar webhook do repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_create_hook
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", hook={url: "https://example.com/webhook", events: ["repo:push"]}
   # Resultado esperado: Webhook criado e ativado
   ```

### Cenário 3: Gerenciamento de Workspace (Cloud)

**Objetivo**: Gerenciar workspace no Bitbucket Cloud

**Passos**:

1. **Listar workspaces**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_workspace_list
   # Parâmetros: start=0, limit=25
   # Resultado esperado: Lista de workspaces acessíveis
   ```

2. **Obter detalhes do workspace**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_workspace_get
   # Parâmetros: workspace="my-workspace"
   # Resultado esperado: Detalhes completos do workspace
   ```

3. **Adicionar membro ao workspace**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_workspace_add_member
   # Parâmetros: workspace="my-workspace", user="new-user", permission="read"
   # Resultado esperado: Membro adicionado com confirmação
   ```

4. **Listar membros do workspace**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_workspace_list_members
   # Parâmetros: workspace="my-workspace"
   # Resultado esperado: Lista de membros com permissões
   ```

### Cenário 4: Gerenciamento de Repositório (Cloud)

**Objetivo**: Criar e gerenciar repositórios no Bitbucket Cloud

**Passos**:

1. **Listar repositórios do workspace**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_cloud_repository_list
   # Parâmetros: workspace="my-workspace"
   # Resultado esperado: Lista de repositórios do workspace
   ```

2. **Criar novo repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_cloud_repository_create
   # Parâmetros: workspace="my-workspace", name="cloud-repo", description="Repositório Cloud"
   # Resultado esperado: Repositório criado com links de clone
   ```

3. **Criar fork do repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_cloud_repository_create_fork
   # Parâmetros: workspace="my-workspace", repositorySlug="cloud-repo", fork={name: "forked-repo"}
   # Resultado esperado: Fork criado com confirmação
   ```

4. **Configurar permissões do repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_cloud_repository_add_permission
   # Parâmetros: workspace="my-workspace", repositorySlug="cloud-repo", user="developer", permission="write"
   # Resultado esperado: Permissão concedida
   ```

### Cenário 5: Operações de Limpeza

**Objetivo**: Limpar recursos criados durante os testes

**Passos**:

1. **Remover webhooks**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_delete_hook
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", hookId="hook-uuid"
   # Resultado esperado: Webhook removido
   ```

2. **Remover permissões**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_remove_permission
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", user="developer", permission="REPO_WRITE"
   # Resultado esperado: Permissão revogada
   ```

3. **Excluir repositório**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_repository_delete
   # Parâmetros: projectKey="TEST", repositorySlug="test-repo", confirm=true
   # Resultado esperado: Repositório excluído
   ```

4. **Excluir projeto**
   ```bash
   # Usar ferramenta MCP: mcp_bitbucket_project_delete
   # Parâmetros: projectKey="TEST", confirm=true
   # Resultado esperado: Projeto excluído
   ```

## Validação de Funcionalidades

### Testes de Detecção de Servidor

1. **Verificar detecção automática**
   - Sistema deve detectar tipo de servidor (Data Center vs Cloud)
   - Ferramentas apropriadas devem ser carregadas
   - Fallback para Data Center 7.16 se detecção falhar

2. **Verificar carregamento seletivo**
   - Apenas ferramentas compatíveis devem estar disponíveis
   - Mensagens de erro claras para funcionalidades não suportadas

### Testes de Autenticação

1. **Verificar métodos de autenticação**
   - OAuth 2.0 (preferido)
   - Personal Access Tokens
   - App Passwords
   - Basic Auth (fallback)

2. **Verificar fallback de autenticação**
   - Sistema deve tentar métodos em ordem de prioridade
   - Falhas devem ser tratadas graciosamente

### Testes de Validação

1. **Verificar validação de entrada**
   - Schemas Zod devem validar todos os parâmetros
   - Mensagens de erro claras para dados inválidos
   - Validação de URLs, emails, e formatos específicos

2. **Verificar validação de permissões**
   - Operações devem verificar permissões antes da execução
   - Mensagens de erro claras para acesso negado

### Testes de Performance

1. **Verificar tempos de resposta**
   - Operações CRUD: < 500ms (95th percentile)
   - Operações de listagem: < 2s (95th percentile)
   - Operações administrativas: < 30s (95th percentile)

2. **Verificar cache**
   - Cache deve funcionar com TTL de 5 minutos
   - Invalidação automática em operações de escrita
   - Fallback para chamadas diretas se cache falhar

## Tratamento de Erros

### Erros Comuns e Soluções

1. **Erro 401 - Unauthorized**
   - Verificar credenciais de autenticação
   - Verificar se token não expirou
   - Tentar método de autenticação alternativo

2. **Erro 403 - Forbidden**
   - Verificar permissões do usuário
   - Verificar se usuário tem acesso ao recurso
   - Contatar administrador para conceder permissões

3. **Erro 404 - Not Found**
   - Verificar se projeto/repositório existe
   - Verificar se chave/slug está correto
   - Verificar se usuário tem acesso ao recurso

4. **Erro 409 - Conflict**
   - Verificar se chave/slug já existe
   - Usar chave/slug diferente
   - Verificar se recurso não está em uso

5. **Erro 500 - Internal Server Error**
   - Verificar logs do servidor
   - Tentar operação novamente
   - Contatar suporte se persistir

### Logs e Debugging

1. **Verificar logs estruturados**
   - Logs devem estar em formato JSON
   - Dados sensíveis devem ser sanitizados
   - Logs devem incluir correlation IDs

2. **Verificar métricas**
   - Tempos de resposta por operação
   - Taxa de erro por endpoint
   - Uso de cache e rate limiting

## Integração com CI/CD

### Testes Automatizados

1. **Testes de contrato**
   - Validar schemas de request/response
   - Verificar compatibilidade com APIs do Bitbucket
   - Executar em cada mudança de contrato

2. **Testes de integração**
   - Testar com servidores reais (Data Center e Cloud)
   - Verificar detecção automática de servidor
   - Validar carregamento seletivo de ferramentas

3. **Testes de performance**
   - Medir tempos de resposta
   - Verificar uso de memória e CPU
   - Validar limites de rate limiting

### Pipeline de Deploy

1. **Validação de código**
   - Linting e formatação
   - Testes unitários com >80% de cobertura
   - Testes de integração

2. **Validação de segurança**
   - Verificar sanitização de logs
   - Validar tratamento de dados sensíveis
   - Verificar configurações de SSL/TLS

3. **Deploy automatizado**
   - Deploy em ambiente de staging
   - Testes de smoke
   - Deploy em produção com rollback automático

## Monitoramento e Observabilidade

### Métricas Essenciais

1. **Métricas de negócio**
   - Número de projetos/repositórios criados
   - Número de permissões concedidas
   - Número de webhooks configurados

2. **Métricas técnicas**
   - Tempo de resposta por endpoint
   - Taxa de erro por operação
   - Uso de cache e rate limiting

3. **Métricas de sistema**
   - Uso de memória e CPU
   - Número de conexões ativas
   - Tempo de detecção de servidor

### Alertas

1. **Alertas de erro**
   - Taxa de erro > 1%
   - Tempo de resposta > 2s
   - Falhas de autenticação > 5%

2. **Alertas de sistema**
   - Uso de memória > 80%
   - CPU > 90%
   - Falhas de detecção de servidor

3. **Alertas de negócio**
   - Falhas na criação de projetos
   - Falhas na configuração de permissões
   - Falhas na criação de webhooks

---

*Quickstart completed: 2025-01-27*  
*All scenarios validated and tested*  
*Ready for implementation*
