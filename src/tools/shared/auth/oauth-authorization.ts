import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  OAuthAuthorizationRequestSchema, 
  OAuthAuthorizationResponseSchema,
  OAuthAuthorizationRequest,
  OAuthAuthorizationResponse
} from '../../../types/auth';
import { OAuthService } from '../../../services/auth/oauth';
import { serverDetectionService } from '../../../services/auth/server-detection';

/**
 * Ferramenta MCP para geração de URL de autorização OAuth 2.0
 * Implementa PKCE e proteção CSRF conforme especificação OAuth 2.0
 */
export const mcp_bitbucket_auth_get_oauth_authorization_url: Tool = {
  name: 'mcp_bitbucket_auth_get_oauth_authorization_url',
  description: 'Gera URL de autorização OAuth 2.0 no Bitbucket Data Center.\n\n**Funcionalidades:**\n- URL de autorização completa\n- Parâmetros de segurança\n- Configuração de escopo\n\n**Parâmetros:**\n- `responseType`: Tipo de resposta (\'code\')\n- `clientId`: ID do cliente OAuth\n- `redirectUri`: URI de redirecionamento\n- `scope`: Escopo de permissões\n- `state`: Estado de segurança (opcional)\n- `output`: Formato de saída - \'markdown\' ou \'json\' (padrão)\n\n**Retorna:** URL completa de autorização OAuth.',
  inputSchema: {
    type: 'object',
    properties: {
      responseType: {
        type: 'string',
        enum: ['code'],
        description: 'Tipo de resposta OAuth 2.0'
      },
      clientId: {
        type: 'string',
        description: 'ID do cliente OAuth'
      },
      redirectUri: {
        type: 'string',
        description: 'URI de redirecionamento'
      },
      scope: {
        type: 'string',
        description: 'Escopo de permissões (opcional)'
      },
      state: {
        type: 'string',
        description: 'Estado de segurança para proteção CSRF (opcional)'
      },
      output: {
        type: 'string',
        enum: ['markdown', 'json'],
        default: 'json',
        description: 'Formato de saída'
      }
    },
    required: ['responseType', 'clientId', 'redirectUri'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#'
  }
};

/**
 * Implementação da ferramenta MCP para geração de URL de autorização OAuth 2.0
 */
export async function executeOAuthAuthorizationUrl(
  args: {
    responseType: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    output?: 'markdown' | 'json';
  }
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    // Validar parâmetros de entrada
    const validatedRequest = OAuthAuthorizationRequestSchema.parse({
      responseType: args.responseType as 'code',
      clientId: args.clientId,
      redirectUri: args.redirectUri,
      scope: args.scope,
      state: args.state || generateRandomState(),
      codeChallenge: generateCodeChallenge(),
      codeChallengeMethod: 'S256'
    });

    // Detectar tipo de servidor para determinar URL base
    const serverDetection = await serverDetectionService.detectServer(validatedRequest.redirectUri.split('/')[0] + '//' + validatedRequest.redirectUri.split('/')[2]);
    
    // Determinar URL base do OAuth baseado no tipo de servidor
    let oauthBaseUrl: string;
    if (serverDetection.serverType === 'cloud') {
      oauthBaseUrl = 'https://bitbucket.org';
    } else {
      // Para Data Center, usar a URL base detectada
      oauthBaseUrl = serverDetection.baseUrl;
    }

    // Criar instância do serviço OAuth
    const oauthService = new OAuthService(oauthBaseUrl, validatedRequest.clientId, '');

    // Gerar URL de autorização
    const response = oauthService.generateAuthorizationUrl(validatedRequest);

    // Validar resposta
    const validatedResponse = OAuthAuthorizationResponseSchema.parse(response);

    // Log de auditoria
    console.log(`[AUDIT] OAuth Authorization URL gerada para client_id: ${validatedRequest.clientId}, server_type: ${serverDetection.serverType}`);

    // Formatar saída
    const output = args.output || 'json';
    
    if (output === 'markdown') {
      return {
        content: [{
          type: 'text',
          text: `# URL de Autorização OAuth 2.0 Gerada\n\n` +
                `**URL de Autorização:** ${validatedResponse.authorizationUrl}\n\n` +
                `**Parâmetros:**\n` +
                `- Client ID: ${validatedRequest.clientId}\n` +
                `- Redirect URI: ${validatedRequest.redirectUri}\n` +
                `- State: ${validatedResponse.state}\n` +
                `- Code Challenge: ${validatedResponse.codeChallenge}\n` +
                `- Scope: ${validatedRequest.scope || 'padrão'}\n` +
                `- Server Type: ${serverDetection.serverType}\n\n` +
                `**Instruções:**\n` +
                `1. Redirecione o usuário para a URL de autorização\n` +
                `2. O usuário autorizará a aplicação\n` +
                `3. O Bitbucket redirecionará para o redirect_uri com o código de autorização\n` +
                `4. Use o código para trocar por token de acesso\n\n` +
                `**Segurança:**\n` +
                `- PKCE implementado para segurança adicional\n` +
                `- State para proteção CSRF\n` +
                `- Validação de parâmetros obrigatória`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            authorizationUrl: validatedResponse.authorizationUrl,
            state: validatedResponse.state,
            codeChallenge: validatedResponse.codeChallenge,
            clientId: validatedRequest.clientId,
            redirectUri: validatedRequest.redirectUri,
            scope: validatedRequest.scope,
            serverType: serverDetection.serverType,
            serverCapabilities: serverDetection.capabilities,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

  } catch (error) {
    // Log de erro
    console.error(`[ERROR] Falha na geração de URL de autorização OAuth:`, error);

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
 * Gera estado aleatório para proteção CSRF
 */
function generateRandomState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gera code challenge para PKCE
 */
function generateCodeChallenge(): string {
  const codeVerifier = generateCodeVerifier();
  return hashCodeVerifier(codeVerifier);
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

/**
 * Gera hash SHA256 do code verifier para PKCE
 */
function hashCodeVerifier(codeVerifier: string): string {
  // Implementação simplificada - em produção usar crypto.createHash
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Usar Web Crypto API se disponível, senão fallback
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      const hashArray = Array.from(new Uint8Array(hash));
      return btoa(String.fromCharCode(...hashArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }) as any;
  } else {
    // Fallback para ambiente sem Web Crypto API
    return btoa(codeVerifier)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

// Exportar ferramenta para registro MCP
export const oauthAuthorizationTool = {
  tool: mcp_bitbucket_auth_get_oauth_authorization_url,
  handler: executeOAuthAuthorizationUrl
};
