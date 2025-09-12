import { ConfigService } from '../config.service';
import { BitbucketConfig } from '@/types/config';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env['BITBUCKET_BASE_URL'];
    delete process.env['BITBUCKET_USERNAME'];
    delete process.env['BITBUCKET_APP_PASSWORD'];
    delete process.env['BITBUCKET_API_TOKEN'];
    delete process.env['BITBUCKET_SERVER_TYPE'];
    delete process.env['BITBUCKET_OAUTH_CLIENT_ID'];
    delete process.env['BITBUCKET_OAUTH_CLIENT_SECRET'];
  });

  describe('getConfig', () => {
    it('should load config from environment variables', () => {
      process.env['BITBUCKET_BASE_URL'] = 'https://api.bitbucket.org';
      process.env['BITBUCKET_USERNAME'] = 'testuser';
      process.env['BITBUCKET_APP_PASSWORD'] = 'testpass';
      process.env['BITBUCKET_SERVER_TYPE'] = 'cloud';

      const config = configService.getConfig();

      expect(config.baseUrl).toBe('https://api.bitbucket.org');
      expect(config.auth.type).toBe('app_password');
      expect(config.auth.credentials.username).toBe('testuser');
      expect(config.serverType).toBe('cloud');
    });

    it('should load config with API token', () => {
      process.env['BITBUCKET_BASE_URL'] = 'https://api.bitbucket.org';
      process.env['BITBUCKET_USERNAME'] = 'testuser';
      process.env['BITBUCKET_API_TOKEN'] = 'testtoken';
      process.env['BITBUCKET_SERVER_TYPE'] = 'cloud';

      const config = configService.getConfig();

      expect(config.auth.type).toBe('api_token');
      expect(config.auth.credentials.username).toBe('testuser');
      expect(config.auth.credentials.token).toBe('testtoken');
    });

    it('should use default values when environment variables are not set', () => {
      const config = configService.getConfig();

      expect(config.baseUrl).toBe('https://bitbucket.org');
      expect(config.auth.type).toBe('none');
      expect(config.serverType).toBe('auto');
      expect(config.timeouts.read).toBe(2000);
      expect(config.timeouts.connect).toBe(10000);
    });

    it('should throw error for invalid base URL', () => {
      process.env['BITBUCKET_BASE_URL'] = 'invalid-url';

      expect(() => configService.getConfig()).toThrow();
    });
  });

  describe('validateConfig', () => {
    it('should validate a valid config', () => {
      const validConfig: BitbucketConfig = {
        baseUrl: 'https://api.bitbucket.org',
        auth: {
          type: 'basic',
          credentials: {
            username: 'testuser',
            password: 'testpass',
          },
        },
        serverType: 'cloud',
        timeouts: {
          read: 2000,
          write: 5000,
          connect: 10000,
        },
        rateLimit: {
          requestsPerMinute: 60,
          burstLimit: 10,
          retryAfter: 1000,
        },
      };

      const result = configService.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid config', () => {
      const invalidConfig = {
        baseUrl: 'invalid-url',
        auth: {
          type: 'basic',
          credentials: {
            username: 'testuser',
            // Missing password
          },
        },
      };

      const result = configService.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('detectServerType', () => {
    it('should detect cloud server', () => {
      const serverType = configService.detectServerType('https://bitbucket.org');
      expect(serverType).toBe('cloud');
    });

    it('should detect datacenter server', () => {
      const serverType = configService.detectServerType('https://bitbucket.company.com');
      expect(serverType).toBe('datacenter');
    });
  });

  describe('getAuthConfig', () => {
    it('should return OAuth config when OAuth credentials are available', () => {
      process.env['BITBUCKET_OAUTH_CLIENT_ID'] = 'client_id';
      process.env['BITBUCKET_OAUTH_CLIENT_SECRET'] = 'client_secret';

      const authConfig = configService.getAuthConfig();

      expect(authConfig.type).toBe('oauth');
      expect(authConfig.credentials.clientId).toBe('client_id');
      expect(authConfig.credentials.clientSecret).toBe('client_secret');
    });

    it('should return app password config when app password credentials are available', () => {
      process.env['BITBUCKET_USERNAME'] = 'testuser';
      process.env['BITBUCKET_APP_PASSWORD'] = 'testpass';

      const authConfig = configService.getAuthConfig();

      expect(authConfig.type).toBe('app_password');
      expect(authConfig.credentials.username).toBe('testuser');
      expect(authConfig.credentials.appPassword).toBe('testpass');
    });

    it('should throw error when no valid credentials are found', () => {
      expect(() => configService.getAuthConfig()).toThrow();
    });
  });

  describe('getTimeoutConfig', () => {
    it('should return timeout configuration from environment', () => {
      process.env['BITBUCKET_READ_TIMEOUT'] = '5000';
      process.env['BITBUCKET_WRITE_TIMEOUT'] = '10000';
      process.env['BITBUCKET_CONNECT_TIMEOUT'] = '15000';

      const timeoutConfig = configService.getTimeoutConfig();

      expect(timeoutConfig.read).toBe(5000);
      expect(timeoutConfig.write).toBe(10000);
      expect(timeoutConfig.connect).toBe(15000);
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return rate limit configuration from environment', () => {
      process.env['BITBUCKET_REQUESTS_PER_MINUTE'] = '120';
      process.env['BITBUCKET_BURST_LIMIT'] = '20';
      process.env['BITBUCKET_RETRY_AFTER'] = '2000';

      const rateLimitConfig = configService.getRateLimitConfig();

      expect(rateLimitConfig.requestsPerMinute).toBe(120);
      expect(rateLimitConfig.burstLimit).toBe(20);
      expect(rateLimitConfig.retryAfter).toBe(2000);
    });
  });

  describe('getLoggingConfig', () => {
    it('should return logging configuration from environment', () => {
      process.env['LOG_LEVEL'] = 'debug';
      process.env['LOG_FORMAT'] = 'simple';

      const loggingConfig = configService.getLoggingConfig();

      expect(loggingConfig.level).toBe('debug');
      expect(loggingConfig.format).toBe('simple');
    });
  });

  describe('getMCPServerConfig', () => {
    it('should return MCP server configuration from environment', () => {
      process.env['MCP_SERVER_PORT'] = '8080';
      process.env['MCP_SERVER_HOST'] = '0.0.0.0';

      const serverConfig = configService.getMCPServerConfig();

      expect(serverConfig.port).toBe(8080);
      expect(serverConfig.host).toBe('0.0.0.0');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return environment configuration', () => {
      process.env['NODE_ENV'] = 'production';

      const envConfig = configService.getEnvironmentConfig();

      expect(envConfig.nodeEnv).toBe('production');
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration cache', () => {
      const initialConfig = configService.getConfig();

      configService.resetConfig();

      const newConfig = configService.getConfig();
      expect(newConfig).toEqual(initialConfig);
    });
  });
});
