# Especificação: Gerenciamento de Repositórios - Cloud

## Visão Geral
Esta especificação define o gerenciamento completo de repositórios no Bitbucket Cloud, incluindo operações CRUD, permissões, configurações, branches, tags e hooks.

## Endpoints Cobertos (20 endpoints)

### Operações CRUD de Repositórios
1. **POST** `/2.0/repositories/{workspace}/{repo_slug}` - Criar repositório
2. **GET** `/2.0/repositories/{workspace}` - Listar repositórios do workspace
3. **GET** `/2.0/repositories/{workspace}/{repo_slug}` - Obter repositório específico
4. **PUT** `/2.0/repositories/{workspace}/{repo_slug}` - Atualizar repositório
5. **DELETE** `/2.0/repositories/{workspace}/{repo_slug}` - Excluir repositório

### Gerenciamento de Permissões
6. **GET** `/2.0/repositories/{workspace}/{repo_slug}/permissions` - Listar permissões
7. **PUT** `/2.0/repositories/{workspace}/{repo_slug}/permissions/users` - Adicionar permissão de usuário
8. **PUT** `/2.0/repositories/{workspace}/{repo_slug}/permissions/teams` - Adicionar permissão de equipe
9. **DELETE** `/2.0/repositories/{workspace}/{repo_slug}/permissions/users` - Remover permissão de usuário
10. **DELETE** `/2.0/repositories/{workspace}/{repo_slug}/permissions/teams` - Remover permissão de equipe

### Gerenciamento de Branches
11. **GET** `/2.0/repositories/{workspace}/{repo_slug}/refs/branches` - Listar branches
12. **POST** `/2.0/repositories/{workspace}/{repo_slug}/refs/branches` - Criar branch

### Gerenciamento de Tags
13. **GET** `/2.0/repositories/{workspace}/{repo_slug}/refs/tags` - Listar tags
14. **POST** `/2.0/repositories/{workspace}/{repo_slug}/refs/tags` - Criar tag

### Configurações de Repositório
15. **GET** `/2.0/repositories/{workspace}/{repo_slug}/settings` - Obter configurações
16. **PUT** `/2.0/repositories/{workspace}/{repo_slug}/settings` - Atualizar configurações

### Gerenciamento de Hooks
17. **GET** `/2.0/repositories/{workspace}/{repo_slug}/hooks` - Listar hooks
18. **POST** `/2.0/repositories/{workspace}/{repo_slug}/hooks` - Criar hook
19. **PUT** `/2.0/repositories/{workspace}/{repo_slug}/hooks/{hookId}` - Atualizar hook
20. **DELETE** `/2.0/repositories/{workspace}/{repo_slug}/hooks/{hookId}` - Excluir hook

## Funcionalidades Principais

### Criação de Repositórios
- Nome único dentro do workspace
- Descrição opcional
- Configurações de visibilidade (privado/público)
- Inicialização com README opcional
- Configuração de branch padrão
- Fork de repositório existente

### Gerenciamento de Permissões
- Níveis: Read, Write, Admin
- Herança de permissões do workspace
- Override de permissões específicas
- Usuários individuais e equipes
- Controle de acesso granular

### Gerenciamento de Branches
- Listagem com informações de commits
- Criação de branches a partir de commits específicos
- Configuração de branch padrão
- Proteção de branches
- Merge automático

### Gerenciamento de Tags
- Criação de tags anotadas
- Associação com commits específicos
- Mensagens descritivas
- Versionamento semântico
- Releases automáticos

### Configurações de Repositório
- Branch padrão
- Estratégia de merge padrão
- Mensagem de commit padrão
- Configurações de fork
- Políticas de pull request

### Gerenciamento de Hooks
- Hooks de pré-receive
- Hooks de post-receive
- Hooks de merge-check
- Configuração de URLs de callback
- Validação de payloads

## Casos de Uso

### Desenvolvedor
1. Criar novo repositório para feature
2. Configurar branch de desenvolvimento
3. Criar tags para releases
4. Configurar hooks para CI/CD
5. Fazer fork de repositório existente

### Administrador de Repositório
1. Gerenciar permissões de acesso
2. Configurar proteções de branch
3. Monitorar atividade do repositório
4. Configurar integrações via hooks
5. Gerenciar forks e contribuições

