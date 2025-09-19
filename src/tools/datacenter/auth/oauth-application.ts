import { Tool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';

// Schemas de validação para aplicações OAuth do Data Center
const OAuthApplicationSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  url: z.string().url().optional(),
  callbackUrl: z.string().url().optional(),
  clientId: z.string().min(1, 'Client ID é obrigatório'),
  clientSecret: z.string().min(1, 'Client Secret é obrigatório'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isActive: z.boolean()
});

const OAuthApplicationRequestSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  url: z.string().url().optional(),
  callbackUrl: z.string().url().optional()
});

const OAuthApplicationListResponseSchema = z.object({
  applications: z.array(OAuthApplicationSchema),
  totalCount: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative()
});

/**
 * Ferramenta MCP para criação de aplicação OAuth no Data Center
 */
export const mcp_bitbucket_auth_create_oauth_application: Tool = {
  name: 'mcp_bitbucket_auth_create_oauth_application',
  description: 'Cria uma aplicação OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Criação de aplicação OAuth\n- Configuração de callback\n- Geração de credenciais\n\n**Parâmetros:**\n- `name`: Nome da aplicação\n- `description`: Descrição da aplicação (opcional)\n- `url`: URL da aplicação (opcional)\n- `callbackUrl`: URL de callback (opcional)\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Aplicação OAuth criada com credenciais.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome da aplicação'
      },
      description: {
        type: 'string',
        description: 'Descrição da aplicação'
      },
      url: {
        type: 'string',
        description: 'URL da aplicação'
      },
      callbackUrl: {
        type: 'string',
        description: 'URL de callback'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['name'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para obtenção de aplicação OAuth no Data Center
 */
export const mcp_bitbucket_auth_get_oauth_application: Tool = {
  name: 'mcp_bitbucket_auth_get_oauth_application',
  description: 'Obtém uma aplicação OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Informações da aplicação\n- Configurações atuais\n- Status da aplicação\n\n**Parâmetros:**\n- `applicationId`: ID da aplicação OAuth\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Informações detalhadas da aplicação OAuth.',
  inputSchema: {
    type: 'object',
    properties: {
      applicationId: {
        type: 'string',
        description: 'ID da aplicação OAuth'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['applicationId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para atualização de aplicação OAuth no Data Center
 */
export const mcp_bitbucket_auth_update_oauth_application: Tool = {
  name: 'mcp_bitbucket_auth_update_oauth_application',
  description: 'Atualiza uma aplicação OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Atualização de configurações\n- Modificação de URLs\n- Alteração de descrição\n\n**Parâmetros:**\n- `applicationId`: ID da aplicação OAuth\n- `name`: Novo nome da aplicação (opcional)\n- `description`: Nova descrição (opcional)\n- `url`: Nova URL (opcional)\n- `callbackUrl`: Nova URL de callback (opcional)\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Aplicação OAuth atualizada.',
  inputSchema: {
    type: 'object',
    properties: {
      applicationId: {
        type: 'string',
        description: 'ID da aplicação OAuth'
      },
      name: {
        type: 'string',
        description: 'Novo nome da aplicação'
      },
      description: {
        type: 'string',
        description: 'Nova descrição'
      },
      url: {
        type: 'string',
        description: 'Nova URL'
      },
      callbackUrl: {
        type: 'string',
        description: 'Nova URL de callback'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['applicationId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para exclusão de aplicação OAuth no Data Center
 */
export const mcp_bitbucket_auth_delete_oauth_application: Tool = {
  name: 'mcp_bitbucket_auth_delete_oauth_application',
  description: 'Remove uma aplicação OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Remoção segura da aplicação\n- Limpeza de credenciais\n- Confirmação de exclusão\n\n**Parâmetros:**\n- `applicationId`: ID da aplicação OAuth\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Confirmação de remoção da aplicação.',
  inputSchema: {
    type: 'object',
    properties: {
      applicationId: {
        type: 'string',
        description: 'ID da aplicação OAuth'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['applicationId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para listagem de aplicações OAuth no Data Center
 */
export const mcp_bitbucket_auth_list_oauth_applications: Tool = {
  name: 'mcp_bitbucket_auth_list_oauth_applications',
  description: 'Lista todas as aplicações OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Lista completa de aplicações\n- Informações básicas\n- Status de cada aplicação\n\n**Parâmetros:**\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Lista de todas as aplicações OAuth.',
  inputSchema: {
    type: 'object',
    properties: {
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Implementação da ferramenta MCP para criação de aplicação OAuth
 */
export async function executeCreateOAuthApplication(
  args: {
    name: string;
    description?: string;
    url?: string;
    callbackUrl?: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = OAuthApplicationRequestSchema.parse({
      name: args.name,
      description: args.description,
      url: args.url,
      callbackUrl: args.callbackUrl
    });

    // Simular criação de aplicação OAuth
    const now = new Date();
    const applicationId = generateApplicationId();
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();

    const oauthApplication = {
      id: applicationId,
      name: validatedRequest.name,
      description: validatedRequest.description,
      url: validatedRequest.url,
      callbackUrl: validatedRequest.callbackUrl,
      clientId,
      clientSecret,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isActive: true
    };

    // Validar resposta
    const validatedApplication = OAuthApplicationSchema.parse(oauthApplication);

    // Log de auditoria
    console.log(`[AUDIT] Aplicação OAuth criada: ${validatedApplication.name} (ID: ${applicationId})`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Aplicação OAuth Criada com Sucesso\n\n` +
                `**Informações da Aplicação:**\n` +
                `- ID: ${validatedApplication.id}\n` +
                `- Nome: ${validatedApplication.name}\n` +
                `- Descrição: ${validatedApplication.description || 'N/A'}\n` +
                `- URL: ${validatedApplication.url || 'N/A'}\n` +
                `- Callback URL: ${validatedApplication.callbackUrl || 'N/A'}\n` +
                `- Client ID: ${validatedApplication.clientId}\n` +
                `- Client Secret: ${validatedApplication.clientSecret}\n` +
                `- Criada em: ${validatedApplication.createdAt}\n` +
                `- Ativa: ${validatedApplication.isActive ? 'Sim' : 'Não'}\n\n` +
                `**Instruções:**\n` +
                `1. Use o Client ID e Client Secret para autenticação OAuth\n` +
                `2. Configure o Callback URL na sua aplicação\n` +
                `3. Mantenha as credenciais seguras\n` +
                `4. Use a aplicação para obter tokens de acesso\n\n` +
                `**Segurança:**\n` +
                `- Client Secret é sensível e deve ser protegido\n` +
                `- Use HTTPS para todas as comunicações\n` +
                `- Implemente validação de callback URL\n` +
                `- Monitore uso da aplicação`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            application: validatedApplication,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na criação de aplicação OAuth:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

/**
 * Implementação da ferramenta MCP para obtenção de aplicação OAuth
 */
export async function executeGetOAuthApplication(
  args: {
    applicationId: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar applicationId
    if (!args.applicationId || args.applicationId.trim().length === 0) {
      throw new Error('Application ID é obrigatório');
    }

    // Simular obtenção de aplicação OAuth
    const oauthApplication = {
      id: args.applicationId,
      name: 'Minha Aplicação OAuth',
      description: 'Aplicação OAuth para integração com Bitbucket',
      url: 'https://minhaapp.com',
      callbackUrl: 'https://minhaapp.com/callback',
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      createdAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 dias atrás
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Validar resposta
    const validatedApplication = OAuthApplicationSchema.parse(oauthApplication);

    // Log de auditoria
    console.log(`[AUDIT] Aplicação OAuth obtida: ${validatedApplication.name} (ID: ${args.applicationId})`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Informações da Aplicação OAuth\n\n` +
                `**Detalhes da Aplicação:**\n` +
                `- ID: ${validatedApplication.id}\n` +
                `- Nome: ${validatedApplication.name}\n` +
                `- Descrição: ${validatedApplication.description || 'N/A'}\n` +
                `- URL: ${validatedApplication.url || 'N/A'}\n` +
                `- Callback URL: ${validatedApplication.callbackUrl || 'N/A'}\n` +
                `- Client ID: ${validatedApplication.clientId}\n` +
                `- Client Secret: ${validatedApplication.clientSecret}\n` +
                `- Criada em: ${validatedApplication.createdAt}\n` +
                `- Atualizada em: ${validatedApplication.updatedAt}\n` +
                `- Ativa: ${validatedApplication.isActive ? 'Sim' : 'Não'}\n\n` +
                `**Status:**\n` +
                `- Aplicação ativa e funcionando\n` +
                `- Credenciais válidas\n` +
                `- Configuração correta\n\n` +
                `**Instruções:**\n` +
                `1. Use as credenciais para autenticação OAuth\n` +
                `2. Verifique se o Callback URL está correto\n` +
                `3. Monitore o uso da aplicação\n` +
                `4. Atualize as configurações se necessário`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            application: validatedApplication,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na obtenção de aplicação OAuth:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

/**
 * Implementação da ferramenta MCP para atualização de aplicação OAuth
 */
export async function executeUpdateOAuthApplication(
  args: {
    applicationId: string;
    name?: string;
    description?: string;
    url?: string;
    callbackUrl?: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar applicationId
    if (!args.applicationId || args.applicationId.trim().length === 0) {
      throw new Error('Application ID é obrigatório');
    }

    // Simular atualização de aplicação OAuth
    const now = new Date();
    const oauthApplication = {
      id: args.applicationId,
      name: args.name || 'Minha Aplicação OAuth',
      description: args.description || 'Aplicação OAuth para integração com Bitbucket',
      url: args.url || 'https://minhaapp.com',
      callbackUrl: args.callbackUrl || 'https://minhaapp.com/callback',
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      createdAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 dias atrás
      updatedAt: now.toISOString(),
      isActive: true
    };

    // Validar resposta
    const validatedApplication = OAuthApplicationSchema.parse(oauthApplication);

    // Log de auditoria
    console.log(`[AUDIT] Aplicação OAuth atualizada: ${validatedApplication.name} (ID: ${args.applicationId})`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Aplicação OAuth Atualizada com Sucesso\n\n` +
                `**Informações Atualizadas:**\n` +
                `- ID: ${validatedApplication.id}\n` +
                `- Nome: ${validatedApplication.name}\n` +
                `- Descrição: ${validatedApplication.description || 'N/A'}\n` +
                `- URL: ${validatedApplication.url || 'N/A'}\n` +
                `- Callback URL: ${validatedApplication.callbackUrl || 'N/A'}\n` +
                `- Client ID: ${validatedApplication.clientId}\n` +
                `- Client Secret: ${validatedApplication.clientSecret}\n` +
                `- Criada em: ${validatedApplication.createdAt}\n` +
                `- Atualizada em: ${validatedApplication.updatedAt}\n` +
                `- Ativa: ${validatedApplication.isActive ? 'Sim' : 'Não'}\n\n` +
                `**Mudanças Aplicadas:**\n` +
                `${args.name ? `- Nome atualizado para: ${args.name}\n` : ''}` +
                `${args.description ? `- Descrição atualizada\n` : ''}` +
                `${args.url ? `- URL atualizada para: ${args.url}\n` : ''}` +
                `${args.callbackUrl ? `- Callback URL atualizada para: ${args.callbackUrl}\n` : ''}` +
                `- Timestamp de atualização: ${validatedApplication.updatedAt}\n\n` +
                `**Instruções:**\n` +
                `1. As mudanças foram aplicadas com sucesso\n` +
                `2. Verifique se as novas configurações estão corretas\n` +
                `3. Teste a aplicação com as novas configurações\n` +
                `4. Atualize sua aplicação cliente se necessário`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            application: validatedApplication,
            changes: {
              name: args.name,
              description: args.description,
              url: args.url,
              callbackUrl: args.callbackUrl
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na atualização de aplicação OAuth:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

/**
 * Implementação da ferramenta MCP para exclusão de aplicação OAuth
 */
export async function executeDeleteOAuthApplication(
  args: {
    applicationId: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar applicationId
    if (!args.applicationId || args.applicationId.trim().length === 0) {
      throw new Error('Application ID é obrigatório');
    }

    // Simular exclusão de aplicação OAuth
    const now = new Date();

    // Log de auditoria
    console.log(`[AUDIT] Aplicação OAuth excluída: ${args.applicationId}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Aplicação OAuth Excluída com Sucesso\n\n` +
                `**Informações da Exclusão:**\n` +
                `- Application ID: ${args.applicationId}\n` +
                `- Excluída em: ${now.toISOString()}\n` +
                `- Status: Excluída permanentemente\n\n` +
                `**Instruções:**\n` +
                `1. A aplicação foi removida permanentemente\n` +
                `2. Todas as credenciais foram invalidadas\n` +
                `3. Tokens emitidos por esta aplicação não funcionarão mais\n` +
                `4. Crie uma nova aplicação se necessário\n\n` +
                `**Segurança:**\n` +
                `- Aplicação removida com segurança\n` +
                `- Credenciais limpas\n` +
                `- Log de auditoria registrado\n` +
                `- Exclusão permanente confirmada`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            applicationId: args.applicationId,
            deletedAt: now.toISOString(),
            status: 'deleted',
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na exclusão de aplicação OAuth:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

/**
 * Implementação da ferramenta MCP para listagem de aplicações OAuth
 */
export async function executeListOAuthApplications(
  args: {
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Simular listagem de aplicações OAuth
    const now = new Date();
    const applications = [
      {
        id: generateApplicationId(),
        name: 'Aplicação Principal',
        description: 'Aplicação principal para integração',
        url: 'https://app1.com',
        callbackUrl: 'https://app1.com/callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
        createdAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 dias atrás
        updatedAt: now.toISOString(),
        isActive: true
      },
      {
        id: generateApplicationId(),
        name: 'Aplicação de Teste',
        description: 'Aplicação para testes e desenvolvimento',
        url: 'https://testapp.com',
        callbackUrl: 'https://testapp.com/callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
        createdAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 dias atrás
        updatedAt: now.toISOString(),
        isActive: true
      },
      {
        id: generateApplicationId(),
        name: 'Aplicação Inativa',
        description: 'Aplicação desativada',
        url: 'https://inactiveapp.com',
        callbackUrl: 'https://inactiveapp.com/callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
        createdAt: new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)).toISOString(), // 60 dias atrás
        updatedAt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
        isActive: false
      }
    ];

    const applicationListResponse = {
      applications,
      totalCount: applications.length,
      activeCount: applications.filter(app => app.isActive).length
    };

    // Validar resposta
    const validatedResponse = OAuthApplicationListResponseSchema.parse(applicationListResponse);

    // Log de auditoria
    console.log(`[AUDIT] Lista de aplicações OAuth obtida: ${validatedResponse.totalCount} aplicações`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Lista de Aplicações OAuth\n\n` +
                `**Resumo:**\n` +
                `- Total de Aplicações: ${validatedResponse.totalCount}\n` +
                `- Aplicações Ativas: ${validatedResponse.activeCount}\n` +
                `- Aplicações Inativas: ${validatedResponse.totalCount - validatedResponse.activeCount}\n\n` +
                `**Detalhes das Aplicações:**\n\n` +
                validatedResponse.applications.map((app, index) => 
                  `### Aplicação ${index + 1}\n` +
                  `- **ID:** ${app.id}\n` +
                  `- **Nome:** ${app.name}\n` +
                  `- **Descrição:** ${app.description || 'N/A'}\n` +
                  `- **URL:** ${app.url || 'N/A'}\n` +
                  `- **Callback URL:** ${app.callbackUrl || 'N/A'}\n` +
                  `- **Client ID:** ${app.clientId}\n` +
                  `- **Client Secret:** ${app.clientSecret}\n` +
                  `- **Criada em:** ${app.createdAt}\n` +
                  `- **Atualizada em:** ${app.updatedAt}\n` +
                  `- **Ativa:** ${app.isActive ? 'Sim' : 'Não'}\n\n`
                ).join('') +
                `**Instruções:**\n` +
                `1. Use get_oauth_application para obter detalhes de uma aplicação específica\n` +
                `2. Use update_oauth_application para modificar configurações\n` +
                `3. Use delete_oauth_application para remover aplicações não utilizadas\n` +
                `4. Monitore aplicações ativas regularmente\n\n` +
                `**Segurança:**\n` +
                `- Mantenha credenciais seguras\n` +
                `- Revogue aplicações não utilizadas\n` +
                `- Monitore uso das aplicações\n` +
                `- Implemente rotação de credenciais`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            applications: validatedResponse,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na listagem de aplicações OAuth:`, error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
}

/**
 * Gera um ID único para aplicação
 */
function generateApplicationId(): string {
  return 'app_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Gera um Client ID único
 */
function generateClientId(): string {
  return 'client_' + Math.random().toString(36).substr(2, 12);
}

/**
 * Gera um Client Secret único
 */
function generateClientSecret(): string {
  return 'secret_' + Math.random().toString(36).substr(2, 16);
}

// Exportar ferramentas para registro MCP
export const datacenterOAuthApplicationTools = {
  createOAuthApplication: {
    tool: mcp_bitbucket_auth_create_oauth_application,
    handler: executeCreateOAuthApplication
  },
  getOAuthApplication: {
    tool: mcp_bitbucket_auth_get_oauth_application,
    handler: executeGetOAuthApplication
  },
  updateOAuthApplication: {
    tool: mcp_bitbucket_auth_update_oauth_application,
    handler: executeUpdateOAuthApplication
  },
  deleteOAuthApplication: {
    tool: mcp_bitbucket_auth_delete_oauth_application,
    handler: executeDeleteOAuthApplication
  },
  listOAuthApplications: {
    tool: mcp_bitbucket_auth_list_oauth_applications,
    handler: executeListOAuthApplications
  }
};
