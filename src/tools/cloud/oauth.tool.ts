/**
 * Cloud OAuth Tools
 * Ferramentas para gerenciamento de OAuth 2.0 no Bitbucket Cloud
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPool, Pool } from 'generic-pool';
import { OAuthService } from '../../services/cloud/oauth.service.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse, createErrorResponse } from '../../services/types/base.types.js';
import { z } from 'zod';

// Zod schemas for OAuth operations
const GenerateAuthorizationUrlSchema = z.object({
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GenerateAuthorizationUrlWithPKCESchema = z.object({
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExchangeCodeForTokenSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExchangeCodeForTokenWithPKCESchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  code_verifier: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RevokeTokenSchema = z.object({
  token: z.string(),
  token_type_hint: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidateTokenSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetTokenInfoSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserInfoSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserRepositoriesSchema = z.object({
  token: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserTeamsSchema = z.object({
  token: z.string(),
  start: z.number().optional(),
  limit: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserPermissionsSchema = z.object({
  token: z.string(),
  repository: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetUserScopesSchema = z.object({
  token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GeneratePKCEChallengeSchema = z.object({
  length: z.number().optional().default(128),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthConfigurationSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ParseImplicitGrantResponseSchema = z.object({
  url_fragment: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetClientCredentialsTokenSchema = z.object({
  scope: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ExchangeJWTForTokenSchema = z.object({
  jwt_token: z.string(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const IntrospectTokenSchema = z.object({
  token: z.string(),
  token_type_hint: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const StartDeviceFlowSchema = z.object({
  scope: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const PollDeviceFlowTokenSchema = z.object({
  device_code: z.string(),
  interval: z.number().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const CreateSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const IsSessionExpiredSchema = z.object({
  access_token: z.string(),
  expires_at: z.number(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const RefreshSessionIfNeededSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const ValidatePKCEChallengeSchema = z.object({
  code_verifier: z.string(),
  code_challenge: z.string(),
  method: z.string().optional().default('S256'),
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthScopesSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

const GetOAuthEndpointsSchema = z.object({
  output: z.enum(['markdown', 'json']).optional().default('json'),
});

export class CloudOAuthTools {
  private static logger = Logger.forContext('CloudOAuthTools');
  private static oauthServicePool: Pool<OAuthService>;

  static initialize(): void {
    const oauthServiceFactory = {
      create: async () =>
        new OAuthService(new ApiClient(), Logger.forContext('OAuthService'), {
          client_id: process.env.BITBUCKET_CLIENT_ID || '',
          client_secret: process.env.BITBUCKET_CLIENT_SECRET || '',
          redirect_uri: process.env.BITBUCKET_REDIRECT_URI || '',
          authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
          token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
          scopes: ['account', 'repositories'],
          state_length: 32,
        }),
      destroy: async () => {},
    };

    this.oauthServicePool = createPool(oauthServiceFactory, {
      min: 2,
      max: 10,
    });
    this.logger.info('Cloud OAuth tools initialized');
  }

  static async generateAuthorizationUrl(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('generateAuthorizationUrl');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Generating authorization URL:', {
        scopes: params.scopes,
        state: params.state,
      });

      const result = service.generateAuthorizationUrl({
        scope: params.scopes,
        state: params.state,
      });

      methodLogger.info('Successfully generated authorization URL');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to generate authorization URL:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async generateAuthorizationUrlWithPKCE(
    params: any,
    output: 'markdown' | 'json' = 'markdown'
  ) {
    const methodLogger = this.logger.forMethod('generateAuthorizationUrlWithPKCE');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Generating authorization URL with PKCE:', {
        scopes: params.scopes,
        state: params.state,
      });

      const result = service.generateAuthorizationUrlWithPKCE({
        scope: params.scopes,
        state: params.state,
      });

      methodLogger.info('Successfully generated authorization URL with PKCE');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to generate authorization URL with PKCE:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async exchangeCodeForToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('exchangeCodeForToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Exchanging code for token:', {
        code: params.code,
        state: params.state,
      });

      const result = await service.exchangeCodeForToken(params.code, params.state);

      methodLogger.info('Successfully exchanged code for token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to exchange code for token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async generateImplicitGrantUrl(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('generateImplicitGrantUrl');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Generating implicit grant URL:', {
        scopes: params.scopes,
        state: params.state,
      });

      const result = service.generateImplicitGrantUrl({
        scope: params.scopes,
        state: params.state,
      });

      methodLogger.info('Successfully generated implicit grant URL');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to generate implicit grant URL:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async parseImplicitGrantResponse(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('parseImplicitGrantResponse');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Parsing implicit grant response:', {
        url_fragment: params.url_fragment,
      });

      const result = service.parseImplicitGrantResponse(params.url_fragment);

      methodLogger.info('Successfully parsed implicit grant response');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to parse implicit grant response:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async refreshAccessToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('refreshAccessToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Refreshing access token:', {
        refresh_token: params.refresh_token,
      });

      const result = await service.refreshAccessToken(params.refresh_token);

      methodLogger.info('Successfully refreshed access token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh access token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async getClientCredentialsToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getClientCredentialsToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Getting client credentials token:', {
        scope: params.scope,
      });

      const result = await service.getClientCredentialsToken(params.scope);

      methodLogger.info('Successfully got client credentials token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get client credentials token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async exchangeJWTForToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('exchangeJWTForToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Exchanging JWT for token:', {
        jwt_token: params.jwt_token,
      });

      const result = await service.exchangeJWTForToken(params.jwt_token);

      methodLogger.info('Successfully exchanged JWT for token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to exchange JWT for token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async revokeToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('revokeToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Revoking token:', {
        token: params.token,
        token_type_hint: params.token_type_hint,
      });

      await service.revokeToken(params.token, params.token_type_hint);

      methodLogger.info('Successfully revoked token');
      return createMcpResponse({ message: 'Token revoked successfully' }, output);
    } catch (error) {
      methodLogger.error('Failed to revoke token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async introspectToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('introspectToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Introspecting token:', {
        token: params.token,
        token_type_hint: params.token_type_hint,
      });

      const result = await service.introspectToken(params.token, params.token_type_hint);

      methodLogger.info('Successfully introspected token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to introspect token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async validateToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('validateToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Validating token:', {
        token: params.token,
      });

      const result = await service.validateToken(params.token);

      methodLogger.info('Successfully validated token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to validate token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async getAuthorizationServerMetadata(output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('getAuthorizationServerMetadata');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Getting authorization server metadata');

      const result = await service.getAuthorizationServerMetadata();

      methodLogger.info('Successfully retrieved authorization server metadata');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to get authorization server metadata:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async startDeviceFlow(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('startDeviceFlow');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Starting device flow:', {
        scope: params.scope,
      });

      const result = await service.startDeviceFlow(params.scope);

      methodLogger.info('Successfully started device flow');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to start device flow:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async pollDeviceFlowToken(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('pollDeviceFlowToken');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Polling device flow token:', {
        device_code: params.device_code,
        interval: params.interval,
      });

      const result = await service.pollDeviceFlowToken(params.device_code, params.interval);

      methodLogger.info('Successfully polled device flow token');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to poll device flow token:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async createSession(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('createSession');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Creating session:', {
        state: params.state,
      });

      const result = service.createSession(params.tokenResponse, params.state);

      methodLogger.info('Successfully created session');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to create session:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async isSessionExpired(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('isSessionExpired');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Checking if session is expired:', {
        session: params.session,
      });

      const result = service.isSessionExpired(params.session);

      methodLogger.info('Successfully checked session expiration');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to check session expiration:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static async refreshSessionIfNeeded(params: any, output: 'markdown' | 'json' = 'markdown') {
    const methodLogger = this.logger.forMethod('refreshSessionIfNeeded');
    let service: OAuthService | null = null;

    try {
      service = await this.oauthServicePool.acquire();
      methodLogger.debug('Refreshing session if needed:', {
        session: params.session,
      });

      const result = await service.refreshSessionIfNeeded(params.session);

      methodLogger.info('Successfully refreshed session if needed');
      return createMcpResponse(result, output);
    } catch (error) {
      methodLogger.error('Failed to refresh session if needed:', error);
      if (service) {
        this.oauthServicePool.destroy(service);
        service = null;
      }
      return createErrorResponse(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      if (service) {
        this.oauthServicePool.release(service);
      }
    }
  }

  static register(server: McpServer): void {
    const registerLogger = this.logger.forMethod('register');

    // Initialize the service
    this.initialize();

    // Generate Authorization URL
    server.registerTool(
      'oauth_generate_authorization_url',
      {
        description: `Gera URL de autorização OAuth 2.0 para o Bitbucket Cloud.

**Funcionalidades:**
- Geração de URL de autorização
- Configuração de parâmetros
- Gerenciamento de estado

**Parâmetros:**
- \`client_id\`: ID do cliente (opcional)
- \`redirect_uri\`: URI de redirecionamento (opcional)
- \`scope\`: Escopo de permissões (opcional)
- \`state\`: Estado personalizado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a URL de autorização gerada.`,
        inputSchema: GenerateAuthorizationUrlSchema.shape,
      },
      async (params: z.infer<typeof GenerateAuthorizationUrlSchema>) => {
        const validatedParams = GenerateAuthorizationUrlSchema.parse(params);
        return await this.generateAuthorizationUrl(
          {
            scopes: validatedParams.scope,
            state: validatedParams.state,
          },
          validatedParams.output
        );
      }
    );

    // Generate Authorization URL with PKCE
    server.registerTool(
      'oauth_generate_authorization_url_with_pkce',
      {
        description: `Gera URL de autorização OAuth 2.0 com PKCE para o Bitbucket Cloud.

**Funcionalidades:**
- Geração de URL com PKCE
- Segurança aprimorada
- Gerenciamento de code verifier

**Parâmetros:**
- \`client_id\`: ID do cliente (opcional)
- \`redirect_uri\`: URI de redirecionamento (opcional)
- \`scope\`: Escopo de permissões (opcional)
- \`state\`: Estado personalizado (opcional)
- \`code_challenge\`: Code challenge para PKCE (opcional)
- \`code_challenge_method\`: Método do code challenge (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a URL de autorização, code verifier e state.`,
        inputSchema: GenerateAuthorizationUrlWithPKCESchema.shape,
      },
      async (params: z.infer<typeof GenerateAuthorizationUrlWithPKCESchema>) => {
        const validatedParams = GenerateAuthorizationUrlWithPKCESchema.parse(params);
        return await this.generateAuthorizationUrlWithPKCE(
          {
            scopes: validatedParams.scope,
            state: validatedParams.state,
          },
          validatedParams.output
        );
      }
    );

    // Exchange Code for Token
    server.registerTool(
      'oauth_exchange_code_for_token',
      {
        description: `Troca código de autorização por token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Troca de código por token
- Suporte a PKCE
- Gerenciamento de estado

**Parâmetros:**
- \`code\`: Código de autorização
- \`state\`: Estado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token de acesso.`,
        inputSchema: ExchangeCodeForTokenSchema.shape,
      },
      async (params: z.infer<typeof ExchangeCodeForTokenSchema>) => {
        const validatedParams = ExchangeCodeForTokenSchema.parse(params);
        return await this.exchangeCodeForToken(
          {
            code: validatedParams.code,
            state: validatedParams.state,
          },
          validatedParams.output
        );
      }
    );

    // Generate Implicit Grant URL
    server.registerTool(
      'oauth_generate_implicit_grant_url',
      {
        description: `Gera URL de autorização para fluxo implícito no Bitbucket Cloud.

**Funcionalidades:**
- Geração de URL implícita
- Fluxo simplificado
- Gerenciamento de estado

**Parâmetros:**
- \`client_id\`: ID do cliente (opcional)
- \`redirect_uri\`: URI de redirecionamento (opcional)
- \`scope\`: Escopo de permissões (opcional)
- \`state\`: Estado personalizado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com a URL de autorização implícita.`,
        inputSchema: GenerateAuthorizationUrlSchema.shape,
      },
      async (params: z.infer<typeof GenerateAuthorizationUrlSchema>) => {
        const validatedParams = GenerateAuthorizationUrlSchema.parse(params);
        return await this.generateImplicitGrantUrl(
          {
            scopes: validatedParams.scope,
            state: validatedParams.state,
          },
          validatedParams.output
        );
      }
    );

    // Parse Implicit Grant Response
    server.registerTool(
      'oauth_parse_implicit_grant_response',
      {
        description: `Analisa resposta do fluxo implícito do Bitbucket Cloud.

**Funcionalidades:**
- Análise de fragmento de URL
- Extração de token
- Validação de resposta

**Parâmetros:**
- \`url_fragment\`: Fragmento da URL de resposta
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token extraído.`,
        inputSchema: ParseImplicitGrantResponseSchema.shape,
      },
      async (params: z.infer<typeof ParseImplicitGrantResponseSchema>) => {
        const validatedParams = ParseImplicitGrantResponseSchema.parse(params);
        return await this.parseImplicitGrantResponse(
          {
            url_fragment: validatedParams.url_fragment,
          },
          validatedParams.output
        );
      }
    );

    // Refresh Access Token
    server.registerTool(
      'oauth_refresh_access_token',
      {
        description: `Atualiza token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Atualização de token
- Renovação de sessão
- Gerenciamento de refresh token

**Parâmetros:**
- \`refresh_token\`: Token de atualização
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do novo token de acesso.`,
        inputSchema: RefreshTokenSchema.shape,
      },
      async (params: z.infer<typeof RefreshTokenSchema>) => {
        const validatedParams = RefreshTokenSchema.parse(params);
        return await this.refreshAccessToken(
          {
            refresh_token: validatedParams.refresh_token,
          },
          validatedParams.output
        );
      }
    );

    // Get Client Credentials Token
    server.registerTool(
      'oauth_get_client_credentials_token',
      {
        description: `Obtém token usando credenciais do cliente no Bitbucket Cloud.

**Funcionalidades:**
- Token de credenciais do cliente
- Autenticação de aplicação
- Configuração de escopo

**Parâmetros:**
- \`scope\`: Escopo de permissões (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token de credenciais do cliente.`,
        inputSchema: GetClientCredentialsTokenSchema.shape,
      },
      async (params: z.infer<typeof GetClientCredentialsTokenSchema>) => {
        const validatedParams = GetClientCredentialsTokenSchema.parse(params);
        return await this.getClientCredentialsToken(
          {
            scope: validatedParams.scope,
          },
          validatedParams.output
        );
      }
    );

    // Exchange JWT for Token
    server.registerTool(
      'oauth_exchange_jwt_for_token',
      {
        description: `Troca JWT por token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Troca de JWT por token
- Autenticação específica do Bitbucket
- Gerenciamento de asserção

**Parâmetros:**
- \`jwt_token\`: Token JWT
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token de acesso.`,
        inputSchema: ExchangeJWTForTokenSchema.shape,
      },
      async (params: z.infer<typeof ExchangeJWTForTokenSchema>) => {
        const validatedParams = ExchangeJWTForTokenSchema.parse(params);
        return await this.exchangeJWTForToken(
          {
            jwt_token: validatedParams.jwt_token,
          },
          validatedParams.output
        );
      }
    );

    // Revoke Token
    server.registerTool(
      'oauth_revoke_token',
      {
        description: `Revoga token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Revogação de token
- Limpeza de sessão
- Gerenciamento de segurança

**Parâmetros:**
- \`token\`: Token a ser revogado
- \`token_type_hint\`: Tipo do token (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com confirmação da revogação.`,
        inputSchema: RevokeTokenSchema.shape,
      },
      async (params: z.infer<typeof RevokeTokenSchema>) => {
        const validatedParams = RevokeTokenSchema.parse(params);
        return await this.revokeToken(
          {
            token: validatedParams.token,
            token_type_hint: validatedParams.token_type_hint,
          },
          validatedParams.output
        );
      }
    );

    // Introspect Token
    server.registerTool(
      'oauth_introspect_token',
      {
        description: `Inspeciona token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Inspeção de token
- Validação de estado
- Informações de escopo

**Parâmetros:**
- \`token\`: Token a ser inspecionado
- \`token_type_hint\`: Tipo do token (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da inspeção do token.`,
        inputSchema: IntrospectTokenSchema.shape,
      },
      async (params: z.infer<typeof IntrospectTokenSchema>) => {
        const validatedParams = IntrospectTokenSchema.parse(params);
        return await this.introspectToken(
          {
            token: validatedParams.token,
            token_type_hint: validatedParams.token_type_hint,
          },
          validatedParams.output
        );
      }
    );

    // Validate Token
    server.registerTool(
      'oauth_validate_token',
      {
        description: `Valida token de acesso no Bitbucket Cloud.

**Funcionalidades:**
- Validação de token
- Teste de conectividade
- Verificação de escopo

**Parâmetros:**
- \`token\`: Token a ser validado
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os resultados da validação.`,
        inputSchema: ValidateTokenSchema.shape,
      },
      async (params: z.infer<typeof ValidateTokenSchema>) => {
        const validatedParams = ValidateTokenSchema.parse(params);
        return await this.validateToken(
          {
            token: validatedParams.token,
          },
          validatedParams.output
        );
      }
    );

    // Get Authorization Server Metadata
    server.registerTool(
      'oauth_get_authorization_server_metadata',
      {
        description: `Obtém metadados do servidor de autorização do Bitbucket Cloud.

**Funcionalidades:**
- Metadados do servidor
- Configurações OAuth
- Informações de endpoints

**Parâmetros:**
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os metadados do servidor de autorização.`,
        inputSchema: GetOAuthConfigurationSchema.shape,
      },
      async (params: z.infer<typeof GetOAuthConfigurationSchema>) => {
        const validatedParams = GetOAuthConfigurationSchema.parse(params);
        return await this.getAuthorizationServerMetadata(validatedParams.output);
      }
    );

    // Start Device Flow
    server.registerTool(
      'oauth_start_device_flow',
      {
        description: `Inicia fluxo de dispositivo OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Início de fluxo de dispositivo
- Geração de códigos
- Configuração de escopo

**Parâmetros:**
- \`scope\`: Escopo de permissões (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do fluxo de dispositivo.`,
        inputSchema: StartDeviceFlowSchema.shape,
      },
      async (params: z.infer<typeof StartDeviceFlowSchema>) => {
        const validatedParams = StartDeviceFlowSchema.parse(params);
        return await this.startDeviceFlow(
          {
            scope: validatedParams.scope,
          },
          validatedParams.output
        );
      }
    );

    // Poll Device Flow Token
    server.registerTool(
      'oauth_poll_device_flow_token',
      {
        description: `Sondagem para token do fluxo de dispositivo no Bitbucket Cloud.

**Funcionalidades:**
- Sondagem de token
- Verificação de autorização
- Configuração de intervalo

**Parâmetros:**
- \`device_code\`: Código do dispositivo
- \`interval\`: Intervalo de sondagem (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes do token obtido.`,
        inputSchema: PollDeviceFlowTokenSchema.shape,
      },
      async (params: z.infer<typeof PollDeviceFlowTokenSchema>) => {
        const validatedParams = PollDeviceFlowTokenSchema.parse(params);
        return await this.pollDeviceFlowToken(
          {
            device_code: validatedParams.device_code,
            interval: validatedParams.interval,
          },
          validatedParams.output
        );
      }
    );

    // Create Session
    server.registerTool(
      'oauth_create_session',
      {
        description: `Cria sessão OAuth no Bitbucket Cloud.

**Funcionalidades:**
- Criação de sessão
- Gerenciamento de tokens
- Configuração de estado

**Parâmetros:**
- \`access_token\`: Token de acesso
- \`refresh_token\`: Token de atualização (opcional)
- \`token_type\`: Tipo do token (opcional)
- \`expires_in\`: Tempo de expiração (opcional)
- \`scope\`: Escopo (opcional)
- \`state\`: Estado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da sessão criada.`,
        inputSchema: CreateSessionSchema.shape,
      },
      async (params: z.infer<typeof CreateSessionSchema>) => {
        const validatedParams = CreateSessionSchema.parse(params);

        const tokenResponse = {
          access_token: validatedParams.access_token,
          refresh_token: validatedParams.refresh_token,
          token_type: validatedParams.token_type || 'Bearer',
          expires_in: validatedParams.expires_in || 3600,
          scope: validatedParams.scope,
        };

        return await this.createSession(
          {
            tokenResponse,
            state: validatedParams.state,
          },
          validatedParams.output
        );
      }
    );

    // Check Session Expired
    server.registerTool(
      'oauth_is_session_expired',
      {
        description: `Verifica se sessão OAuth está expirada no Bitbucket Cloud.

**Funcionalidades:**
- Verificação de expiração
- Validação de tempo
- Gerenciamento de sessão

**Parâmetros:**
- \`access_token\`: Token de acesso
- \`expires_at\`: Timestamp de expiração
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com o status de expiração da sessão.`,
        inputSchema: IsSessionExpiredSchema.shape,
      },
      async (params: z.infer<typeof IsSessionExpiredSchema>) => {
        const validatedParams = IsSessionExpiredSchema.parse(params);

        const session = {
          access_token: validatedParams.access_token,
          expires_at: validatedParams.expires_at,
        } as any;

        return await this.isSessionExpired(
          {
            session,
          },
          validatedParams.output
        );
      }
    );

    // Refresh Session If Needed
    server.registerTool(
      'oauth_refresh_session_if_needed',
      {
        description: `Atualiza sessão OAuth se necessário no Bitbucket Cloud.

**Funcionalidades:**
- Atualização automática
- Verificação de expiração
- Gerenciamento de refresh token

**Parâmetros:**
- \`access_token\`: Token de acesso
- \`refresh_token\`: Token de atualização
- \`expires_at\`: Timestamp de expiração
- \`token_type\`: Tipo do token (opcional)
- \`scope\`: Escopo (opcional)
- \`state\`: Estado (opcional)
- \`output\`: Formato de saída - 'markdown' ou 'json' (padrão)

**Retorna:** Objeto com content contendo array de objetos com type: 'text' e text com os detalhes da sessão atualizada.`,
        inputSchema: RefreshSessionIfNeededSchema.shape,
      },
      async (params: z.infer<typeof RefreshSessionIfNeededSchema>) => {
        const validatedParams = RefreshSessionIfNeededSchema.parse(params);

        const session = {
          access_token: validatedParams.access_token,
          refresh_token: validatedParams.refresh_token,
          expires_at: validatedParams.expires_at,
          token_type: validatedParams.token_type || 'Bearer',
          scope: validatedParams.scope,
          state: validatedParams.state,
        } as any;

        return await this.refreshSessionIfNeeded(
          {
            session,
          },
          validatedParams.output
        );
      }
    );

    registerLogger.info('Successfully registered all cloud OAuth tools');
  }
}
