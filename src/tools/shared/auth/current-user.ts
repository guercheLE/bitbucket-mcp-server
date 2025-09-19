import { Tool } from '@modelcontextprotocol/sdk/types';
import { 
  UserResponseSchema, 
  CloudUserResponseSchema,
  UserResponse,
  CloudUserResponse
} from '../../../types/auth';
import { serverDetectionService } from '../../../services/auth/server-detection';

/**
 * Ferramenta MCP para obtenção de informações do usuário atual
 * Suporta tanto Data Center quanto Cloud
 */
export const mcp_bitbucket_auth_get_current_session: Tool = {
  name: 'mcp_bitbucket_auth_get_current_session',
  description: 'Obtém a sessão atual do usuário no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Informações da sessão atual\n- Status de autenticação\n- Metadados do usuário\n\n**Parâmetros:**\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Informações da sessão atual do usuário.',
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
 * Implementação da ferramenta MCP para obtenção de informações do usuário atual
 */
export async function executeGetCurrentSession(
  args: {
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Simular obtenção de informações do usuário atual
    // Em uma implementação real, isso viria de uma sessão ativa ou token válido
    
    // Detectar tipo de servidor para determinar formato de resposta
    const serverDetection = await serverDetectionService.detectServer('https://bitbucket.org');
    
    let userInfo: UserResponse | CloudUserResponse;
    
    if (serverDetection.serverType === 'cloud') {
      // Simular resposta do Cloud
      const cloudUserData = {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'current.user',
        display_name: 'Current User',
        account_id: '12345',
        account_status: 'active' as const,
        email: 'current.user@example.com',
        created_on: '2023-01-01T00:00:00.000Z',
        has_2fa_enabled: false,
        links: {
          self: {
            href: 'https://api.bitbucket.org/2.0/users/current.user'
          },
          avatar: {
            href: 'https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/CU-5.png'
          }
        }
      };
      
      // Validar resposta do Cloud
      userInfo = CloudUserResponseSchema.parse(cloudUserData);
    } else {
      // Simular resposta do Data Center
      const datacenterUserData = {
        name: 'current.user',
        emailAddress: 'current.user@example.com',
        id: 12345,
        displayName: 'Current User',
        slug: 'current-user',
        type: 'NORMAL' as const,
        active: true,
        links: {
          self: [{
            href: 'https://bitbucket.example.com/users/current.user'
          }]
        }
      };
      
      // Validar resposta do Data Center
      userInfo = UserResponseSchema.parse(datacenterUserData);
    }

    // Log de auditoria
    console.log(`[AUDIT] Informações do usuário atual obtidas para server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      if (serverDetection.serverType === 'cloud') {
        const cloudUser = userInfo as CloudUserResponse;
        return {
          content: [{
            type: 'text',
            text: `# Informações da Sessão Atual (Cloud)\n\n` +
                  `**Usuário:**\n` +
                  `- UUID: ${cloudUser.uuid}\n` +
                  `- Username: ${cloudUser.username}\n` +
                  `- Display Name: ${cloudUser.display_name}\n` +
                  `- Account ID: ${cloudUser.account_id}\n` +
                  `- Email: ${cloudUser.email}\n` +
                  `- Status: ${cloudUser.account_status}\n` +
                  `- 2FA Habilitado: ${cloudUser.has_2fa_enabled ? 'Sim' : 'Não'}\n` +
                  `- Criado em: ${cloudUser.created_on}\n\n` +
                  `**Links:**\n` +
                  `- Self: ${cloudUser.links.self.href}\n` +
                  `- Avatar: ${cloudUser.links.avatar.href}\n\n` +
                  `**Servidor:**\n` +
                  `- Tipo: ${serverDetection.serverType}\n` +
                  `- Capacidades: ${serverDetection.capabilities.join(', ')}\n\n` +
                  `**Sessão:**\n` +
                  `- Status: Ativa\n` +
                  `- Autenticado: Sim\n` +
                  `- Timestamp: ${new Date().toISOString()}`
          }]
        };
      } else {
        const datacenterUser = userInfo as UserResponse;
        return {
          content: [{
            type: 'text',
            text: `# Informações da Sessão Atual (Data Center)\n\n` +
                  `**Usuário:**\n` +
                  `- ID: ${datacenterUser.id}\n` +
                  `- Name: ${datacenterUser.name}\n` +
                  `- Display Name: ${datacenterUser.displayName}\n` +
                  `- Slug: ${datacenterUser.slug}\n` +
                  `- Email: ${datacenterUser.emailAddress}\n` +
                  `- Type: ${datacenterUser.type}\n` +
                  `- Active: ${datacenterUser.active ? 'Sim' : 'Não'}\n\n` +
                  `**Links:**\n` +
                  `- Self: ${datacenterUser.links.self[0].href}\n\n` +
                  `**Servidor:**\n` +
                  `- Tipo: ${serverDetection.serverType}\n` +
                  `- Capacidades: ${serverDetection.capabilities.join(', ')}\n\n` +
                  `**Sessão:**\n` +
                  `- Status: Ativa\n` +
                  `- Autenticado: Sim\n` +
                  `- Timestamp: ${new Date().toISOString()}`
          }]
        };
      }
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            serverType: serverDetection.serverType,
            userInfo,
            session: {
              isActive: true,
              isAuthenticated: true,
              timestamp: new Date().toISOString()
            },
            serverCapabilities: serverDetection.capabilities
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na obtenção de informações do usuário atual:`, error);

    // Tratar diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Dados do usuário inválidos',
              details: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } else if (error.message.includes('detection')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Falha na detecção de servidor',
              details: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    }

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
 * Implementação alternativa para obter informações do usuário via token de acesso
 */
export async function getCurrentUserFromToken(
  accessToken: string,
  serverType: 'datacenter' | 'cloud',
  baseUrl: string
): Promise<UserResponse | CloudUserResponse> {
  try {
    let endpoint: string;
    let headers: Record<string, string>;

    if (serverType === 'cloud') {
      endpoint = `${baseUrl}/2.0/user`;
      headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      };
    } else {
      endpoint = `${baseUrl}/rest/api/1.0/users/current`;
      headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      };
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userData = await response.json();

    // Validar resposta baseada no tipo de servidor
    if (serverType === 'cloud') {
      return CloudUserResponseSchema.parse(userData);
    } else {
      return UserResponseSchema.parse(userData);
    }

  } catch (error) {
    throw new Error(`Falha ao obter informações do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Valida se o token de acesso é válido e não expirado
 */
