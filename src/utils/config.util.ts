import { config as dotenvConfig } from 'dotenv';
import { Logger } from './logger.util.js';
import { DEFAULT_BITBUCKET_CLOUD_URL, DEFAULT_BITBUCKET_SERVER_URL } from './constants.util.js';

// Configuration interface
interface ConfigType {
  // Bitbucket Configuration
  BITBUCKET_USERNAME?: string;
  BITBUCKET_APP_PASSWORD?: string;
  BITBUCKET_API_TOKEN?: string;
  BITBUCKET_BASE_URL?: string;
  BITBUCKET_WORKSPACE?: string;

  // Atlassian Configuration (for Cloud)
  ATLASSIAN_SITE_NAME?: string;
  ATLASSIAN_USER_EMAIL?: string;
  ATLASSIAN_API_TOKEN?: string;

  // Repository Access Tokens (NEW!)
  REPOSITORY_ACCESS_TOKEN?: string;
  REPOSITORY_SLUG?: string;
  REPOSITORY_WORKSPACE?: string;

  // Project Access Tokens (NEW!)
  PROJECT_ACCESS_TOKEN?: string;
  PROJECT_KEY?: string;
  PROJECT_WORKSPACE?: string;

  // Workspace Access Tokens (NEW!)
  WORKSPACE_ACCESS_TOKEN?: string;
  WORKSPACE_SLUG?: string;

  // OAuth 2.0 Configuration (NEW!)
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_REDIRECT_URI?: string;
  OAUTH_ACCESS_TOKEN?: string;
  OAUTH_REFRESH_TOKEN?: string;
  OAUTH_TOKEN_EXPIRES_AT?: string;

  // Server Configuration
  TRANSPORT_MODE: 'stdio' | 'http';
  PORT: number;
  DEBUG: boolean;

  // API Configuration
  API_TIMEOUT: number;
  API_MAX_RETRIES: number;
  API_RATE_LIMIT: number;

  // Feature Flags
  ENABLE_ISSUES: boolean;
  ENABLE_PIPELINES: boolean;
  ENABLE_WEBHOOKS: boolean;
  ENABLE_PROJECTS: boolean;

  // Cloud Tools Control
  CLOUD_CORE_AUTH: boolean;
  CLOUD_CORE_REPOSITORY: boolean;
  CLOUD_CORE_PULL_REQUEST: boolean;
  CLOUD_CORE_COMMIT: boolean;
  CLOUD_CORE_PROJECT: boolean;
  CLOUD_CORE_WORKSPACE: boolean;
  CLOUD_SECONDARY_USER: boolean;
  CLOUD_SECONDARY_SEARCH: boolean;
  CLOUD_SECONDARY_ISSUE: boolean;
  CLOUD_SECONDARY_DIFF: boolean;
  CLOUD_SECONDARY_PIPELINE: boolean;
  CLOUD_SECONDARY_BRANCH_RESTRICTION: boolean;
  CLOUD_ADVANCED_WEBHOOK: boolean;
  CLOUD_ADVANCED_OAUTH: boolean;
  CLOUD_ADVANCED_SSH: boolean;
  CLOUD_ADVANCED_SOURCE: boolean;
  CLOUD_ADVANCED_REF: boolean;
  CLOUD_ADVANCED_SNIPPET: boolean;
  CLOUD_ADVANCED_TOKEN_MANAGEMENT: boolean;
  CLOUD_ADVANCED_SCOPE_VALIDATOR: boolean;

