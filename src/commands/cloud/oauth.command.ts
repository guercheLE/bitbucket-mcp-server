/**
 * OAuth Commands for Bitbucket Cloud
 * Handles OAuth-related operations
 */

import { Command } from 'commander';
import { Logger } from '../../utils/logger.util.js';
import { createMcpResponse } from '../../services/types/base.types.js';
import { OAuthService } from '../../services/cloud/oauth.service.js';
import { ApiClient } from '../../utils/api-client.util.js';

export class CloudOAuthCommands {
  private static logger = Logger.forContext('CloudOAuthCommands');

  // Métodos estáticos para lidar com ações dos comandos
  private static async handleGetAuthorizationUrl(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: '',
        redirect_uri: options.redirectUri,
        scopes: scopes,
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = oauthService.generateAuthorizationUrl({
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        scope: scopes.join(' '),
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

  private static async handleExchangeCode(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        redirect_uri: options.redirectUri,
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.exchangeCodeForToken(options.authorizationCode);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao trocar código por token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRefreshToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        redirect_uri: '',
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.refreshAccessToken(options.refreshToken);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao atualizar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleRevokeToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      await oauthService.revokeToken(options.token);
      const response = createMcpResponse({ message: 'Token revogado com sucesso' }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao revogar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleIntrospectToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.introspectToken(options.token);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao inspecionar token OAuth', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetAuthorizationUrlPkce(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: '',
        redirect_uri: options.redirectUri,
        scopes: scopes,
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
        use_pkce: true,
      });

      const result = oauthService.generateAuthorizationUrlWithPKCE({
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        scope: scopes.join(' '),
        state: options.state,
      });
      const response = createMcpResponse({ url: result }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao gerar URL de autorização OAuth com PKCE', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetImplicitGrantUrl(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: '',
        redirect_uri: options.redirectUri,
        scopes: scopes,
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = oauthService.generateImplicitGrantUrl({
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        scope: scopes.join(' '),
        state: options.state,
      });
      const response = createMcpResponse({ url: result }, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao gerar URL de Implicit Grant', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleGetClientCredentialsToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        redirect_uri: '',
        scopes: scopes,
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.getClientCredentialsToken(scopes.join(' '));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao obter token Client Credentials', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleExchangeJwtToken(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.exchangeJWTForToken(options.assertion);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao trocar JWT por token', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handleStartDeviceFlow(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const scopes = options.scopes ? options.scopes.split(',').map((s: string) => s.trim()) : [];
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: '',
        redirect_uri: '',
        scopes: scopes,
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.startDeviceFlow(scopes.join(' '));
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao iniciar fluxo de dispositivo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  private static async handlePollDeviceFlow(options: any): Promise<void> {
    try {
      const apiClient = new ApiClient();
      const oauthService = new OAuthService(apiClient, Logger.forContext('OAuthService'), {
        client_id: options.clientId,
        client_secret: '',
        redirect_uri: '',
        scopes: [],
        authorization_endpoint: 'https://bitbucket.org/site/oauth2/authorize',
        token_endpoint: 'https://bitbucket.org/site/oauth2/access_token',
      });

      const result = await oauthService.pollDeviceFlowToken(options.deviceCode);
      const response = createMcpResponse(result, options.output);
      console.log(response.content[0]?.text || '');
    } catch (error) {
      this.logger.error('Erro ao verificar fluxo de dispositivo', { error, options });
      console.error('Erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      process.exit(1);
    }
  }

  static register(program: Command): void {
    const registerLogger = this.logger.forMethod('register');
    registerLogger.info('Iniciando registro de comandos OAuth');

    const oauthCommand = program
      .command('oauth')
      .description('Comandos OAuth do Bitbucket Cloud')
      .addHelpText(
        'after',
        `
Use 'bitbucket-mcp-server oauth <command> --help' para mais informações sobre um comando específico.
      `
      );

    oauthCommand
      .command('get-authorization-url')
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
- \`-t, --state\`: Estado OAuth
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --state "random-state"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --output json

**Descrição:**
  Gera uma URL de autorização OAuth para iniciar o fluxo de autenticação
  com o Bitbucket Cloud.`
      )
      .action(async options => {
        await this.handleGetAuthorizationUrl(options);
      });

    oauthCommand
      .command('exchange-code')
      .description('Troca código de autorização por token')
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
  $ npx -y @guerchele/bitbucket-mcp-server oauth exchange-code --client-id abc123 --client-secret secret456 --redirect-uri http://localhost:3000/callback --authorization-code auth789
  $ npx -y @guerchele/bitbucket-mcp-server oauth exchange-code --client-id abc123 --client-secret secret456 --redirect-uri http://localhost:3000/callback --authorization-code auth789 --output json

**Descrição:**
  Troca um código de autorização por um token de acesso OAuth.`
      )
      .action(async options => {
        await this.handleExchangeCode(options);
      });

    oauthCommand
      .command('refresh-token')
      .description('Atualiza token OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('-r, --refresh-token <refreshToken>', 'Token de atualização')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`-r, --refresh-token\`: Token de atualização

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth refresh-token --client-id abc123 --client-secret secret456 --refresh-token refresh789
  $ npx -y @guerchele/bitbucket-mcp-server oauth refresh-token --client-id abc123 --client-secret secret456 --refresh-token refresh789 --output json

**Descrição:**
  Atualiza um token de acesso OAuth usando o token de atualização.`
      )
      .action(async options => {
        await this.handleRefreshToken(options);
      });

    oauthCommand
      .command('revoke-token')
      .description('Revoga token OAuth')
      .requiredOption('-t, --token <token>', 'Token para revogar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para revogar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth revoke-token --token abc123def456
  $ npx -y @guerchele/bitbucket-mcp-server oauth revoke-token --token abc123def456 --output json

**Descrição:**
  Revoga um token OAuth, invalidando-o permanentemente.`
      )
      .action(async options => {
        await this.handleRevokeToken(options);
      });

    oauthCommand
      .command('introspect-token')
      .description('Inspeciona token OAuth')
      .requiredOption('-t, --token <token>', 'Token para inspecionar')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-t, --token\`: Token para inspecionar

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth introspect-token --token abc123def456
  $ npx -y @guerchele/bitbucket-mcp-server oauth introspect-token --token abc123def456 --output json

**Descrição:**
  Inspeciona um token OAuth para obter informações sobre sua validade e escopos.`
      )
      .action(async options => {
        await this.handleIntrospectToken(options);
      });
    // Additional OAuth Commands
    oauthCommand
      .command('get-authorization-url-pkce')
      .description('Gera URL de autorização OAuth com PKCE')
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
- \`-t, --state\`: Estado OAuth
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url-pkce --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url-pkce --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --state "random-state"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-authorization-url-pkce --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --output json

**Descrição:**
  Gera uma URL de autorização OAuth com PKCE (Proof Key for Code Exchange) para
  maior segurança no fluxo de autenticação. PKCE é recomendado para aplicações
  públicas e SPAs (Single Page Applications).`
      )
      .action(async options => {
        await this.handleGetAuthorizationUrlPkce(options);
      });

    oauthCommand
      .command('get-implicit-grant-url')
      .description('Gera URL de autorização OAuth para Implicit Grant')
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
- \`-t, --state\`: Estado OAuth
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-implicit-grant-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-implicit-grant-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --state "random-state"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-implicit-grant-url --client-id abc123 --redirect-uri http://localhost:3000/callback --scopes "repository,account" --output json

**Descrição:**
  Gera uma URL de autorização OAuth para o fluxo Implicit Grant. Este fluxo
  retorna o token de acesso diretamente na URL após a autorização, sem
  necessidade de trocar código por token. Use com cuidado em aplicações
  que não podem manter segredos de cliente.`
      )
      .action(async options => {
        await this.handleGetImplicitGrantUrl(options);
      });

    oauthCommand
      .command('get-client-credentials-token')
      .description('Obtém token usando Client Credentials Grant')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-s, --client-secret <clientSecret>', 'Segredo do cliente OAuth')
      .requiredOption('--scopes <scopes>', 'Escopos OAuth (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-s, --client-secret\`: Segredo do cliente OAuth
- \`--scopes\`: Escopos OAuth (separados por vírgula)

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-client-credentials-token --client-id abc123 --client-secret secret456 --scopes "repository,account"
  $ npx -y @guerchele/bitbucket-mcp-server oauth get-client-credentials-token --client-id abc123 --client-secret secret456 --scopes "repository,account" --output json

**Descrição:**
  Obtém um token de acesso usando o fluxo Client Credentials Grant. Este fluxo
  é usado para autenticação de aplicação para aplicação, onde não há usuário
  envolvido. Ideal para integrações server-to-server e APIs.`
      )
      .action(async options => {
        await this.handleGetClientCredentialsToken(options);
      });

    oauthCommand
      .command('exchange-jwt-token')
      .description('Troca JWT por token de acesso')
      .requiredOption('-a, --assertion <assertion>', 'Assertion JWT')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-a, --assertion\`: Assertion JWT

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth exchange-jwt-token --assertion eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  $ npx -y @guerchele/bitbucket-mcp-server oauth exchange-jwt-token --assertion eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... --output json

**Descrição:**
  Troca um token JWT (JSON Web Token) por um token de acesso OAuth. Este é um
  fluxo específico do Bitbucket que permite autenticação usando JWT assertions.
  Útil para integrações com sistemas que já possuem autenticação JWT.`
      )
      .action(async options => {
        await this.handleExchangeJwtToken(options);
      });

    oauthCommand
      .command('start-device-flow')
      .description('Inicia fluxo de dispositivo OAuth')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .option('-s, --scopes <scopes>', 'Escopos OAuth (separados por vírgula)')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth

**Opções disponíveis:**
- \`-s, --scopes\`: Escopos OAuth (separados por vírgula)
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth start-device-flow --client-id abc123
  $ npx -y @guerchele/bitbucket-mcp-server oauth start-device-flow --client-id abc123 --scopes "repository,account"
  $ npx -y @guerchele/bitbucket-mcp-server oauth start-device-flow --client-id abc123 --scopes "repository,account" --output json

**Descrição:**
  Inicia o fluxo de dispositivo OAuth (Device Authorization Grant). Este fluxo
  é ideal para aplicações em dispositivos com recursos limitados de entrada,
  como TVs, consoles de jogos ou aplicações IoT. O usuário autoriza o acesso
  em outro dispositivo (como um smartphone) usando um código fornecido.`
      )
      .action(async options => {
        await this.handleStartDeviceFlow(options);
      });

    oauthCommand
      .command('poll-device-flow')
      .description('Verifica status do fluxo de dispositivo')
      .requiredOption('-c, --client-id <clientId>', 'ID do cliente OAuth')
      .requiredOption('-d, --device-code <deviceCode>', 'Código do dispositivo')
      .option('-o, --output <format>', 'Formato de saída (markdown|json)', 'json')
      .addHelpText(
        'after',
        `
**Opções obrigatórias:**
- \`-c, --client-id\`: ID do cliente OAuth
- \`-d, --device-code\`: Código do dispositivo obtido do comando start-device-flow

**Opções disponíveis:**
- \`-o, --output\`: Formato de saída - markdown ou json (padrão)

**Exemplos:**
  $ npx -y @guerchele/bitbucket-mcp-server oauth poll-device-flow --client-id abc123 --device-code device123456
  $ npx -y @guerchele/bitbucket-mcp-server oauth poll-device-flow --client-id abc123 --device-code device123456 --output json

**Descrição:**
  Verifica o status do fluxo de dispositivo OAuth. Este comando deve ser chamado
  periodicamente após iniciar o fluxo de dispositivo para verificar se o usuário
  autorizou o acesso. Retorna o token de acesso quando a autorização for concluída.`
      )
      .action(async options => {
        await this.handlePollDeviceFlow(options);
      });

    registerLogger.info('Successfully registered all cloud OAuth commands');
  }
}
