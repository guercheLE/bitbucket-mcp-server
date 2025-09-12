# API Reference

## Visão Geral

O Bitbucket MCP Server expõe uma API completa para interação com Bitbucket Cloud e Data Center através do protocolo MCP (Model Context Protocol). A API é carregada seletivamente baseada no tipo de servidor detectado.

## Autenticação

### Métodos de Autenticação Suportados

1. **Basic Authentication** (Username/Password)
2. **API Token** (Username/Token)
3. **OAuth** (Access Token)

### Configuração de Autenticação

```typescript
interface AuthConfig {
  type: 'basic' | 'api_token' | 'oauth' | 'none';
  credentials: {
    username?: string;
    password?: string;
    token?: string;
    accessToken?: string;
  };
}
```

## Ferramentas MCP

### Ferramentas Comuns (Cloud e Data Center)

#### 1. Authentication Tool

**Nome**: `authentication`

**Descrição**: Autentica com o Bitbucket usando credenciais fornecidas.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "Nome de usuário do Bitbucket"
    },
    "password": {
      "type": "string",
      "description": "Senha do Bitbucket"
    },
    "serverType": {
      "type": "string",
      "enum": ["cloud", "datacenter"],
      "description": "Tipo de servidor (opcional, auto-detecta se não especificado)"
    }
  },
  "required": ["username", "password"]
}
```

**Schema de Saída**:
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "data": {
      "type": "object",
      "properties": {
        "access_token": {
          "type": "string"
        },
        "token_type": {
          "type": "string"
        },
        "expires_in": {
          "type": "number"
        }
      }
    },
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      }
    }
  }
}
```

#### 2. Get Current User Tool

**Nome**: `get_current_user`

**Descrição**: Obtém informações do usuário autenticado.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    }
  },
  "required": ["accessToken"]
}
```

**Schema de Saída**:
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "display_name": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "created_on": {
          "type": "string"
        }
      }
    }
  }
}
```

#### 3. Repository Management Tool

**Nome**: `repository_management`

**Descrição**: Gerencia repositórios do Bitbucket.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["list", "get", "create", "update", "delete"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "repository": {
      "type": "string",
      "description": "Nome do repositório"
    },
    "workspace": {
      "type": "string",
      "description": "Workspace (Cloud) ou Project Key (Data Center)"
    },
    "project": {
      "type": "string",
      "description": "Chave do projeto (Data Center apenas)"
    },
    "data": {
      "type": "object",
      "description": "Dados para operações de criação/atualização"
    }
  },
  "required": ["operation", "accessToken"]
}
```

**Operações Suportadas**:

- **list**: Lista repositórios
- **get**: Obtém detalhes de um repositório
- **create**: Cria um novo repositório
- **update**: Atualiza um repositório existente
- **delete**: Remove um repositório

#### 4. Pull Request Workflow Tool

**Nome**: `pull_request_workflow`

**Descrição**: Gerencia pull requests e workflows relacionados.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["list", "get", "create", "update", "merge", "decline", "approve", "comment"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "repository": {
      "type": "string",
      "description": "Nome do repositório"
    },
    "workspace": {
      "type": "string",
      "description": "Workspace (Cloud) ou Project Key (Data Center)"
    },
    "project": {
      "type": "string",
      "description": "Chave do projeto (Data Center apenas)"
    },
    "pullRequestId": {
      "type": "number",
      "description": "ID do pull request"
    },
    "data": {
      "type": "object",
      "description": "Dados para operações de criação/atualização"
    }
  },
  "required": ["operation", "accessToken"]
}
```

### Ferramentas Específicas do Data Center

#### 1. Project Management Tool

**Nome**: `project_management`

**Descrição**: Gerencia projetos do Bitbucket Data Center.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["list", "get", "create", "update", "delete"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "projectKey": {
      "type": "string",
      "description": "Chave do projeto"
    },
    "data": {
      "type": "object",
      "description": "Dados do projeto"
    }
  },
  "required": ["operation", "accessToken"]
}
```

#### 2. Project Permissions Tool

**Nome**: `project_permissions`

**Descrição**: Gerencia permissões de projetos.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["list", "add", "remove", "update"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "projectKey": {
      "type": "string",
      "description": "Chave do projeto"
    },
    "user": {
      "type": "string",
      "description": "Nome do usuário"
    },
    "group": {
      "type": "string",
      "description": "Nome do grupo"
    },
    "permission": {
      "type": "string",
      "enum": ["PROJECT_READ", "PROJECT_WRITE", "PROJECT_ADMIN"],
      "description": "Nível de permissão"
    }
  },
  "required": ["operation", "accessToken", "projectKey"]
}
```

#### 3. Project Settings Tool

**Nome**: `project_settings`