### Gerente de Projeto
1. Padronizar configurações de repositórios
2. Definir políticas de branching
3. Configurar workflows de release
4. Monitorar saúde dos repositórios
5. Gerenciar equipes e permissões

## Validações e Regras de Negócio

### Criação de Repositório
- Nome deve ser único dentro do workspace
- Slug deve seguir padrão alfanumérico
- Workspace deve existir e ter permissões adequadas
- Usuário deve ter permissões de criação

### Permissões
- Usuários devem existir no workspace
- Equipes devem ser válidas
- Permissões de workspace são herdadas por padrão
- Apenas admins podem modificar permissões

### Branches e Tags
- Nomes devem seguir convenções Git
- Commits de referência devem existir
- Branches protegidas não podem ser excluídas
- Tags devem ser únicas

### Hooks
- URLs de callback devem ser válidas
- Eventos devem ser suportados
- Configurações devem ser válidas
- Payloads devem ser testáveis

## Integração com Outras Funcionalidades

### Workspaces
- Repositórios herdam permissões de workspaces
- Configurações de workspace aplicadas por padrão
- Contagem de repositórios em métricas de workspace

### Pull Requests
- Branches são base para pull requests
- Configurações de merge afetam PRs
- Hooks podem validar PRs
- Políticas de review aplicadas

### Issues
- Repositórios podem ter issues associadas
- Configurações afetam workflow de issues
- Hooks podem notificar sobre issues
- Integração com Jira

### Pipelines
- Hooks podem disparar pipelines
- Configurações de branch afetam execução
- Tags podem marcar releases
- Integração com Bitbucket Pipelines

## Métricas e Monitoramento

### Métricas de Repositório
- Número de commits
- Número de branches ativas
- Número de contribuidores
- Tamanho do repositório
- Número de forks

### Atividade
- Commits recentes
- Branches ativas
- Pull requests abertos
- Issues abertas
- Forks recentes

### Performance
- Tempo de clone
- Tempo de push
- Disponibilidade do repositório
- Performance de hooks

## Considerações de Segurança

### Controle de Acesso
- Autenticação OAuth obrigatória
- Autorização baseada em permissões
- Logs de auditoria para ações sensíveis
- 2FA quando configurado

### Proteção de Dados
- Validação de entradas
- Sanitização de dados
- Prevenção de injeção de código
- Criptografia em trânsito

### Branches Protegidas
- Configuração de regras de push
- Requisitos de review
- Verificações de status obrigatórias
- Políticas de merge

## Testes Obrigatórios (TDD)

### Testes Unitários
- Validação de dados de entrada
- Lógica de permissões
- Transformação de dados
- Validação de configurações

### Testes de Integração
- Comunicação com API do Bitbucket Cloud
- Persistência de dados
- Validação de respostas
- Teste de hooks

### Testes de Contrato
- Estrutura de requisições
- Estrutura de respostas
- Códigos de status HTTP
- Validação de schemas

### Testes de Performance
- Tempo de resposta das operações
- Carga de listagem de repositórios
- Performance de hooks
- Teste de concorrência

## Dependências

### Funcionalidades Anteriores
- Autenticação (002-autenticacao-bitbucket)
- Gerenciamento de workspaces
- Detecção de servidor

### Funcionalidades Futuras
- Pull Requests
- Issues
- Pipelines
- Webhooks avançados

## Limitações e Considerações

### Limites de API
- Rate limiting por workspace
- Tamanho máximo de repositório
- Número máximo de branches/tags
- Limites de hooks por repositório

### Performance
- Paginação para listas grandes
- Cache de metadados
- Otimização de consultas
- CDN para assets

### Backup e Recuperação
- Estratégias de backup
- Recuperação de dados
- Migração entre workspaces
- Sincronização com Data Center

## Diferenças do Data Center

### Modelo de Permissões
- Workspaces vs Projetos
- Equipes vs Grupos
- Permissões mais granulares
- Integração com Atlassian Cloud

### API e Endpoints
- Versão 2.0 da API
- Estrutura de URLs diferente
- Schemas de dados específicos
- Autenticação OAuth

### Funcionalidades Específicas
- Integração com Atlassian Cloud
- SSO e SAML
- Marketplace de apps
- Bitbucket Pipelines
- Integração com Jira