  // Data Center Tools Control
  DATACENTER_CORE_AUTH: boolean;
  DATACENTER_CORE_REPOSITORY: boolean;
  DATACENTER_CORE_PULL_REQUEST: boolean;
  DATACENTER_CORE_PROJECT: boolean;
  DATACENTER_CORE_SEARCH: boolean;
  DATACENTER_CORE_DASHBOARD: boolean;
  DATACENTER_SECONDARY_SECURITY: boolean;
  DATACENTER_SECONDARY_PERMISSION_MANAGEMENT: boolean;
  DATACENTER_SECONDARY_BUILDS: boolean;
  DATACENTER_SECONDARY_CAPABILITIES: boolean;
  DATACENTER_SECONDARY_JIRA_INTEGRATION: boolean;
  DATACENTER_SECONDARY_SAML_CONFIGURATION: boolean;
  DATACENTER_ADVANCED_MARKUP: boolean;
  DATACENTER_ADVANCED_MIRRORING: boolean;
  DATACENTER_ADVANCED_OTHER_OPERATIONS: boolean;
  DATACENTER_ADVANCED_ROLLING_UPGRADES: boolean;
  DATACENTER_ADVANCED_SYSTEM_MAINTENANCE: boolean;
  DATACENTER_ADVANCED_DEPRECATED: boolean;
}

class ConfigManager {
  private config: ConfigType | null = null;
  private logger = Logger.forContext('ConfigManager');