**Descrição**: Gerencia configurações de projetos.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["get", "update"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "projectKey": {
      "type": "string",
      "description": "Chave do projeto"
    },
    "settings": {
      "type": "object",
      "description": "Configurações do projeto"
    }
  },
  "required": ["operation", "accessToken", "projectKey"]
}
```

#### 4. Project Hooks Tool

**Nome**: `project_hooks`

**Descrição**: Gerencia hooks de projetos.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["list", "get", "create", "update", "delete"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "projectKey": {
      "type": "string",
      "description": "Chave do projeto"
    },
    "hookId": {
      "type": "string",
      "description": "ID do hook"
    },
    "hook": {
      "type": "object",
      "description": "Dados do hook"
    }
  },
  "required": ["operation", "accessToken", "projectKey"]
}
```

#### 5. Project Avatar Tool

**Nome**: `project_avatar`

**Descrição**: Gerencia avatares de projetos.

**Schema de Entrada**:
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["get", "upload", "delete", "update"],
      "description": "Operação a ser executada"
    },
    "accessToken": {
      "type": "string",
      "description": "Token de acesso"
    },
    "projectKey": {
      "type": "string",
      "description": "Chave do projeto"
    },
    "avatarData": {
      "type": "string",
      "description": "Dados do avatar em base64"
    }
  },
  "required": ["operation", "accessToken", "projectKey"]
}
```

## Códigos de Erro

### Códigos de Erro Comuns

| Código | Descrição | Severidade |
|--------|-----------|------------|
| `AUTHENTICATION_ERROR` | Falha na autenticação | HIGH |
| `AUTHORIZATION_ERROR` | Acesso negado | HIGH |
| `RATE_LIMIT_ERROR` | Limite de taxa excedido | MEDIUM |
| `NETWORK_ERROR` | Erro de rede | MEDIUM |
| `TIMEOUT_ERROR` | Timeout da requisição | MEDIUM |
| `SERVER_ERROR` | Erro interno do servidor | HIGH |
| `VALIDATION_ERROR` | Erro de validação | MEDIUM |
| `NOT_FOUND_ERROR` | Recurso não encontrado | MEDIUM |
| `CONFLICT_ERROR` | Conflito de recursos | MEDIUM |
| `QUOTA_ERROR` | Cota excedida | HIGH |
| `MAINTENANCE_ERROR` | Servidor em manutenção | HIGH |
| `PROCESSING_ERROR` | Erro no processamento | HIGH |
| `UNKNOWN_ERROR` | Erro desconhecido | MEDIUM |

### Estrutura de Erro

```json
{
  "type": "string",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "message": "string",
  "originalMessage": "string",
  "retryable": "boolean",
  "statusCode": "number",
  "timestamp": "string",
  "context": {
    "additional": "data"
  }
}
```

## Rate Limiting

O servidor implementa rate limiting inteligente com as seguintes características:

- **Limite por minuto**: Configurável (padrão: 60 requisições)
- **Burst limit**: Limite de requisições em janela curta (padrão: 10 em 10 segundos)
- **Backoff exponencial**: Retry automático com delay crescente
- **Jitter**: Variação aleatória no delay para evitar thundering herd

## Paginação

Muitas operações suportam paginação:

```json
{
  "data": [...],
  "metadata": {
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## Metadados de Resposta

Todas as respostas incluem metadados:

```json
{
  "data": {...},
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "processingTime": 150,
    "source": "bitbucket-cloud | bitbucket-datacenter",
    "version": "2.0"
  },
  "errors": [],
  "warnings": []
}
```

## Exemplos de Uso

### Autenticação

```json
{
  "tool": "authentication",
  "arguments": {
    "username": "seu_usuario",
    "password": "sua_senha"
  }
}
```

### Listar Repositórios

```json
{
  "tool": "repository_management",
  "arguments": {
    "operation": "list",
    "accessToken": "seu_token"
  }
}
```

### Criar Pull Request

```json
{
  "tool": "pull_request_workflow",
  "arguments": {
    "operation": "create",
    "accessToken": "seu_token",
    "repository": "meu-repo",
    "workspace": "minha-workspace",
    "data": {
      "title": "Nova feature",
      "description": "Descrição da feature",
      "source": {
        "branch": {
          "name": "feature-branch"
        }
      },
      "destination": {
        "branch": {
          "name": "main"
        }
      }
    }
  }
}
```

### Gerenciar Projeto (Data Center)

```json
{
  "tool": "project_management",
  "arguments": {
    "operation": "create",
    "accessToken": "seu_token",
    "data": {
      "key": "PROJ",
      "name": "Meu Projeto",
      "description": "Descrição do projeto"
    }
  }
}
```

## Limitações

### Bitbucket Cloud
- Não suporta projetos (apenas workspaces)
- Limitações de rate limiting mais restritivas
- Algumas operações podem ter limitações de permissão

### Bitbucket Data Center
- Requer projeto para operações de repositório
- Suporte completo a projetos e permissões
- Rate limiting configurável pelo administrador

## Suporte e Recursos

- **Documentação**: [README.md](../README.md)
- **Exemplos**: [examples/](../examples/)
- **Testes**: [tests/](../tests/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
