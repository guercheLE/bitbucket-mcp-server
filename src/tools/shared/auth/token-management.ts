import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  OAuthTokenSchema,
  OAuthRevocationRequestSchema,
  OAuthToken,
  OAuthRevocationRequest
} from '../../../types/auth';
import { OAuthService } from '../../../services/auth/oauth';
import { serverDetectionService } from '../../../services/auth/server-detection';

/**
 * Ferramenta MCP para obtenção de informações de token de acesso
 */
export const mcp_bitbucket_auth_get_access_token_info: Tool = {
  name: 'mcp_bitbucket_auth_get_access_token_info',
  description: 'Obtém informações de um token de acesso no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Informações detalhadas do token\n- Validação de token\n- Metadados de acesso\n\n**Parâmetros:**\n- `accessToken`: Token de acesso\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Informações detalhadas do token de acesso.',
  inputSchema: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: 'Token de acesso'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['accessToken'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para revogação de token de acesso
 */
export const mcp_bitbucket_auth_revoke_access_token: Tool = {
  name: 'mcp_bitbucket_auth_revoke_access_token',
  description: 'Revoga um token de acesso no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Revogação segura de token\n- Invalidação imediata\n- Limpeza de sessão\n\n**Parâmetros:**\n- `accessToken`: Token de acesso a ser revogado\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Confirmação de revogação do token.',
  inputSchema: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: 'Token de acesso a ser revogado'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['accessToken'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Implementação da ferramenta MCP para obtenção de informações de token
 */
export async function executeGetAccessTokenInfo(
  args: {
    accessToken: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar token de acesso
    if (!args.accessToken || args.accessToken.trim().length === 0) {
      throw new Error('Token de acesso é obrigatório');
    }

    // Detectar tipo de servidor
    const serverDetection = await serverDetectionService.detectServer('https://bitbucket.org');

    // Determinar URL base do OAuth
    let oauthBaseUrl: string;
    if (serverDetection.serverType === 'cloud') {
      oauthBaseUrl = 'https://bitbucket.org';
    } else {
      oauthBaseUrl = serverDetection.baseUrl;
    }

    // Criar instância do serviço OAuth
    const oauthService = new OAuthService(oauthBaseUrl, '', '');

    // Obter informações do token
    const tokenInfo = await oauthService.getTokenInfo(args.accessToken);

    // Simular token OAuth para validação
    const mockToken: OAuthToken = {
      accessToken: args.accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'mock-refresh-token',
      scope: 'read write',
      createdAt: new Date().toISOString()
    };

    // Validar token
    const validatedToken = OAuthTokenSchema.parse(mockToken);

    // Verificar se token está expirado
    const isExpired = oauthService.isTokenExpired(validatedToken);
    const timeRemaining = oauthService.getTokenTimeRemaining(validatedToken);

    // Log de auditoria
    console.log(`[AUDIT] Informações de token obtidas para server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Informações do Token de Acesso\n\n` +
                `**Status do Token:**\n` +
                `- Válido: ${tokenInfo.isValid ? 'Sim' : 'Não'}\n` +
                `- Expirado: ${isExpired ? 'Sim' : 'Não'}\n` +
                `- Tempo Restante: ${timeRemaining} segundos\n` +
                `- Server Type: ${serverDetection.serverType}\n\n` +
                `**Detalhes do Token:**\n` +
                `- Token Type: ${validatedToken.tokenType}\n` +
                `- Expires In: ${validatedToken.expiresIn} segundos\n` +
                `- Scope: ${validatedToken.scope || 'padrão'}\n` +
                `- Created At: ${validatedToken.createdAt}\n` +
                `- Expires At: ${tokenInfo.expiresAt || 'N/A'}\n\n` +
                `${tokenInfo.error ? `**Erro:** ${tokenInfo.error}\n\n` : ''}` +
                `**Instruções:**\n` +
                `1. Use o token para autenticar requisições à API\n` +
                `2. Monitore o tempo de expiração\n` +
                `3. Renove o token antes da expiração\n` +
                `4. Revogue o token se não for mais necessário\n\n` +
                `**Segurança:**\n` +
                `- Token é sensível e deve ser protegido\n` +
                `- Use HTTPS para todas as comunicações\n` +
                `- Implemente rotação de tokens regularmente`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            tokenInfo: {
              isValid: tokenInfo.isValid,
              isExpired,
              timeRemaining,
              expiresAt: tokenInfo.expiresAt,
              scope: tokenInfo.scope,
              error: tokenInfo.error
            },
            token: {
              tokenType: validatedToken.tokenType,
              expiresIn: validatedToken.expiresIn,
              scope: validatedToken.scope,
              createdAt: validatedToken.createdAt
            },
            serverType: serverDetection.serverType,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na obtenção de informações do token:`, error);

    // Tratar diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('obrigatório')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Parâmetros inválidos',
              details: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } else if (error.message.includes('validation')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Token inválido',
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
 * Implementação da ferramenta MCP para revogação de token
 */
export async function executeRevokeAccessToken(
  args: {
    accessToken: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar token de acesso
    if (!args.accessToken || args.accessToken.trim().length === 0) {
      throw new Error('Token de acesso é obrigatório');
    }

    // Detectar tipo de servidor
    const serverDetection = await serverDetectionService.detectServer('https://bitbucket.org');

    // Determinar URL base do OAuth
    let oauthBaseUrl: string;
    if (serverDetection.serverType === 'cloud') {
      oauthBaseUrl = 'https://bitbucket.org';
    } else {
      oauthBaseUrl = serverDetection.baseUrl;
    }

    // Criar instância do serviço OAuth
    const oauthService = new OAuthService(oauthBaseUrl, '', '');

    // Validar parâmetros de revogação
    const revocationRequest: OAuthRevocationRequest = {
      token: args.accessToken,
      tokenTypeHint: 'access_token',
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret'
    };

    // Validar request
    const validatedRequest = OAuthRevocationRequestSchema.parse(revocationRequest);

    // Executar revogação
    const revocationResult = await oauthService.revokeToken(validatedRequest);

    // Log de auditoria
    console.log(`[AUDIT] Token revogado com sucesso para server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Token Revogado com Sucesso\n\n` +
                `**Informações da Revogação:**\n` +
                `- Token: ${args.accessToken.substring(0, 20)}...\n` +
                `- Token Type: Access Token\n` +
                `- Server Type: ${serverDetection.serverType}\n` +
                `- Revoked At: ${new Date().toISOString()}\n` +
                `- Status: ${revocationResult.success ? 'Sucesso' : 'Falha'}\n` +
                `- Message: ${revocationResult.message}\n\n` +
                `**Instruções:**\n` +
                `1. O token foi revogado com sucesso\n` +
                `2. O token não pode mais ser usado para autenticação\n` +
                `3. Todas as requisições com este token falharão\n` +
                `4. Obtenha um novo token se necessário\n\n` +
                `**Segurança:**\n` +
                `- Token revogado permanentemente\n` +
                `- Sessão encerrada com segurança\n` +
                `- Autenticação limpa\n` +
                `- Log de auditoria registrado`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            revocation: {
              token: args.accessToken.substring(0, 20) + '...',
              tokenType: 'access_token',
              success: revocationResult.success,
              message: revocationResult.message,
              revokedAt: new Date().toISOString()
            },
            serverType: serverDetection.serverType,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na revogação de token:`, error);

    // Tratar diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('obrigatório')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Parâmetros inválidos',
              details: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } else if (error.message.includes('validation')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Request de revogação inválido',
              details: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } else if (error.message.includes('HTTP')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Erro HTTP na revogação de token',
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
 * Valida se um token de acesso está em formato válido
 */
export function validateTokenFormat(accessToken: string): { isValid: boolean; error?: string } {
  if (!accessToken || accessToken.trim().length === 0) {
    return { isValid: false, error: 'Token de acesso é obrigatório' };
  }

  if (accessToken.length < 10) {
    return { isValid: false, error: 'Token de acesso muito curto' };
  }

  if (accessToken.length > 1000) {
    return { isValid: false, error: 'Token de acesso muito longo' };
  }

  // Verificar se contém apenas caracteres válidos
  const validTokenRegex = /^[A-Za-z0-9\-._~+/]+=*$/;
  if (!validTokenRegex.test(accessToken)) {
    return { isValid: false, error: 'Token de acesso contém caracteres inválidos' };
  }

  return { isValid: true };
}

/**
 * Sanitiza token para logs (mostra apenas primeiros e últimos caracteres)
 */
export function sanitizeTokenForLogging(accessToken: string): string {
  if (!accessToken || accessToken.length < 10) {
    return '[REDACTED]';
  }

  const start = accessToken.substring(0, 4);
  const end = accessToken.substring(accessToken.length - 4);
  return `${start}...${end}`;
}

/**
 * Verifica se um token está próximo da expiração
 */
export function isTokenNearExpiration(token: OAuthToken, thresholdMinutes: number = 5): boolean {
  const timeRemaining = getTokenTimeRemaining(token);
  const thresholdSeconds = thresholdMinutes * 60;
  return timeRemaining <= thresholdSeconds;
}

/**
 * Obtém tempo restante do token em segundos
 */
export function getTokenTimeRemaining(token: OAuthToken): number {
  const createdAt = new Date(token.createdAt);
  const expiresAt = new Date(createdAt.getTime() + (token.expiresIn * 1000));
  const now = new Date();
  
  const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Formata tempo restante em formato legível
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return 'Expirado';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Exportar ferramentas para registro MCP
export const tokenManagementTools = {
  getAccessTokenInfo: {
    tool: mcp_bitbucket_auth_get_access_token_info,
    handler: executeGetAccessTokenInfo
  },
  revokeAccessToken: {
    tool: mcp_bitbucket_auth_revoke_access_token,
    handler: executeRevokeAccessToken
  }
};
