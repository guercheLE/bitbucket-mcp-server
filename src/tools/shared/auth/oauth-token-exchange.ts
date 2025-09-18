import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  OAuthTokenRequestSchema, 
  OAuthTokenResponseSchema,
  OAuthTokenRequest,
  OAuthTokenResponse
} from '../../../types/auth';
import { OAuthService } from '../../../services/auth/oauth';
import { serverDetectionService } from '../../../services/auth/server-detection';

/**
 * Ferramenta MCP para obtenção de token OAuth 2.0
 * Implementa troca de código por token e refresh de token
 */
export const mcp_bitbucket_auth_get_oauth_token: Tool = {
  name: 'mcp_bitbucket_auth_get_oauth_token',
  description: 'Obtém um token OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Obter token de autorização\n- Obter token de refresh\n- Configuração completa de OAuth\n\n**Parâmetros:**\n- `grantType`: Tipo de concessão (\'authorization_code\' ou \'refresh_token\')\n- `code`: Código de autorização (opcional)\n- `redirectUri`: URI de redirecionamento (opcional)\n- `clientId`: ID do cliente (opcional)\n- `clientSecret`: Segredo do cliente (opcional)\n- `refreshToken`: Token de refresh (opcional)\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Token OAuth com informações de acesso.',
  inputSchema: {
    type: 'object',
    properties: {
      grantType: {
        type: 'string',
        enum: ['authorization_code', 'refresh_token'],
        description: 'Tipo de concessão OAuth 2.0'
      },
      code: {
        type: 'string',
        description: 'Código de autorização (obrigatório para authorization_code)'
      },
      redirectUri: {
        type: 'string',
        description: 'URI de redirecionamento (obrigatório para authorization_code)'
      },
      clientId: {
        type: 'string',
        description: 'ID do cliente OAuth'
      },
      clientSecret: {
        type: 'string',
        description: 'Segredo do cliente OAuth'
      },
      refreshToken: {
        type: 'string',
        description: 'Token de refresh (obrigatório para refresh_token)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['grantType'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Ferramenta MCP para renovação de token OAuth 2.0
 */
export const mcp_bitbucket_auth_refresh_oauth_token: Tool = {
  name: 'mcp_bitbucket_auth_refresh_oauth_token',
  description: 'Atualiza um token OAuth no Bitbucket Data Center.\n\n**Funcionalidades:**\n- Renovar token de acesso\n- Manter sessão ativa\n- Gerenciamento automático de tokens\n\n**Parâmetros:**\n- `refreshToken`: Token de refresh atual\n- `clientId`: ID do cliente OAuth\n- `clientSecret`: Segredo do cliente OAuth\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** Novo token OAuth com informações atualizadas.',
  inputSchema: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        description: 'Token de refresh atual'
      },
      clientId: {
        type: 'string',
        description: 'ID do cliente OAuth'
      },
      clientSecret: {
        type: 'string',
        description: 'Segredo do cliente OAuth'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['refreshToken', 'clientId', 'clientSecret'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Implementação da ferramenta MCP para obtenção de token OAuth 2.0
 */
export async function executeGetOAuthToken(
  args: {
    grantType: string;
    code?: string;
    redirectUri?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = OAuthTokenRequestSchema.parse({
      grantType: args.grantType as 'authorization_code' | 'refresh_token',
      clientId: args.clientId || '',
      clientSecret: args.clientSecret || '',
      code: args.code,
      redirectUri: args.redirectUri,
      refreshToken: args.refreshToken,
      codeVerifier: args.grantType === 'authorization_code' ? generateCodeVerifier() : undefined
    });

    // Detectar tipo de servidor se redirectUri for fornecido
    let serverDetection;
    if (validatedRequest.redirectUri) {
      try {
        const baseUrl = validatedRequest.redirectUri.split('/')[0] + '//' + validatedRequest.redirectUri.split('/')[2];
        serverDetection = await serverDetectionService.detectServer(baseUrl);
      } catch (error) {
        console.warn('Falha na detecção de servidor, usando configuração padrão');
        serverDetection = {
          serverType: 'cloud' as const,
          baseUrl: 'https://bitbucket.org',
          capabilities: ['oauth2', 'personal_tokens', 'basic_auth']
        };
      }
    } else {
      // Para refresh_token, assumir Cloud por padrão
      serverDetection = {
        serverType: 'cloud' as const,
        baseUrl: 'https://bitbucket.org',
        capabilities: ['oauth2', 'personal_tokens', 'basic_auth']
      };
    }

    // Determinar URL base do OAuth
    let oauthBaseUrl: string;
    if (serverDetection.serverType === 'cloud') {
      oauthBaseUrl = 'https://bitbucket.org';
    } else {
      oauthBaseUrl = serverDetection.baseUrl;
    }

    // Criar instância do serviço OAuth
    const oauthService = new OAuthService(oauthBaseUrl, validatedRequest.clientId, validatedRequest.clientSecret);

    // Executar troca de token baseado no grant type
    let tokenResponse: OAuthTokenResponse;
    
    if (validatedRequest.grantType === 'authorization_code') {
      tokenResponse = await oauthService.exchangeCodeForToken(validatedRequest);
    } else {
      tokenResponse = await oauthService.refreshToken(validatedRequest);
    }

    // Validar resposta
    const validatedResponse = OAuthTokenResponseSchema.parse(tokenResponse);

    // Log de auditoria
    console.log(`[AUDIT] Token OAuth obtido com sucesso para grant_type: ${validatedRequest.grantType}, server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Token OAuth 2.0 Obtido com Sucesso\n\n` +
                `**Tipo de Concessão:** ${validatedRequest.grantType}\n\n` +
                `**Informações do Token:**\n` +
                `- Access Token: ${validatedResponse.accessToken.substring(0, 20)}...\n` +
                `- Token Type: ${validatedResponse.tokenType}\n` +
                `- Expires In: ${validatedResponse.expiresIn} segundos\n` +
                `- Scope: ${validatedResponse.scope || 'padrão'}\n` +
                `- Server Type: ${serverDetection.serverType}\n\n` +
                `${validatedResponse.refreshToken ? `**Refresh Token:** ${validatedResponse.refreshToken.substring(0, 20)}...\n\n` : ''}` +
                `**Instruções:**\n` +
                `1. Use o access_token para autenticar requisições à API\n` +
                `2. O token expira em ${validatedResponse.expiresIn} segundos\n` +
                `3. Use o refresh_token para renovar o access_token quando necessário\n` +
                `4. Armazene os tokens de forma segura\n\n` +
                `**Segurança:**\n` +
                `- Tokens são sensíveis e devem ser protegidos\n` +
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
            grantType: validatedRequest.grantType,
            accessToken: validatedResponse.accessToken,
            tokenType: validatedResponse.tokenType,
            expiresIn: validatedResponse.expiresIn,
            refreshToken: validatedResponse.refreshToken,
            scope: validatedResponse.scope,
            serverType: serverDetection.serverType,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na obtenção de token OAuth:`, error);

    // Tratar diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
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
      } else if (error.message.includes('HTTP')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Erro HTTP na troca de token',
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
 * Implementação da ferramenta MCP para renovação de token OAuth 2.0
 */
export async function executeRefreshOAuthToken(
  args: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = OAuthTokenRequestSchema.parse({
      grantType: 'refresh_token' as const,
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      refreshToken: args.refreshToken
    });

    // Para refresh_token, assumir Cloud por padrão
    const serverDetection = {
      serverType: 'cloud' as const,
      baseUrl: 'https://bitbucket.org',
      capabilities: ['oauth2', 'personal_tokens', 'basic_auth']
    };

    // Criar instância do serviço OAuth
    const oauthService = new OAuthService(serverDetection.baseUrl, validatedRequest.clientId, validatedRequest.clientSecret);

    // Executar refresh de token
    const tokenResponse = await oauthService.refreshToken(validatedRequest);

    // Validar resposta
    const validatedResponse = OAuthTokenResponseSchema.parse(tokenResponse);

    // Log de auditoria
    console.log(`[AUDIT] Token OAuth renovado com sucesso para server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# Token OAuth 2.0 Renovado com Sucesso\n\n` +
                `**Informações do Novo Token:**\n` +
                `- Access Token: ${validatedResponse.accessToken.substring(0, 20)}...\n` +
                `- Token Type: ${validatedResponse.tokenType}\n` +
                `- Expires In: ${validatedResponse.expiresIn} segundos\n` +
                `- Scope: ${validatedResponse.scope || 'padrão'}\n` +
                `- Server Type: ${serverDetection.serverType}\n\n` +
                `${validatedResponse.refreshToken ? `**Novo Refresh Token:** ${validatedResponse.refreshToken.substring(0, 20)}...\n\n` : ''}` +
                `**Instruções:**\n` +
                `1. Use o novo access_token para autenticar requisições à API\n` +
                `2. O token expira em ${validatedResponse.expiresIn} segundos\n` +
                `3. Use o novo refresh_token para futuras renovações\n` +
                `4. O refresh_token anterior foi invalidado\n\n` +
                `**Segurança:**\n` +
                `- Tokens são sensíveis e devem ser protegidos\n` +
                `- Implemente rotação automática de tokens\n` +
                `- Monitore expiração de tokens`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            grantType: 'refresh_token',
            accessToken: validatedResponse.accessToken,
            tokenType: validatedResponse.tokenType,
            expiresIn: validatedResponse.expiresIn,
            refreshToken: validatedResponse.refreshToken,
            scope: validatedResponse.scope,
            serverType: serverDetection.serverType,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na renovação de token OAuth:`, error);

    // Tratar diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('validation')) {
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
      } else if (error.message.includes('HTTP')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Erro HTTP na renovação de token',
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
 * Gera code verifier para PKCE
 */
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Exportar ferramentas para registro MCP
export const oauthTokenExchangeTools = {
  getToken: {
    tool: mcp_bitbucket_auth_get_oauth_token,
    handler: executeGetOAuthToken
  },
  refreshToken: {
    tool: mcp_bitbucket_auth_refresh_oauth_token,
    handler: executeRefreshOAuthToken
  }
};