  private parseConfig(env: NodeJS.ProcessEnv): ConfigType {
    return {
      // Bitbucket Configuration
      BITBUCKET_USERNAME: env.BITBUCKET_USERNAME,
      BITBUCKET_APP_PASSWORD: env.BITBUCKET_APP_PASSWORD,
      BITBUCKET_API_TOKEN: env.BITBUCKET_API_TOKEN,
      BITBUCKET_BASE_URL: env.BITBUCKET_BASE_URL,
      BITBUCKET_WORKSPACE: env.BITBUCKET_WORKSPACE,

      // Atlassian Configuration (for Cloud)
      ATLASSIAN_SITE_NAME: env.ATLASSIAN_SITE_NAME,
      ATLASSIAN_USER_EMAIL: env.ATLASSIAN_USER_EMAIL,
      ATLASSIAN_API_TOKEN: env.ATLASSIAN_API_TOKEN,

      // Repository Access Tokens (NEW!)
      REPOSITORY_ACCESS_TOKEN: env.REPOSITORY_ACCESS_TOKEN,
      REPOSITORY_SLUG: env.REPOSITORY_SLUG,
      REPOSITORY_WORKSPACE: env.REPOSITORY_WORKSPACE,

      // Project Access Tokens (NEW!)
      PROJECT_ACCESS_TOKEN: env.PROJECT_ACCESS_TOKEN,
      PROJECT_KEY: env.PROJECT_KEY,
      PROJECT_WORKSPACE: env.PROJECT_WORKSPACE,

      // Workspace Access Tokens (NEW!)
      WORKSPACE_ACCESS_TOKEN: env.WORKSPACE_ACCESS_TOKEN,
      WORKSPACE_SLUG: env.WORKSPACE_SLUG,

      // OAuth 2.0 Configuration (NEW!)
      OAUTH_CLIENT_ID: env.OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET: env.OAUTH_CLIENT_SECRET,
      OAUTH_REDIRECT_URI: env.OAUTH_REDIRECT_URI,
      OAUTH_ACCESS_TOKEN: env.OAUTH_ACCESS_TOKEN,
      OAUTH_REFRESH_TOKEN: env.OAUTH_REFRESH_TOKEN,
      OAUTH_TOKEN_EXPIRES_AT: env.OAUTH_TOKEN_EXPIRES_AT,

      // Server Configuration
      TRANSPORT_MODE: (env.TRANSPORT_MODE as 'stdio' | 'http') || 'stdio',
      PORT: Number(env.PORT) || 3000,
      DEBUG: env.DEBUG === 'true',

      // API Configuration
      API_TIMEOUT: Number(env.API_TIMEOUT) || 30000,
      API_MAX_RETRIES: Number(env.API_MAX_RETRIES) || 3,
      API_RATE_LIMIT: Number(env.API_RATE_LIMIT) || 1000,

      // Feature Flags
      ENABLE_ISSUES: env.ENABLE_ISSUES !== 'false',
      ENABLE_PIPELINES: env.ENABLE_PIPELINES !== 'false',
      ENABLE_WEBHOOKS: env.ENABLE_WEBHOOKS !== 'false',
      ENABLE_PROJECTS: env.ENABLE_PROJECTS !== 'false',

      // Cloud Tools Control
      CLOUD_CORE_AUTH: env.CLOUD_CORE_AUTH !== 'false',
      CLOUD_CORE_REPOSITORY: env.CLOUD_CORE_REPOSITORY !== 'false',
      CLOUD_CORE_PULL_REQUEST: env.CLOUD_CORE_PULL_REQUEST !== 'false',
      CLOUD_CORE_COMMIT: env.CLOUD_CORE_COMMIT !== 'false',
      CLOUD_CORE_PROJECT: env.CLOUD_CORE_PROJECT !== 'false',
      CLOUD_CORE_WORKSPACE: env.CLOUD_CORE_WORKSPACE !== 'false',
      CLOUD_SECONDARY_USER: env.CLOUD_SECONDARY_USER !== 'false',
      CLOUD_SECONDARY_SEARCH: env.CLOUD_SECONDARY_SEARCH !== 'false',
      CLOUD_SECONDARY_ISSUE: env.CLOUD_SECONDARY_ISSUE !== 'false',
      CLOUD_SECONDARY_DIFF: env.CLOUD_SECONDARY_DIFF !== 'false',
      CLOUD_SECONDARY_PIPELINE: env.CLOUD_SECONDARY_PIPELINE !== 'false',
      CLOUD_SECONDARY_BRANCH_RESTRICTION: env.CLOUD_SECONDARY_BRANCH_RESTRICTION !== 'false',
      CLOUD_ADVANCED_WEBHOOK: env.CLOUD_ADVANCED_WEBHOOK !== 'false',
      CLOUD_ADVANCED_OAUTH: env.CLOUD_ADVANCED_OAUTH !== 'false',
      CLOUD_ADVANCED_SSH: env.CLOUD_ADVANCED_SSH !== 'false',
      CLOUD_ADVANCED_SOURCE: env.CLOUD_ADVANCED_SOURCE !== 'false',
      CLOUD_ADVANCED_REF: env.CLOUD_ADVANCED_REF !== 'false',
      CLOUD_ADVANCED_SNIPPET: env.CLOUD_ADVANCED_SNIPPET !== 'false',
      CLOUD_ADVANCED_TOKEN_MANAGEMENT: env.CLOUD_ADVANCED_TOKEN_MANAGEMENT !== 'false',
      CLOUD_ADVANCED_SCOPE_VALIDATOR: env.CLOUD_ADVANCED_SCOPE_VALIDATOR !== 'false',

      // Data Center Tools Control
      DATACENTER_CORE_AUTH: env.DATACENTER_CORE_AUTH !== 'false',
      DATACENTER_CORE_REPOSITORY: env.DATACENTER_CORE_REPOSITORY !== 'false',
      DATACENTER_CORE_PULL_REQUEST: env.DATACENTER_CORE_PULL_REQUEST !== 'false',
      DATACENTER_CORE_PROJECT: env.DATACENTER_CORE_PROJECT !== 'false',
      DATACENTER_CORE_SEARCH: env.DATACENTER_CORE_SEARCH !== 'false',
      DATACENTER_CORE_DASHBOARD: env.DATACENTER_CORE_DASHBOARD !== 'false',
      DATACENTER_SECONDARY_SECURITY: env.DATACENTER_SECONDARY_SECURITY !== 'false',
      DATACENTER_SECONDARY_PERMISSION_MANAGEMENT:
        env.DATACENTER_SECONDARY_PERMISSION_MANAGEMENT !== 'false',
      DATACENTER_SECONDARY_BUILDS: env.DATACENTER_SECONDARY_BUILDS !== 'false',
      DATACENTER_SECONDARY_CAPABILITIES: env.DATACENTER_SECONDARY_CAPABILITIES !== 'false',
      DATACENTER_SECONDARY_JIRA_INTEGRATION: env.DATACENTER_SECONDARY_JIRA_INTEGRATION !== 'false',
      DATACENTER_SECONDARY_SAML_CONFIGURATION:
        env.DATACENTER_SECONDARY_SAML_CONFIGURATION !== 'false',
      DATACENTER_ADVANCED_MARKUP: env.DATACENTER_ADVANCED_MARKUP !== 'false',
      DATACENTER_ADVANCED_MIRRORING: env.DATACENTER_ADVANCED_MIRRORING !== 'false',
      DATACENTER_ADVANCED_OTHER_OPERATIONS: env.DATACENTER_ADVANCED_OTHER_OPERATIONS !== 'false',
      DATACENTER_ADVANCED_ROLLING_UPGRADES: env.DATACENTER_ADVANCED_ROLLING_UPGRADES !== 'false',
      DATACENTER_ADVANCED_SYSTEM_MAINTENANCE:
        env.DATACENTER_ADVANCED_SYSTEM_MAINTENANCE !== 'false',
      DATACENTER_ADVANCED_DEPRECATED: env.DATACENTER_ADVANCED_DEPRECATED !== 'false',
    };
  }

