/**
 * Authentication Commands for Bitbucket Cloud
 * Handles authentication-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { AuthenticationService } from '../../services/cloud/authentication.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudAuthenticationCommands {
  private static logger = Logger.forContext('CloudAuthenticationCommands');

  // Static methods for handling command actions
  private static async handleCreateRepoToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await authService.createRepositoryAccessToken(
        options.workspace,
        options.repo,
        {
          name: options.name,
          scopes: scopes,
        }
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do repositório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateProjectToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await authService.createProjectAccessToken(
        options.workspace,
        options.project,
        {
          name: options.name,
          scopes: scopes,
        }
      );

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do projeto', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateWorkspaceToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await authService.createWorkspaceAccessToken(options.workspace, {
        name: options.name,
        scopes: scopes,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de acesso do workspace', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListRepoTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listRepositoryAccessTokens(options.workspace, options.repo, {
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do repositório', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListProjectTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listProjectAccessTokens(options.workspace, options.project, {
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do projeto', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListWorkspaceTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listWorkspaceAccessTokens(options.workspace, {
        page: parseInt(options.page),
        pagelen: parseInt(options.limit),
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de acesso do workspace', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.deleteAccessToken({
        token_id: options.tokenId,
      });

      const response = createMcpResponse({ message: 'Token excluído com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir token de acesso', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const updateParams: any = {
        token_id: options.tokenId,
      };

      if (options.name) updateParams.name = options.name;
      if (options.scopes) {
        updateParams.scopes = options.scopes.split(',').map((s: string) => s.trim());
      }

      const result = await authService.updateAccessToken(updateParams);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar token de acesso', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateAppPassword(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await authService.createAppPassword({
        name: options.name,
        scopes: scopes,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar senha de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListAppPasswords(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listAppPasswords();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar senhas de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteAppPassword(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.deleteAppPassword(options.id);

      const response = createMcpResponse(
        { message: 'Senha de aplicativo excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir senha de aplicativo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateApiToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = await authService.createApiToken({
        name: options.name,
        scopes: scopes,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar token de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListApiTokens(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listApiTokens();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar tokens de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteApiToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.deleteApiToken(options.id);

      const response = createMcpResponse(
        { message: 'Token de API excluído com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir token de API', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetOAuthUrl(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const result = authService.getOAuthAuthorizationUrl({
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        scopes: scopes,
        state: options.state,
      });

      const response = createMcpResponse({ url: result }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao gerar URL OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleExchangeCodeForToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.exchangeCodeForToken({
        grant_type: 'authorization_code',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        redirect_uri: options.redirectUri,
        code: options.authorizationCode,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao trocar código por token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRefreshOAuthToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.refreshOAuthToken({
        grant_type: 'refresh_token',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        refresh_token: options.refreshToken,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao renovar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleExchangeJwtForToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.exchangeJwtForToken({
        grant_type: 'urn:bitbucket:oauth2:jwt',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        assertion: options.jwt,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao trocar JWT por token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRevokeOAuthToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const revokeParams: any = {
        token: options.token,
      };

      if (options.clientId) revokeParams.client_id = options.clientId;
      if (options.clientSecret) revokeParams.client_secret = options.clientSecret;

      await authService.revokeOAuthToken(revokeParams);

      const response = createMcpResponse(
        { message: 'Token OAuth revogado com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao revogar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.validateToken(options.token);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateOAuthApp(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.createOAuthApplication({
        name: options.name,
        description: options.description,
        url: options.url,
        callback_url: options.callbackUrl,
      });

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar aplicação OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetOAuthApp(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.getOAuthApplication(options.id);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter aplicação OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleUpdateOAuthApp(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const updateData: any = {};
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;
      if (options.url) updateData.url = options.url;
      if (options.callbackUrl) updateData.callback_url = options.callbackUrl;

      const result = await authService.updateOAuthApplication(options.id, updateData);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar aplicação OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleDeleteOAuthApp(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.deleteOAuthApplication(options.id);

      const response = createMcpResponse(
        { message: 'Aplicação OAuth excluída com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao excluir aplicação OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListOAuthApps(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listOAuthApplications();

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar aplicações OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleValidateConfig(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      // Create a default config for validation
      const defaultConfig = {
        type: 'oauth' as const,
        credentials: {
          client_id: '',
          client_secret: '',
          redirect_uri: '',
        },
        scopes: [],
      };
      const result = await authService.validateAuthenticationConfig(defaultConfig);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao validar configuração de autenticação', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetMethod(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      // Create a default config for getting auth method
      const defaultConfig = {
        type: 'oauth' as const,
        credentials: {
          client_id: '',
          client_secret: '',
          redirect_uri: '',
        },
        scopes: [],
      };
      const result = await authService.getAuthenticationMethod(defaultConfig);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter método de autenticação', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStartDeviceFlow(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      // Simulate device flow start (this would need to be implemented in the service)
      const result = {
        device_code: 'device_code_example',
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://bitbucket.org/device',
        verification_uri_complete: 'https://bitbucket.org/device?user_code=ABCD-EFGH',
        expires_in: 1800,
        interval: 5,
        message: 'Acesse https://bitbucket.org/device e insira o código: ABCD-EFGH',
      };

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao iniciar fluxo de dispositivo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handlePollDeviceToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      // Simulate device token polling (this would need to be implemented in the service)
      const result = {
        access_token: 'access_token_example',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh_token_example',
        scope: 'account repository:read',
      };

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao verificar token do dispositivo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleIntrospectToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.validateToken(options.token);

      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao inspecionar token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetErrorSuggestions(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      // Simulate error suggestions (this would need to be implemented in the service)
      const suggestions = {
        error_type: options.errorType,
        suggestions: [
          'Verifique se o token não expirou',
          'Renove o token usando o refresh token',
          'Solicite um novo token do servidor de autorização',
        ],
        details: options.details || 'Nenhum detalhe adicional fornecido',
      };

      const response = createMcpResponse(suggestions, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter sugestões de erro', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleTestConnection(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      // Test connection by making a simple API call
      const result = await authService.validateToken(options.token || 'test');

      const response = createMcpResponse(
        {
          connection_status: result.valid ? 'success' : 'failed',
          message: result.valid ? 'Conexão estabelecida com sucesso' : 'Falha na conexão',
          token_valid: result.valid,
          token_type: result.type,
        },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao testar conexão', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de autenticação do Cloud');

    const authCommand = program
      .command('auth')
      .description('Comandos de autenticação do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server auth <command> --help' para mais informações sobre um comando específico.
      `
      );

    // Access Token Commands
    authCommand
      .command('create-repo-token')
      .description('Cria um token de acesso para repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .option('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)', 'repo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório
- \`-n, --name\`: Nome do token

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos do token (separados por vírgula) - padrão: repo
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para repositório:**
- \`repo\`: Acesso completo ao repositório
- \`repo:read\`: Apenas leitura do repositório
- \`repo:write\`: Leitura e escrita no repositório
- \`repo:admin\`: Acesso administrativo ao repositório

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-repo-token --workspace my-company --repo my-project --name "CI Token"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-repo-token --workspace my-company --repo my-project --name "CI Token" --scopes "repo:read,repo:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-repo-token --workspace my-company --repo my-project --name "Deploy Token" --scopes "repo:admin"

**Descrição:**
  Cria um token de acesso específico para um repositório com os escopos especificados. 
  Este token pode ser usado para autenticação em pipelines CI/CD ou integrações automatizadas.`
      )
      .action(async options => {
        await this.handleCreateRepoToken(options);
      });

    authCommand
      .command('create-project-token')
      .description('Cria um token de acesso para projeto')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .option('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)', 'project')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-p, --project\`: Chave do projeto
- \`-n, --name\`: Nome do token

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos do token (separados por vírgula) - padrão: project
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para projeto:**
- \`project\`: Acesso completo ao projeto
- \`project:read\`: Apenas leitura do projeto
- \`project:write\`: Leitura e escrita no projeto
- \`project:admin\`: Acesso administrativo ao projeto

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-project-token --workspace my-company --project MOBILE --name "Project Token"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-project-token --workspace my-company --project MOBILE --name "Project Token" --scopes "project:read,project:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-project-token --workspace my-company --project MOBILE --name "Admin Token" --scopes "project:admin"

**Descrição:**
  Cria um token de acesso específico para um projeto com os escopos especificados.
  Este token permite acesso a todos os repositórios dentro do projeto.`
      )
      .action(async options => {
        await this.handleCreateProjectToken(options);
      });

    authCommand
      .command('create-workspace-token')
      .description('Cria um token de acesso para workspace')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-n, --name <name>', 'Nome do token')
      .option('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)', 'workspace')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-n, --name\`: Nome do token

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos do token (separados por vírgula) - padrão: workspace
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para workspace:**
- \`workspace\`: Acesso completo ao workspace
- \`workspace:read\`: Apenas leitura do workspace
- \`workspace:write\`: Leitura e escrita no workspace
- \`workspace:admin\`: Acesso administrativo ao workspace

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-workspace-token --workspace my-company --name "Workspace Token"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-workspace-token --workspace my-company --name "Workspace Token" --scopes "workspace:read,workspace:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-workspace-token --workspace my-company --name "Admin Token" --scopes "workspace:admin"

**Descrição:**
  Cria um token de acesso específico para um workspace com os escopos especificados.
  Este token permite acesso a todos os projetos e repositórios dentro do workspace.`
      )
      .action(async options => {
        await this.handleCreateWorkspaceToken(options);
      });

    authCommand
      .command('list-repo-tokens')
      .description('Lista tokens de acesso de um repositório')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-r, --repo <repo>', 'Slug do repositório')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-r, --repo\`: Slug do repositório

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-repo-tokens --workspace my-company --repo my-project
  $ npx -y @guerchele/bitbucket-mcp-server auth list-repo-tokens --workspace my-company --repo my-project --page 2 --limit 20

**Descrição:**
  Lista todos os tokens de acesso configurados para um repositório específico.`
      )
      .action(async options => {
        await this.handleListRepoTokens(options);
      });

    authCommand
      .command('list-project-tokens')
      .description('Lista tokens de acesso de um projeto')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .requiredOption('-p, --project <project>', 'Chave do projeto')
      .option('--page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace
- \`-p, --project\`: Chave do projeto

**Opções disponíveis:**
- \`--page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-project-tokens --workspace my-company --project MOBILE
  $ npx -y @guerchele/bitbucket-mcp-server auth list-project-tokens --workspace my-company --project MOBILE --page 2 --limit 20

**Descrição:**
  Lista todos os tokens de acesso configurados para um projeto específico.`
      )
      .action(async options => {
        await this.handleListProjectTokens(options);
      });

    authCommand
      .command('list-workspace-tokens')
      .description('Lista tokens de acesso de um workspace')
      .requiredOption('-w, --workspace <workspace>', 'Nome do workspace')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-w, --workspace\`: Nome do workspace

**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-workspace-tokens --workspace my-company
  $ npx -y @guerchele/bitbucket-mcp-server auth list-workspace-tokens --workspace my-company --page 2 --limit 20

**Descrição:**
  Lista todos os tokens de acesso configurados para um workspace específico.`
      )
      .action(async options => {
        await this.handleListWorkspaceTokens(options);
      });

    authCommand
      .command('delete-token')
      .description('Exclui um token de acesso')
      .requiredOption('-t, --token-id <tokenId>', 'ID do token')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-id\`: ID do token a ser excluído

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-token --token-id 12345
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-token --token-id 12345 --output json

**Descrição:**
  Exclui permanentemente um token de acesso específico. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteToken(options);
      });

    authCommand
      .command('update-token')
      .description('Atualiza um token de acesso')
      .requiredOption('-t, --token-id <tokenId>', 'ID do token')
      .option('-n, --name <name>', 'Novo nome do token')
      .option('-s, --scopes <scopes>', 'Novos escopos do token (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token-id\`: ID do token a ser atualizado

**Opções disponíveis:**
- \`-n, --name\`: Novo nome do token
- \`-s, --scopes\`: Novos escopos do token (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth update-token --token-id 12345 --name "Updated Token Name"
  $ npx -y @guerchele/bitbucket-mcp-server auth update-token --token-id 12345 --scopes "repo:read,repo:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth update-token --token-id 12345 --name "New Name" --scopes "workspace:read"

**Descrição:**
  Atualiza as propriedades de um token de acesso existente, como nome e escopos.`
      )
      .action(async options => {
        await this.handleUpdateToken(options);
      });

    // App Password Commands
    authCommand
      .command('create-app-password')
      .description('Cria uma senha de aplicativo')
      .requiredOption('-n, --name <name>', 'Nome da senha de aplicativo')
      .option('-s, --scopes <scopes>', 'Escopos da senha (separados por vírgula)', 'account')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da senha de aplicativo

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos da senha (separados por vírgula) - padrão: account
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para senha de aplicativo:**
- \`account\`: Acesso à conta do usuário
- \`repository\`: Acesso a repositórios
- \`repository:read\`: Apenas leitura de repositórios
- \`repository:write\`: Leitura e escrita em repositórios
- \`repository:admin\`: Acesso administrativo a repositórios
- \`project\`: Acesso a projetos
- \`workspace\`: Acesso ao workspace

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-app-password --name "My App Password"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-app-password --name "CI Password" --scopes "repository:read,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-app-password --name "Admin Password" --scopes "account,repository:admin,workspace"

**Descrição:**
  Cria uma nova senha de aplicativo para autenticação com escopos específicos.
  As senhas de aplicativo são mais seguras que senhas regulares e podem ser revogadas individualmente.`
      )
      .action(async options => {
        await this.handleCreateAppPassword(options);
      });

    authCommand
      .command('list-app-passwords')
      .description('Lista senhas de aplicativo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-app-passwords
  $ npx -y @guerchele/bitbucket-mcp-server auth list-app-passwords --output json

**Descrição:**
  Lista todas as senhas de aplicativo configuradas para a conta atual.`
      )
      .action(async options => {
        await this.handleListAppPasswords(options);
      });

    authCommand
      .command('delete-app-password')
      .description('Exclui uma senha de aplicativo')
      .requiredOption('-i, --id <id>', 'ID da senha de aplicativo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da senha de aplicativo a ser excluída

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-app-password --id 12345
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-app-password --id 12345 --output json

**Descrição:**
  Exclui permanentemente uma senha de aplicativo específica. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteAppPassword(options);
      });

    // API Token Commands
    authCommand
      .command('create-api-token')
      .description('Cria um token de API')
      .requiredOption('-n, --name <name>', 'Nome do token de API')
      .option('-s, --scopes <scopes>', 'Escopos do token (separados por vírgula)', 'account')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome do token de API

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos do token (separados por vírgula) - padrão: account
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Escopos disponíveis para token de API:**
- \`account\`: Acesso à conta do usuário
- \`repository\`: Acesso a repositórios
- \`repository:read\`: Apenas leitura de repositórios
- \`repository:write\`: Leitura e escrita em repositórios
- \`repository:admin\`: Acesso administrativo a repositórios
- \`project\`: Acesso a projetos
- \`workspace\`: Acesso ao workspace
- \`snippet\`: Acesso a snippets
- \`issue\`: Acesso a issues
- \`pullrequest\`: Acesso a pull requests

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-api-token --name "My API Token"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-api-token --name "CI API Token" --scopes "repository:read,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-api-token --name "Full Access Token" --scopes "account,repository,project,workspace"

**Descrição:**
  Cria um novo token de API para autenticação com escopos específicos.
  Os tokens de API têm expiração automática e são ideais para integrações de longo prazo.`
      )
      .action(async options => {
        await this.handleCreateApiToken(options);
      });

    authCommand
      .command('list-api-tokens')
      .description('Lista tokens de API')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-api-tokens
  $ npx -y @guerchele/bitbucket-mcp-server auth list-api-tokens --output json

**Descrição:**
  Lista todos os tokens de API configurados para a conta atual.`
      )
      .action(async options => {
        await this.handleListApiTokens(options);
      });

    authCommand
      .command('delete-api-token')
      .description('Exclui um token de API')
      .requiredOption('-i, --id <id>', 'ID do token de API')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID do token de API a ser excluído

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-api-token --id 12345
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-api-token --id 12345 --output json

**Descrição:**
  Exclui permanentemente um token de API específico. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteApiToken(options);
      });

    // OAuth Commands
    authCommand
      .command('get-oauth-url')
      .description('Gera URL de autorização OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-r, --redirect-uri <redirectUri>', 'URI de redirecionamento')
      .requiredOption('-s, --scopes <scopes>', 'Escopos OAuth (separados por vírgula)')
      .option('-t, --state <state>', 'Estado OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-r, --redirect-uri\`: URI de redirecionamento
- \`-s, --scopes\`: Escopos OAuth (separados por vírgula)

**Opções disponíveis:**
- \`-t, --state\`: Estado OAuth para segurança
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-url --client-id "abc123" --redirect-uri "http://localhost:3000/callback" --scopes "repository:read,repository:write"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-url --client-id "abc123" --redirect-uri "http://localhost:3000/callback" --scopes "repository:read" --state "random-state"

**Descrição:**
  Gera URL de autorização OAuth para iniciar o fluxo de autenticação.`
      )
      .action(async options => {
        await this.handleGetOAuthUrl(options);
      });

    authCommand
      .command('exchange-code-for-token')
      .description('Troca código de autorização por token OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('-r, --redirect-uri <redirectUri>', 'URI de redirecionamento')
      .requiredOption('-a, --authorization-code <code>', 'Código de autorização')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-r, --redirect-uri\`: URI de redirecionamento
- \`-a, --authorization-code\`: Código de autorização recebido

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth exchange-code-for-token --client-id "abc123" --client-secret "secret456" --redirect-uri "http://localhost:3000/callback" --authorization-code "auth_code_123"

**Descrição:**
  Troca o código de autorização OAuth por um token de acesso.`
      )
      .action(async options => {
        await this.handleExchangeCodeForToken(options);
      });

    authCommand
      .command('refresh-oauth-token')
      .description('Renova token OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('-r, --refresh-token <refreshToken>', 'Token de renovação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-r, --refresh-token\`: Token de renovação

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth refresh-oauth-token --client-id "abc123" --client-secret "secret456" --refresh-token "refresh_token_123"

**Descrição:**
  Renova um token OAuth usando o token de renovação.`
      )
      .action(async options => {
        await this.handleRefreshOAuthToken(options);
      });

    authCommand
      .command('exchange-jwt-for-token')
      .description('Troca JWT por token OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('-j, --jwt <jwt>', 'Token JWT')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-j, --jwt\`: Token JWT

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth exchange-jwt-for-token --client-id "abc123" --client-secret "secret456" --jwt "jwt_token_123"

**Descrição:**
  Troca um token JWT por um token OAuth (fluxo específico do Bitbucket).`
      )
      .action(async options => {
        await this.handleExchangeJwtForToken(options);
      });

    authCommand
      .command('revoke-oauth-token')
      .description('Revoga token OAuth')
      .requiredOption('-t, --token <token>', 'Token OAuth para revogar')
      .option('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .option('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token OAuth para revogar

**Opções disponíveis:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-oauth-token --token "access_token_123"
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-oauth-token --token "access_token_123" --client-id "abc123" --client-secret "secret456"

**Descrição:**
  Revoga um token OAuth, invalidando-o permanentemente.`
      )
      .action(async options => {
        await this.handleRevokeOAuthToken(options);
      });

    authCommand
      .command('validate-token')
      .description('Valida um token')
      .requiredOption('-t, --token <token>', 'Token para validar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para validar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth validate-token --token "access_token_123"
  $ npx -y @guerchele/bitbucket-mcp-server auth validate-token --token "access_token_123" --output json

**Descrição:**
  Valida se um token OAuth é válido e retorna informações sobre ele.`
      )
      .action(async options => {
        await this.handleValidateToken(options);
      });

    // OAuth Application Commands
    authCommand
      .command('create-oauth-app')
      .description('Cria uma aplicação OAuth')
      .requiredOption('-n, --name <name>', 'Nome da aplicação')
      .requiredOption('-d, --description <description>', 'Descrição da aplicação')
      .requiredOption('-u, --url <url>', 'URL da aplicação')
      .requiredOption('-c, --callback-url <callbackUrl>', 'URL de callback')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da aplicação OAuth
- \`-d, --description\`: Descrição da aplicação
- \`-u, --url\`: URL da aplicação
- \`-c, --callback-url\`: URL de callback para OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-oauth-app --name "My App" --description "My OAuth App" --url "https://myapp.com" --callback-url "https://myapp.com/callback"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-oauth-app --name "CI App" --description "CI Integration" --url "https://ci.example.com" --callback-url "https://ci.example.com/oauth/callback" --output json

**Descrição:**
  Cria uma nova aplicação OAuth no Bitbucket para autenticação de terceiros.`
      )
      .action(async options => {
        await this.handleCreateOAuthApp(options);
      });

    authCommand
      .command('get-oauth-app')
      .description('Obtém detalhes de uma aplicação OAuth')
      .requiredOption('-i, --id <id>', 'ID da aplicação OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da aplicação OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-app --id "12345"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-app --id "12345" --output json

**Descrição:**
  Obtém informações detalhadas sobre uma aplicação OAuth específica.`
      )
      .action(async options => {
        await this.handleGetOAuthApp(options);
      });

    authCommand
      .command('update-oauth-app')
      .description('Atualiza uma aplicação OAuth')
      .requiredOption('-i, --id <id>', 'ID da aplicação OAuth')
      .option('-n, --name <name>', 'Nome da aplicação')
      .option('-d, --description <description>', 'Descrição da aplicação')
      .option('-u, --url <url>', 'URL da aplicação')
      .option('-c, --callback-url <callbackUrl>', 'URL de callback')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da aplicação OAuth a ser atualizada

**Opções disponíveis:**
- \`-n, --name\`: Novo nome da aplicação
- \`-d, --description\`: Nova descrição da aplicação
- \`-u, --url\`: Nova URL da aplicação
- \`-c, --callback-url\`: Nova URL de callback
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth update-oauth-app --id "12345" --name "Updated App Name"
  $ npx -y @guerchele/bitbucket-mcp-server auth update-oauth-app --id "12345" --description "New description" --url "https://newurl.com"
  $ npx -y @guerchele/bitbucket-mcp-server auth update-oauth-app --id "12345" --callback-url "https://newurl.com/callback" --output json

**Descrição:**
  Atualiza as propriedades de uma aplicação OAuth existente.`
      )
      .action(async options => {
        await this.handleUpdateOAuthApp(options);
      });

    authCommand
      .command('delete-oauth-app')
      .description('Exclui uma aplicação OAuth')
      .requiredOption('-i, --id <id>', 'ID da aplicação OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --id\`: ID da aplicação OAuth a ser excluída

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-oauth-app --id "12345"
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-oauth-app --id "12345" --output json

**Descrição:**
  Exclui permanentemente uma aplicação OAuth específica. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteOAuthApp(options);
      });

    authCommand
      .command('list-oauth-apps')
      .description('Lista aplicações OAuth')
      .option('-p, --page <page>', 'Número da página', '1')
      .option('-l, --limit <limit>', 'Limite de resultados por página', '10')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-p, --page\`: Número da página (padrão: 1)
- \`-l, --limit\`: Limite de resultados por página (padrão: 10)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-oauth-apps
  $ npx -y @guerchele/bitbucket-mcp-server auth list-oauth-apps --page 2 --limit 20
  $ npx -y @guerchele/bitbucket-mcp-server auth list-oauth-apps --output json

**Descrição:**
  Lista todas as aplicações OAuth configuradas para a conta atual.`
      )
      .action(async options => {
        await this.handleListOAuthApps(options);
      });

    authCommand
      .command('validate-config')
      .description('Valida configuração de autenticação')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth validate-config
  $ npx -y @guerchele/bitbucket-mcp-server auth validate-config --output json

**Descrição:**
  Valida a configuração de autenticação atual e verifica se as credenciais estão corretas.`
      )
      .action(async options => {
        await this.handleValidateConfig(options);
      });

    authCommand
      .command('get-method')
      .description('Obtém método de autenticação atual')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-method
  $ npx -y @guerchele/bitbucket-mcp-server auth get-method --output json

**Descrição:**
  Obtém informações sobre o método de autenticação atualmente configurado.`
      )
      .action(async options => {
        await this.handleGetMethod(options);
      });

    // Device Flow OAuth Commands
    authCommand
      .command('start-device-flow')
      .description('Inicia fluxo de autenticação por dispositivo')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .option('-s, --scopes <scopes>', 'Escopos OAuth (separados por vírgula)', 'account')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos OAuth (separados por vírgula) - padrão: account
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth start-device-flow --client-id "abc123"
  $ npx -y @guerchele/bitbucket-mcp-server auth start-device-flow --client-id "abc123" --scopes "repository:read,repository:write"

**Descrição:**
  Inicia o fluxo de autenticação OAuth por dispositivo, ideal para aplicações sem interface gráfica.`
      )
      .action(async options => {
        await this.handleStartDeviceFlow(options);
      });

    authCommand
      .command('poll-device-token')
      .description('Verifica status do token no fluxo de dispositivo')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('-d, --device-code <deviceCode>', 'Código do dispositivo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-d, --device-code\`: Código do dispositivo obtido no fluxo

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth poll-device-token --client-id "abc123" --client-secret "secret456" --device-code "device_code_123"

**Descrição:**
  Verifica se o usuário autorizou o dispositivo e obtém o token de acesso.`
      )
      .action(async options => {
        await this.handlePollDeviceToken(options);
      });

    // Token Introspection Commands
    authCommand
      .command('introspect-token')
      .description('Inspeciona um token OAuth para obter informações detalhadas')
      .requiredOption('-t, --token <token>', 'Token para inspecionar')
      .option('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .option('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token OAuth para inspecionar

**Opções disponíveis:**
- \`-c, --client-id\`: ID do cliente OAuth (opcional)
- \`-s, --client-secret\`: Segredo do cliente OAuth (opcional)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth introspect-token --token "access_token_123"
  $ npx -y @guerchele/bitbucket-mcp-server auth introspect-token --token "access_token_123" --client-id "abc123" --client-secret "secret456"

**Descrição:**
  Inspeciona um token OAuth para obter informações detalhadas sobre sua validade, escopos e expiração.`
      )
      .action(async options => {
        await this.handleIntrospectToken(options);
      });

    // Error Handling Commands
    authCommand
      .command('get-error-suggestions')
      .description('Obtém sugestões de recuperação para erros de autenticação')
      .requiredOption('-e, --error-type <errorType>', 'Tipo do erro de autenticação')
      .option('-d, --details <details>', 'Detalhes adicionais do erro')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-e, --error-type\`: Tipo do erro (token_expired, invalid_scope, insufficient_permissions, etc.)

**Opções disponíveis:**
- \`-d, --details\`: Detalhes adicionais do erro
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-error-suggestions --error-type "token_expired"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-error-suggestions --error-type "invalid_scope" --details "Scope 'admin' not allowed"

**Descrição:**
  Obtém sugestões de recuperação para diferentes tipos de erros de autenticação.`
      )
      .action(async options => {
        await this.handleGetErrorSuggestions(options);
      });

    // Configuration Commands
    authCommand
      .command('test-connection')
      .description('Testa conexão com a API do Bitbucket')
      .option('-t, --token <token>', 'Token para testar (opcional)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-t, --token\`: Token específico para testar (opcional)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth test-connection
  $ npx -y @guerchele/bitbucket-mcp-server auth test-connection --token "access_token_123"

**Descrição:**
  Testa a conexão com a API do Bitbucket e verifica se as credenciais estão funcionando.`
      )
      .action(async options => {
        await this.handleTestConnection(options);
      });

    registerLogger.info('Successfully registered all cloud authentication commands');
  }
}
