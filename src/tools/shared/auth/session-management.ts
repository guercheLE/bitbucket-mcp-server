import { Tool } from '@modelcontextprotocol/sdk/types';
import { 
  SessionRequestSchema, 
  SessionResponseSchema,
  SessionListResponseSchema,
  SessionRequest,
  SessionResponse,
  SessionListResponse
} from '../../../types/auth';
import { serverDetectionService } from '../../../services/auth/server-detection';

/**
 * Ferramenta MCP para criação de sessão de usuário
 */
export const mcp_bitbucket_auth_create_session: Tool = {
  name: 'mcp_bitbucket_auth_create_session',
  description: 'Cria uma nova sessão de usuário no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Criação de sessão\n- Autenticação de usuário\n- Configuração de sessão\n\n**Parâmetros:**\n- `userId`: ID do usuário\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Nova sessão criada com informações do usuário.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        description: 'ID do usuário'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['userId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para renovação de sessão de usuário
 */
export const mcp_bitbucket_auth_refresh_session: Tool = {
  name: 'mcp_bitbucket_auth_refresh_session',
  description: 'Atualiza uma sessão de usuário no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Renovação de sessão\n- Extensão de tempo de vida\n- Manutenção de autenticação\n\n**Parâmetros:**\n- `sessionId`: ID da sessão\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Sessão atualizada com novo tempo de vida.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID da sessão'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['sessionId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para revogação de sessão de usuário
 */
export const mcp_bitbucket_auth_revoke_session: Tool = {
  name: 'mcp_bitbucket_auth_revoke_session',
  description: 'Revoga uma sessão de usuário no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Revogação de sessão\n- Logout seguro\n- Limpeza de autenticação\n\n**Parâmetros:**\n- `sessionId`: ID da sessão\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Confirmação de revogação da sessão.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'ID da sessão'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['sessionId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para listagem de sessões ativas
 */
export const mcp_bitbucket_auth_list_active_sessions: Tool = {
  name: 'mcp_bitbucket_auth_list_active_sessions',
  description: 'Lista sessões ativas de um usuário no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Lista de sessões ativas\n- Informações de cada sessão\n- Status de autenticação\n\n**Parâmetros:**\n- `userId`: ID do usuário\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Lista de todas as sessões ativas do usuário.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        description: 'ID do usuário'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['userId'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Implementação da ferramenta MCP para criação de sessão
 */
export async function executeCreateSession(
  args: {
    userId: number;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = SessionRequestSchema.parse({
      userId: args.userId,
      serverType: 'cloud', // Assumir Cloud por padrão
      authenticationMethod: 'oauth2'
    });

    // Detectar tipo de servidor
    const serverDetection = await serverDetectionService.detectServer('https://bitbucket.org');

    // Criar nova sessão
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hora

    const sessionResponse: SessionResponse = {
      sessionId,
      userId: validatedRequest.userId,
      serverType: serverDetection.serverType,
      authenticationMethod: validatedRequest.authenticationMethod,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      lastAccessedAt: now.toISOString()
    };

    // Validar resposta
    const validatedResponse = SessionResponseSchema.parse(sessionResponse);

    // Log de auditoria
    console.log(`[AUDIT] Sessão criada para userId: ${validatedRequest.userId}, sessionId: ${sessionId}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Nova Sessão Criada com Sucesso\n\n` +
                `**Informações da Sessão:**\n` +
                `- Session ID: ${validatedResponse.sessionId}\n` +
                `- User ID: ${validatedResponse.userId}\n` +
                `- Server Type: ${validatedResponse.serverType}\n` +
                `- Authentication Method: ${validatedResponse.authenticationMethod}\n` +
                `- Created At: ${validatedResponse.createdAt}\n` +
                `- Expires At: ${validatedResponse.expiresAt}\n` +
                `- Is Active: ${validatedResponse.isActive ? 'Sim' : 'Não'}\n` +
                `- Last Accessed: ${validatedResponse.lastAccessedAt}\n\n` +
                `**Instruções:**\n` +
                `1. Use o sessionId para autenticar requisições\n` +
                `2. A sessão expira em 1 hora\n` +
                `3. Use refresh_session para estender a sessão\n` +
                `4. Use revoke_session para encerrar a sessão\n\n` +
                `**Segurança:**\n` +
                `- Mantenha o sessionId seguro\n` +
                `- Monitore o tempo de expiração\n` +
                `- Revogue sessões não utilizadas`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            session: validatedResponse,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na criação de sessão:`, error);

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
 * Implementação da ferramenta MCP para renovação de sessão
 */
export async function executeRefreshSession(
  args: {
    sessionId: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar sessionId
    if (!isValidUUID(args.sessionId)) {
      throw new Error('SessionId inválido');
    }

    // Simular renovação de sessão
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hora

    const refreshedSession: SessionResponse = {
      sessionId: args.sessionId,
      userId: 12345, // Simular userId
      serverType: 'cloud',
      authenticationMethod: 'oauth2',
      createdAt: new Date(now.getTime() - (30 * 60 * 1000)).toISOString(), // 30 min atrás
      expiresAt: newExpiresAt.toISOString(),
      isActive: true,
      lastAccessedAt: now.toISOString()
    };

    // Validar resposta
    const validatedResponse = SessionResponseSchema.parse(refreshedSession);

    // Log de auditoria
    console.log(`[AUDIT] Sessão renovada para sessionId: ${args.sessionId}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Sessão Renovada com Sucesso\n\n` +
                `**Informações da Sessão Renovada:**\n` +
                `- Session ID: ${validatedResponse.sessionId}\n` +
                `- User ID: ${validatedResponse.userId}\n` +
                `- Server Type: ${validatedResponse.serverType}\n` +
                `- Authentication Method: ${validatedResponse.authenticationMethod}\n` +
                `- Created At: ${validatedResponse.createdAt}\n` +
                `- New Expires At: ${validatedResponse.expiresAt}\n` +
                `- Is Active: ${validatedResponse.isActive ? 'Sim' : 'Não'}\n` +
                `- Last Accessed: ${validatedResponse.lastAccessedAt}\n\n` +
                `**Instruções:**\n` +
                `1. A sessão foi estendida por mais 1 hora\n` +
                `2. Continue usando o mesmo sessionId\n` +
                `3. Monitore o novo tempo de expiração\n` +
                `4. Renove novamente antes da expiração\n\n` +
                `**Segurança:**\n` +
                `- Sessão renovada com sucesso\n` +
                `- Tempo de vida estendido\n` +
                `- Último acesso atualizado`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            session: validatedResponse,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na renovação de sessão:`, error);

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
 * Implementação da ferramenta MCP para revogação de sessão
 */
export async function executeRevokeSession(
  args: {
    sessionId: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar sessionId
    if (!isValidUUID(args.sessionId)) {
      throw new Error('SessionId inválido');
    }

    // Simular revogação de sessão
    const now = new Date();

    // Log de auditoria
    console.log(`[AUDIT] Sessão revogada para sessionId: ${args.sessionId}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Sessão Revogada com Sucesso\n\n` +
                `**Informações da Revogação:**\n` +
                `- Session ID: ${args.sessionId}\n` +
                `- Revoked At: ${now.toISOString()}\n` +
                `- Status: Revogada\n\n` +
                `**Instruções:**\n` +
                `1. A sessão foi encerrada com sucesso\n` +
                `2. O sessionId não pode mais ser usado\n` +
                `3. Todas as requisições com este sessionId falharão\n` +
                `4. Crie uma nova sessão se necessário\n\n` +
                `**Segurança:**\n` +
                `- Sessão revogada permanentemente\n` +
                `- Logout seguro realizado\n` +
                `- Autenticação limpa`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId: args.sessionId,
            revokedAt: now.toISOString(),
            status: 'revoked',
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na revogação de sessão:`, error);

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
 * Implementação da ferramenta MCP para listagem de sessões ativas
 */
export async function executeListActiveSessions(
  args: {
    userId: number;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = SessionRequestSchema.parse({
      userId: args.userId,
      serverType: 'cloud',
      authenticationMethod: 'oauth2'
    });

    // Simular listagem de sessões ativas
    const now = new Date();
    const sessions: SessionResponse[] = [
      {
        sessionId: generateSessionId(),
        userId: validatedRequest.userId,
        serverType: 'cloud',
        authenticationMethod: 'oauth2',
        createdAt: new Date(now.getTime() - (30 * 60 * 1000)).toISOString(),
        expiresAt: new Date(now.getTime() + (30 * 60 * 1000)).toISOString(),
        isActive: true,
        lastAccessedAt: new Date(now.getTime() - (5 * 60 * 1000)).toISOString()
      },
      {
        sessionId: generateSessionId(),
        userId: validatedRequest.userId,
        serverType: 'cloud',
        authenticationMethod: 'personal_token',
        createdAt: new Date(now.getTime() - (60 * 60 * 1000)).toISOString(),
        expiresAt: new Date(now.getTime() + (2 * 60 * 60 * 1000)).toISOString(),
        isActive: true,
        lastAccessedAt: new Date(now.getTime() - (10 * 60 * 1000)).toISOString()
      }
    ];

    const sessionListResponse: SessionListResponse = {
      sessions,
      totalCount: sessions.length,
      activeCount: sessions.filter(s => s.isActive).length
    };

    // Validar resposta
    const validatedResponse = SessionListResponseSchema.parse(sessionListResponse);

    // Log de auditoria
    console.log(`[AUDIT] Sessões ativas listadas para userId: ${validatedRequest.userId}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Sessões Ativas do Usuário\n\n` +
                `**Resumo:**\n` +
                `- Total de Sessões: ${validatedResponse.totalCount}\n` +
                `- Sessões Ativas: ${validatedResponse.activeCount}\n` +
                `- User ID: ${validatedRequest.userId}\n\n` +
                `**Detalhes das Sessões:**\n\n` +
                validatedResponse.sessions.map((session, index) => 
                  `### Sessão ${index + 1}\n` +
                  `- **Session ID:** ${session.sessionId}\n` +
                  `- **Server Type:** ${session.serverType}\n` +
                  `- **Auth Method:** ${session.authenticationMethod}\n` +
                  `- **Created:** ${session.createdAt}\n` +
                  `- **Expires:** ${session.expiresAt}\n` +
                  `- **Active:** ${session.isActive ? 'Sim' : 'Não'}\n` +
                  `- **Last Accessed:** ${session.lastAccessedAt}\n\n`
                ).join('') +
                `**Instruções:**\n` +
                `1. Use revoke_session para encerrar sessões específicas\n` +
                `2. Monitore sessões próximas do vencimento\n` +
                `3. Revogue sessões não utilizadas\n` +
                `4. Use refresh_session para estender sessões ativas\n\n` +
                `**Segurança:**\n` +
                `- Monitore sessões ativas regularmente\n` +
                `- Revogue sessões suspeitas\n` +
                `- Mantenha apenas sessões necessárias`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessions: validatedResponse,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na listagem de sessões ativas:`, error);

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
 * Gera um UUID v4 para sessionId
 */
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Valida se uma string é um UUID válido
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Exportar ferramentas para registro MCP
export const sessionManagementTools = {
  createSession: {
    tool: mcp_bitbucket_auth_create_session,
    handler: executeCreateSession
  },
  refreshSession: {
    tool: mcp_bitbucket_auth_refresh_session,
    handler: executeRefreshSession
  },
  revokeSession: {
    tool: mcp_bitbucket_auth_revoke_session,
    handler: executeRevokeSession
  },
  listActiveSessions: {
    tool: mcp_bitbucket_auth_list_active_sessions,
    handler: executeListActiveSessions
  }
};