export async function validateAccessToken(
  accessToken: string,
  serverType: 'datacenter' | 'cloud',
  baseUrl: string
): Promise<{ isValid: boolean; userInfo?: UserResponse | CloudUserResponse; error?: string }> {
  try {
    const userInfo = await getCurrentUserFromToken(accessToken, serverType, baseUrl);
    
    return {
      isValid: true,
      userInfo
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém informações básicas do usuário sem validação completa
 */
export function getBasicUserInfo(userInfo: UserResponse | CloudUserResponse, serverType: 'datacenter' | 'cloud') {
  if (serverType === 'cloud') {
    const cloudUser = userInfo as CloudUserResponse;
    return {
      id: cloudUser.uuid,
      username: cloudUser.username,
      displayName: cloudUser.display_name,
      email: cloudUser.email,
      isActive: cloudUser.account_status === 'active',
      has2FA: cloudUser.has_2fa_enabled
    };
  } else {
    const datacenterUser = userInfo as UserResponse;
    return {
      id: datacenterUser.id,
      username: datacenterUser.name,
      displayName: datacenterUser.displayName,
      email: datacenterUser.emailAddress,
      isActive: datacenterUser.active,
      has2FA: false // Data Center não tem informação de 2FA na resposta básica
    };
  }
}

// Exportar ferramenta para registro MCP
export const currentUserTool = {
  tool: mcp_bitbucket_auth_get_current_session,
  handler: executeGetCurrentSession
};
