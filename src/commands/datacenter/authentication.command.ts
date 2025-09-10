/**
 * Data Center Authentication Commands
 * CLI commands for Bitbucket Data Center Authentication Service
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { ApiClient } from '../../utils/api-client.util.js';
import { AuthenticationService } from '../../services/datacenter/authentication.service.js';
import { createMcpResponse } from '../../services/types/base.types.js';

export class DataCenterAuthenticationCommands {
  private static logger = Logger.forContext('DataCenterAuthenticationCommands');

  private static async handleGetOAuthToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.getOAuthToken({
        grant_type: 'authorization_code',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        redirect_uri: options.redirectUri,
        code: options.authorizationCode,
      });
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter token OAuth', { error, options });
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

      const result = await authService.refreshOAuthToken(
        options.refreshToken,
        options.clientId,
        options.clientSecret
      );
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetAuthorizationUrl(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = authService.getOAuthAuthorizationUrl({
        response_type: 'code',
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        scope: options.scope,
        state: options.state,
      });
      const response = createMcpResponse({ url: result }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao gerar URL de autorização OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetTokenInfo(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.getAccessTokenInfo(options.token);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter informações do token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRevokeToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.revokeAccessToken(options.token);
      const response = createMcpResponse({ message: 'Token revogado com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao revogar token', { error, options });
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
        redirect_uris: [options.redirectUri],
        scopes: ['REPO_READ', 'REPO_WRITE'],
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

      const result = await authService.getOAuthApplication(options.appId);
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

      const result = await authService.updateOAuthApplication(options.appId, {
        name: options.name,
        description: options.description,
        redirect_uris: [options.redirectUri],
        scopes: ['REPO_READ', 'REPO_WRITE'],
      });
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

      await authService.deleteOAuthApplication(options.appId);
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

  private static async handleGetCurrentSession(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.getCurrentSession();
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter sessão atual', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleCreateSession(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.createSession(parseInt(options.userId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao criar sessão', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRefreshSession(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.refreshSession(options.sessionId);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar sessão', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRevokeSession(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      await authService.revokeSession(options.sessionId);
      const response = createMcpResponse(
        { message: 'Sessão revogada com sucesso' },
        options.output
      );
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao revogar sessão', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleListActiveSessions(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const authService = new AuthenticationService(
        apiClient,
        Logger.forContext('AuthenticationService')
      );

      const result = await authService.listActiveSessions(parseInt(options.userId));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao listar sessões ativas', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos de autenticação do Data Center');

    const authCommand = program
      .command('auth')
      .description('Comandos de autenticação do Bitbucket Data Center')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server auth <command> --help' para mais informações sobre um comando específico.
      `
      );

    // OAuth Token Management
    authCommand
      .command('get-oauth-token')
      .description('Obtém token OAuth usando código de autorização')
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
- \`-a, --authorization-code\`: Código de autorização

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-token --client-id abc123 --client-secret secret456 --redirect-uri http://localhost:3000/callback --authorization-code auth789
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-token --client-id abc123 --client-secret secret456 --redirect-uri http://localhost:3000/callback --authorization-code auth789 --output json

**Descrição:**
  Obtém um token de acesso OAuth usando o código de autorização recebido.`
      )
      .action(async options => {
        await this.handleGetOAuthToken(options);
      });

    authCommand
      .command('refresh-oauth-token')
      .description('Atualiza token OAuth')
      .requiredOption('-r, --refresh-token <refreshToken>', 'Token de atualização')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-r, --refresh-token\`: Token de atualização
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth refresh-oauth-token --refresh-token refresh123 --client-id abc123 --client-secret secret456
  $ npx -y @guerchele/bitbucket-mcp-server auth refresh-oauth-token --refresh-token refresh123 --client-id abc123 --client-secret secret456 --output json

**Descrição:**
  Atualiza um token de acesso OAuth usando o token de atualização.`
      )
      .action(async options => {
        await this.handleRefreshOAuthToken(options);
      });

    authCommand
      .command('get-authorization-url')
      .description('Gera URL de autorização OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-r, --redirect-uri <redirectUri>', 'URI de redirecionamento')
      .requiredOption('-s, --scope <scope>', 'Escopo OAuth')
      .option('-t, --state <state>', 'Estado OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-r, --redirect-uri\`: URI de redirecionamento
- \`-s, --scope\`: Escopo OAuth

**Opções disponíveis:**
- \`-t, --state\`: Estado OAuth
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-authorization-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scope "repository:read"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-authorization-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scope "repository:read" --state "random-state"

**Descrição:**
  Gera uma URL de autorização OAuth para iniciar o fluxo de autenticação.`
      )
      .action(async options => {
        await this.handleGetAuthorizationUrl(options);
      });

    authCommand
      .command('get-token-info')
      .description('Obtém informações do token de acesso')
      .requiredOption('-t, --token <token>', 'Token de acesso')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token de acesso

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-token-info --token "access_token_here"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-token-info --token "access_token_here" --output json

**Descrição:**
  Obtém informações detalhadas sobre um token de acesso, incluindo escopos e expiração.`
      )
      .action(async options => {
        await this.handleGetTokenInfo(options);
      });

    authCommand
      .command('revoke-token')
      .description('Revoga token de acesso')
      .requiredOption('-t, --token <token>', 'Token de acesso para revogar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token de acesso para revogar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-token --token "access_token_here"
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-token --token "access_token_here" --output json

**Descrição:**
  Revoga um token de acesso, tornando-o inválido permanentemente.`
      )
      .action(async options => {
        await this.handleRevokeToken(options);
      });

    // OAuth Application Management
    authCommand
      .command('create-oauth-app')
      .description('Cria aplicação OAuth')
      .requiredOption('-n, --name <name>', 'Nome da aplicação')
      .requiredOption('-d, --description <description>', 'Descrição da aplicação')
      .requiredOption('-r, --redirect-uri <redirectUri>', 'URI de redirecionamento')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-n, --name\`: Nome da aplicação OAuth
- \`-d, --description\`: Descrição da aplicação OAuth
- \`-r, --redirect-uri\`: URI de redirecionamento para OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-oauth-app --name "Minha App" --description "Aplicação de exemplo" --redirect-uri "http://localhost:3000/callback"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-oauth-app --name "Minha App" --description "Aplicação de exemplo" --redirect-uri "http://localhost:3000/callback" --output json

**Descrição:**
  Cria uma nova aplicação OAuth no Bitbucket Data Center com escopos padrão (REPO_READ, REPO_WRITE).`
      )
      .action(async options => {
        await this.handleCreateOAuthApp(options);
      });

    authCommand
      .command('get-oauth-app')
      .description('Obtém aplicação OAuth')
      .requiredOption('-i, --app-id <appId>', 'ID da aplicação OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --app-id\`: ID da aplicação OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-app --app-id "12345"
  $ npx -y @guerchele/bitbucket-mcp-server auth get-oauth-app --app-id "12345" --output json

**Descrição:**
  Obtém informações detalhadas de uma aplicação OAuth específica pelo ID.`
      )
      .action(async options => {
        await this.handleGetOAuthApp(options);
      });

    authCommand
      .command('update-oauth-app')
      .description('Atualiza aplicação OAuth')
      .requiredOption('-i, --app-id <appId>', 'ID da aplicação OAuth')
      .requiredOption('-n, --name <name>', 'Nome da aplicação')
      .requiredOption('-d, --description <description>', 'Descrição da aplicação')
      .requiredOption('-r, --redirect-uri <redirectUri>', 'URI de redirecionamento')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --app-id\`: ID da aplicação OAuth
- \`-n, --name\`: Nome da aplicação OAuth
- \`-d, --description\`: Descrição da aplicação OAuth
- \`-r, --redirect-uri\`: URI de redirecionamento para OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth update-oauth-app --app-id "12345" --name "App Atualizada" --description "Descrição atualizada" --redirect-uri "http://localhost:3000/callback"
  $ npx -y @guerchele/bitbucket-mcp-server auth update-oauth-app --app-id "12345" --name "App Atualizada" --description "Descrição atualizada" --redirect-uri "http://localhost:3000/callback" --output json

**Descrição:**
  Atualiza uma aplicação OAuth existente com novos dados. Mantém os escopos padrão (REPO_READ, REPO_WRITE).`
      )
      .action(async options => {
        await this.handleUpdateOAuthApp(options);
      });

    authCommand
      .command('delete-oauth-app')
      .description('Exclui aplicação OAuth')
      .requiredOption('-i, --app-id <appId>', 'ID da aplicação OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-i, --app-id\`: ID da aplicação OAuth

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-oauth-app --app-id "12345"
  $ npx -y @guerchele/bitbucket-mcp-server auth delete-oauth-app --app-id "12345" --output json

**Descrição:**
  Exclui permanentemente uma aplicação OAuth do Bitbucket Data Center. Esta ação não pode ser desfeita.`
      )
      .action(async options => {
        await this.handleDeleteOAuthApp(options);
      });

    authCommand
      .command('list-oauth-apps')
      .description('Lista aplicações OAuth')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-oauth-apps
  $ npx -y @guerchele/bitbucket-mcp-server auth list-oauth-apps --output json

**Descrição:**
  Lista todas as aplicações OAuth registradas no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListOAuthApps(options);
      });

    // Session Management
    authCommand
      .command('get-current-session')
      .description('Obtém sessão atual do usuário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth get-current-session
  $ npx -y @guerchele/bitbucket-mcp-server auth get-current-session --output json

**Descrição:**
  Obtém informações da sessão atual do usuário autenticado no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleGetCurrentSession(options);
      });

    authCommand
      .command('create-session')
      .description('Cria sessão para usuário')
      .requiredOption('-u, --user-id <userId>', 'ID do usuário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --user-id\`: ID do usuário para criar a sessão

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth create-session --user-id "123"
  $ npx -y @guerchele/bitbucket-mcp-server auth create-session --user-id "123" --output json

**Descrição:**
  Cria uma nova sessão para o usuário especificado no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleCreateSession(options);
      });

    authCommand
      .command('refresh-session')
      .description('Atualiza sessão do usuário')
      .requiredOption('-s, --session-id <sessionId>', 'ID da sessão')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --session-id\`: ID da sessão para atualizar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth refresh-session --session-id "session123"
  $ npx -y @guerchele/bitbucket-mcp-server auth refresh-session --session-id "session123" --output json

**Descrição:**
  Atualiza uma sessão existente, estendendo seu tempo de vida no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleRefreshSession(options);
      });

    authCommand
      .command('revoke-session')
      .description('Revoga sessão do usuário')
      .requiredOption('-s, --session-id <sessionId>', 'ID da sessão')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-s, --session-id\`: ID da sessão para revogar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-session --session-id "session123"
  $ npx -y @guerchele/bitbucket-mcp-server auth revoke-session --session-id "session123" --output json

**Descrição:**
  Revoga uma sessão específica, invalidando-a permanentemente no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleRevokeSession(options);
      });

    authCommand
      .command('list-active-sessions')
      .description('Lista sessões ativas do usuário')
      .requiredOption('-u, --user-id <userId>', 'ID do usuário')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-u, --user-id\`: ID do usuário para listar sessões ativas

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server auth list-active-sessions --user-id "123"
  $ npx -y @guerchele/bitbucket-mcp-server auth list-active-sessions --user-id "123" --output json

**Descrição:**
  Lista todas as sessões ativas para o usuário especificado no Bitbucket Data Center.`
      )
      .action(async options => {
        await this.handleListActiveSessions(options);
      });

    registerLogger.info('Successfully registered all Data Center authentication commands');
  }
}