  load(): void {
    try {
      // Load environment variables
      dotenvConfig();

      // Parse and validate configuration
      this.config = this.parseConfig(process.env);

      // Configure logger level based on DEBUG setting
      const debugEnabled = this.config.DEBUG;
      Logger.configureFromConfig(debugEnabled);

      this.logger.info('Configuration loaded successfully');
      this.logger.debug('Configuration:', {
        ...this.config,
        BITBUCKET_APP_PASSWORD: this.config.BITBUCKET_APP_PASSWORD ? '[HIDDEN]' : undefined,
        BITBUCKET_API_TOKEN: this.config.BITBUCKET_API_TOKEN ? '[HIDDEN]' : undefined,
        ATLASSIAN_API_TOKEN: this.config.ATLASSIAN_API_TOKEN ? '[HIDDEN]' : undefined,
        REPOSITORY_ACCESS_TOKEN: this.config.REPOSITORY_ACCESS_TOKEN ? '[HIDDEN]' : undefined,
        PROJECT_ACCESS_TOKEN: this.config.PROJECT_ACCESS_TOKEN ? '[HIDDEN]' : undefined,
        WORKSPACE_ACCESS_TOKEN: this.config.WORKSPACE_ACCESS_TOKEN ? '[HIDDEN]' : undefined,
        OAUTH_ACCESS_TOKEN: this.config.OAUTH_ACCESS_TOKEN ? '[HIDDEN]' : undefined,
        OAUTH_REFRESH_TOKEN: this.config.OAUTH_REFRESH_TOKEN ? '[HIDDEN]' : undefined,
        OAUTH_CLIENT_SECRET: this.config.OAUTH_CLIENT_SECRET ? '[HIDDEN]' : undefined,
      });
    } catch (error) {
      this.logger.error('Failed to load configuration:', error);
      throw new Error(
        `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  get(key: keyof ConfigType): string | number | boolean | undefined {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call config.load() first.');
    }
    return this.config[key];
  }

  getString(key: keyof ConfigType): string | undefined {
    const value = this.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: keyof ConfigType): number | undefined {
    const value = this.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: keyof ConfigType): boolean {
    const value = this.get(key);
    return typeof value === 'boolean' ? value : false;
  }

  // Helper methods for common configuration needs
  getBitbucketType(): 'cloud' | 'server' {
    if (this.getString('ATLASSIAN_SITE_NAME') || this.getString('ATLASSIAN_API_TOKEN')) {
      return 'cloud';
    }
    if (this.getString('BITBUCKET_BASE_URL') && this.getString('BITBUCKET_API_TOKEN')) {
      return 'server';
    }
    return 'cloud'; // Default to cloud
  }

  getAuthMethod():
    | 'app-password'
    | 'api-token'
    | 'oauth'
    | 'repository-token'
    | 'project-token'
    | 'workspace-token' {
    // Check for specific access tokens first
    if (this.getString('REPOSITORY_ACCESS_TOKEN')) {
      return 'repository-token';
    }
    if (this.getString('PROJECT_ACCESS_TOKEN')) {
      return 'project-token';
    }
    if (this.getString('WORKSPACE_ACCESS_TOKEN')) {
      return 'workspace-token';
    }
    if (this.getString('OAUTH_ACCESS_TOKEN')) {
      return 'oauth';
    }
    if (this.getString('ATLASSIAN_API_TOKEN')) {
      return 'api-token';
    }
    if (this.getString('BITBUCKET_API_TOKEN')) {
      return 'api-token';
    }
    return 'app-password';
  }

  getBaseUrl(): string {
    const customUrl = this.getString('BITBUCKET_BASE_URL');
    if (customUrl) {
      return customUrl;
    }

    const siteName = this.getString('ATLASSIAN_SITE_NAME');
    if (siteName) {
      return DEFAULT_BITBUCKET_CLOUD_URL;
    }

    return DEFAULT_BITBUCKET_SERVER_URL;
  }

  getCredentials(): { username: string; password: string; tokenType?: string; scope?: string } {
    const authMethod = this.getAuthMethod();

    switch (authMethod) {
      case 'repository-token':
        return {
          username: 'repository-access-token',
          password: this.getString('REPOSITORY_ACCESS_TOKEN')!,
          tokenType: 'repository',
          scope: `repository:${this.getString('REPOSITORY_WORKSPACE')}/${this.getString('REPOSITORY_SLUG')}`,
        };

      case 'project-token':
        return {
          username: 'project-access-token',
          password: this.getString('PROJECT_ACCESS_TOKEN')!,
          tokenType: 'project',
          scope: `project:${this.getString('PROJECT_WORKSPACE')}/${this.getString('PROJECT_KEY')}`,
        };

      case 'workspace-token':
        return {
          username: 'workspace-access-token',
          password: this.getString('WORKSPACE_ACCESS_TOKEN')!,
          tokenType: 'workspace',
          scope: `workspace:${this.getString('WORKSPACE_SLUG')}`,
        };

      case 'oauth':
        return {
          username: 'oauth-token',
          password: this.getString('OAUTH_ACCESS_TOKEN')!,
          tokenType: 'oauth',
        };

      case 'api-token':
        if (this.getBitbucketType() === 'cloud') {
          const email = this.getString('ATLASSIAN_USER_EMAIL');
          const token = this.getString('ATLASSIAN_API_TOKEN');

          if (!email || !token) {
            throw new Error(
              'ATLASSIAN_USER_EMAIL and ATLASSIAN_API_TOKEN are required for Bitbucket Cloud'
            );
          }

          return { username: email, password: token, tokenType: 'api-token' };
        } else {
          const username = this.getString('BITBUCKET_USERNAME');
          const token = this.getString('BITBUCKET_API_TOKEN');

          if (!username || !token) {
            throw new Error(
              'BITBUCKET_USERNAME and BITBUCKET_API_TOKEN are required for Bitbucket Server'
            );
          }

          return { username, password: token, tokenType: 'api-token' };
        }

      default: // app-password
        if (this.getBitbucketType() === 'cloud') {
          const email = this.getString('ATLASSIAN_USER_EMAIL');
          const password = this.getString('BITBUCKET_APP_PASSWORD');

          if (!email || !password) {
            throw new Error(
              'ATLASSIAN_USER_EMAIL and BITBUCKET_APP_PASSWORD are required for Bitbucket Cloud'
            );
          }

          return { username: email, password, tokenType: 'app-password' };
        } else {
          const username = this.getString('BITBUCKET_USERNAME');
          const password = this.getString('BITBUCKET_APP_PASSWORD');

          if (!username || !password) {
            throw new Error(
              'BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD are required for Bitbucket Server'
            );
          }

          return { username, password, tokenType: 'app-password' };
        }
    }
  }

  // OAuth 2.0 specific methods
  getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
    const clientId = this.getString('OAUTH_CLIENT_ID');
    const clientSecret = this.getString('OAUTH_CLIENT_SECRET');
    const redirectUri = this.getString('OAUTH_REDIRECT_URI');

    if (clientId && clientSecret && redirectUri) {
      return { clientId, clientSecret, redirectUri };
    }

    return null;
  }

  getOAuthTokens(): { accessToken: string; refreshToken?: string; expiresAt?: string } | null {
    const accessToken = this.getString('OAUTH_ACCESS_TOKEN');

    if (!accessToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken: this.getString('OAUTH_REFRESH_TOKEN'),
      expiresAt: this.getString('OAUTH_TOKEN_EXPIRES_AT'),
    };
  }

  validate(): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const authMethod = this.getAuthMethod();

    switch (authMethod) {
      case 'repository-token':
        if (
          !this.getString('REPOSITORY_ACCESS_TOKEN') ||
          !this.getString('REPOSITORY_SLUG') ||
          !this.getString('REPOSITORY_WORKSPACE')
        ) {
          throw new Error(
            'REPOSITORY_ACCESS_TOKEN, REPOSITORY_SLUG, and REPOSITORY_WORKSPACE are required for repository access tokens'
          );
        }
        break;

      case 'project-token':
        if (
          !this.getString('PROJECT_ACCESS_TOKEN') ||
          !this.getString('PROJECT_KEY') ||
          !this.getString('PROJECT_WORKSPACE')
        ) {
          throw new Error(
            'PROJECT_ACCESS_TOKEN, PROJECT_KEY, and PROJECT_WORKSPACE are required for project access tokens'
          );
        }
        break;

      case 'workspace-token':
        if (!this.getString('WORKSPACE_ACCESS_TOKEN') || !this.getString('WORKSPACE_SLUG')) {
          throw new Error(
            'WORKSPACE_ACCESS_TOKEN and WORKSPACE_SLUG are required for workspace access tokens'
          );
        }
        break;

      case 'oauth':
        if (!this.getString('OAUTH_ACCESS_TOKEN')) {
          throw new Error('OAUTH_ACCESS_TOKEN is required for OAuth authentication');
        }
        break;

      case 'api-token':
        if (this.getBitbucketType() === 'cloud') {
          if (!this.getString('ATLASSIAN_USER_EMAIL') || !this.getString('ATLASSIAN_API_TOKEN')) {
            throw new Error(
              'ATLASSIAN_USER_EMAIL and ATLASSIAN_API_TOKEN are required for Bitbucket Cloud'
            );
          }
        } else {
          if (!this.getString('BITBUCKET_USERNAME') || !this.getString('BITBUCKET_API_TOKEN')) {
            throw new Error(
              'BITBUCKET_USERNAME and BITBUCKET_API_TOKEN are required for Bitbucket Server'
            );
          }
        }
        break;

      default: // app-password
        if (this.getBitbucketType() === 'cloud') {
          if (
            !this.getString('ATLASSIAN_USER_EMAIL') ||
            !this.getString('BITBUCKET_APP_PASSWORD')
          ) {
            throw new Error(
              'ATLASSIAN_USER_EMAIL and BITBUCKET_APP_PASSWORD are required for Bitbucket Cloud'
            );
          }
        } else {
          if (!this.getString('BITBUCKET_USERNAME') || !this.getString('BITBUCKET_APP_PASSWORD')) {
            throw new Error(
              'BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD are required for Bitbucket Server'
            );
          }
        }
        break;
    }
  }
}

export const config = new ConfigManager();
