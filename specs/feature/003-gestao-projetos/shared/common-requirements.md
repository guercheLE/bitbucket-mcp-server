# Requisitos Compartilhados: Gestão de Projetos e Repositórios

## Visão Geral
Este documento define os requisitos comuns e padrões que se aplicam tanto ao Bitbucket Data Center quanto ao Cloud para a funcionalidade de gestão de projetos e repositórios.

## Padrões de Implementação

### Arquitetura MCP
- **Artigo I**: Conformidade total com protocolo MCP
- **Artigo II**: Suporte a múltiplos transportes (stdio, HTTP, WebSocket)
- **Artigo III**: Detecção automática de tipo de servidor
- **Artigo IV**: Cobertura completa da API
- **Artigo V**: Desenvolvimento test-first obrigatório
- **Artigo VI**: Versionamento semântico e controle de breaking changes
- **Artigo VII**: Princípios YAGNI e simplicidade

### Estrutura de Serviços
- **ProjectService**: Gerenciamento de projetos (Data Center) / Workspaces (Cloud)
- **RepositoryService**: Gerenciamento de repositórios
- **PermissionService**: Gerenciamento de permissões
- **HookService**: Gerenciamento de hooks
- **ConfigurationService**: Gerenciamento de configurações

### Registro de Ferramentas
- Carregamento seletivo baseado no tipo de servidor detectado
- Registro dinâmico de ferramentas MCP
- Validação de disponibilidade de endpoints
- Fallback para funcionalidades não suportadas

## Padrões de Autenticação

### Data Center
- Autenticação via App Password
- Autenticação via OAuth 2.0
- Autenticação via Session
- Suporte a Basic Auth

### Cloud
- Autenticação via OAuth 2.0
- Autenticação via App Password
- Suporte a 2FA
- Integração com Atlassian Account

## Padrões de Validação

### Validação de Entrada
- Sanitização de todos os inputs
- Validação de tipos de dados
- Validação de formatos (emails, URLs, slugs)
- Prevenção de injeção de código

### Validação de Permissões
- Verificação de autenticação
- Validação de autorização
- Verificação de permissões específicas
- Logs de auditoria

### Validação de Dados
- Validação de schemas JSON
- Verificação de integridade
- Validação de relacionamentos
- Tratamento de erros

## Padrões de Resposta

### Estrutura Padrão
```json
{
  "success": boolean,
  "data": object | array,
  "error": {
    "code": string,
    "message": string,
    "details": object
  },
  "metadata": {
    "timestamp": string,
    "requestId": string,
    "version": string
  }
}
```

### Códigos de Status
- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro de validação
- **401**: Não autenticado
- **403**: Não autorizado
- **404**: Recurso não encontrado
- **409**: Conflito (recurso já existe)
- **500**: Erro interno do servidor

## Padrões de Logging

### Níveis de Log
- **DEBUG**: Informações detalhadas para debugging
- **INFO**: Informações gerais de operação
- **WARN**: Avisos sobre situações anômalas
- **ERROR**: Erros que não impedem a operação
- **FATAL**: Erros críticos que impedem a operação

### Estrutura de Logs
```json
{
  "timestamp": "2025-01-27T19:02:00Z",
  "level": "INFO",
  "service": "ProjectService",
  "operation": "createProject",
  "userId": "user123",
  "projectKey": "PROJ",
  "message": "Project created successfully",
  "duration": 150,
  "requestId": "req-123"
}
```

## Padrões de Cache

### Estratégia de Cache
- Cache de metadados de projetos/repositórios
- Cache de permissões de usuários
- Cache de configurações
- Invalidação automática em mudanças

### TTL (Time To Live)
- Metadados: 5 minutos
- Permissões: 1 minuto
- Configurações: 10 minutos
- Listas: 2 minutos

## Padrões de Tratamento de Erros

### Categorização de Erros
- **ValidationError**: Erros de validação de entrada
- **AuthenticationError**: Erros de autenticação
- **AuthorizationError**: Erros de autorização
- **NotFoundError**: Recursos não encontrados
- **ConflictError**: Conflitos de recursos
- **RateLimitError**: Limites de taxa excedidos
- **ServerError**: Erros internos do servidor

### Tratamento de Exceções
- Captura e log de todas as exceções
- Retorno de mensagens de erro apropriadas
- Não exposição de detalhes internos
- Rollback de transações em caso de erro

## Padrões de Testes

### Estrutura de Testes
- **Unit Tests**: Testes de unidades individuais
- **Integration Tests**: Testes de integração com API
- **Contract Tests**: Testes de contrato de API
- **Performance Tests**: Testes de performance
- **Security Tests**: Testes de segurança

### Cobertura Mínima
- 90% de cobertura de código
- 100% de cobertura de branches críticos
- Testes para todos os endpoints
- Testes para todos os cenários de erro

### Dados de Teste
- Dados mockados para testes unitários
- Dados reais para testes de integração
- Ambientes de teste isolados
- Limpeza automática de dados de teste

## Padrões de Documentação

### Documentação de API
- Documentação OpenAPI/Swagger
- Exemplos de requisições e respostas
- Códigos de erro documentados
- Guias de integração

### Documentação de Código
- Comentários JSDoc para todas as funções
- README para cada serviço
- Guias de desenvolvimento
- Documentação de arquitetura

## Padrões de Monitoramento

### Métricas de Aplicação
- Tempo de resposta das operações
- Taxa de sucesso/erro
- Uso de recursos (CPU, memória)
- Número de requisições por minuto

### Alertas
- Alertas para erros críticos
- Alertas para performance degradada
- Alertas para uso excessivo de recursos
- Alertas para falhas de autenticação

## Padrões de Segurança

### Controle de Acesso
- Princípio do menor privilégio
- Validação de permissões em cada operação
- Logs de auditoria para ações sensíveis
- Rotação de credenciais

### Proteção de Dados
- Criptografia em trânsito (TLS)
- Criptografia em repouso
- Sanitização de dados sensíveis
- Prevenção de vazamento de informações

### Validação de Entrada
- Validação rigorosa de todos os inputs
- Prevenção de injeção de código
- Sanitização de dados de usuário
- Validação de tamanhos e formatos

## Padrões de Performance

### Otimizações
- Paginação para listas grandes
- Cache de consultas frequentes
- Compressão de respostas
- Lazy loading de dados

### Limites
- Rate limiting por usuário
- Timeout para operações longas
- Limites de tamanho de payload
- Controle de concorrência

## Padrões de Manutenibilidade

### Código Limpo
- Princípios SOLID
- Padrões de design consistentes
- Nomenclatura clara e descritiva
- Comentários explicativos

### Refatoração
- Refatoração contínua
- Remoção de código morto
- Simplificação de lógica complexa
- Melhoria de performance

### Versionamento
- Versionamento semântico
- Changelog detalhado
- Compatibilidade retroativa
- Deprecação gradual de APIs
