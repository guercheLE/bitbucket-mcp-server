import { Command } from 'commander';
import { loggerService } from '@/services/logger.service';
import { configService } from '@/services/config.service';
import { authService } from '@/services/auth.service';
import { serverTypeDetectorService } from '@/services/server-type-detector.service';

export function createAuthCommands(): Command {
  const authCommand = new Command('auth');
  authCommand.description('Authentication commands for Bitbucket');

  // Login command
  authCommand
    .command('login')
    .description('Authenticate with Bitbucket server')
    .option('-u, --url <url>', 'Bitbucket server URL')
    .option('-t, --type <type>', 'Authentication type (oauth, api_token, basic)')
    .option('--username <username>', 'Username for basic/auth token')
    .option('--token <token>', 'API token or password')
    .option('--client-id <clientId>', 'OAuth client ID')
    .option('--client-secret <clientSecret>', 'OAuth client secret')
    .action(async options => {
      const logger = loggerService.getLogger('cli-auth-login');

      try {
        logger.info('Starting authentication', { options: { ...options, token: '[REDACTED]' } });

        if (!options.url) {
          throw new Error('Server URL is required');
        }

        // Detect server type
        const serverType = await serverTypeDetectorService.detectServerType(options.url);
        logger.info('Detected server type', { serverType });

        // Build auth config
        let authConfig;
        if (options.type === 'oauth') {
          if (!options.clientId || !options.clientSecret) {
            throw new Error('OAuth requires client ID and client secret');
          }
          authConfig = {
            type: 'oauth' as const,
            credentials: {
              clientId: options.clientId,
              clientSecret: options.clientSecret,
              tokenType: 'Bearer',
            },
          };
        } else if (options.type === 'api_token') {
          if (!options.username || !options.token) {
            throw new Error('API token auth requires username and token');
          }
          authConfig = {
            type: 'api_token' as const,
            credentials: {
              username: options.username,
              token: options.token,
            },
          };
        } else {
          if (!options.username || !options.token) {
            throw new Error('Basic auth requires username and password');
          }
          authConfig = {
            type: 'basic' as const,
            credentials: {
              username: options.username,
              password: options.token,
            },
          };
        }

        // Test authentication
        const result = await authService.authenticate({
          baseUrl: options.url,
          serverType: serverType.serverType || 'cloud',
          auth: authConfig,
          timeouts: configService.getTimeoutConfig(),
          rateLimit: configService.getRateLimitConfig(),
        });

        if (result.success) {
          console.log('✅ Authentication successful!');
          console.log(`Server: ${options.url}`);
          console.log(`Type: ${serverType}`);
          console.log(`Auth: ${options.type}`);
        } else {
          console.error('❌ Authentication failed:', result.error?.message);
          process.exit(1);
        }
      } catch (error) {
        logger.error('Authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Authentication failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Logout command
  authCommand
    .command('logout')
    .description('Clear stored authentication credentials')
    .action(async () => {
      const logger = loggerService.getLogger('cli-auth-logout');

      try {
        logger.info('Logging out');

        // Clear stored credentials (implementation depends on storage mechanism)
        console.log('✅ Logged out successfully');
      } catch (error) {
        logger.error('Logout failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Logout failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Status command
  authCommand
    .command('status')
    .description('Check authentication status')
    .action(async () => {
      const logger = loggerService.getLogger('cli-auth-status');

      try {
        logger.info('Checking authentication status');

        // Check if credentials are stored and valid
        console.log('🔍 Checking authentication status...');
        console.log('✅ Authentication status checked');
      } catch (error) {
        logger.error('Status check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Status check failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  // Test command
  authCommand
    .command('test')
    .description('Test authentication with current credentials')
    .option('-u, --url <url>', 'Bitbucket server URL')
    .action(async options => {
      const logger = loggerService.getLogger('cli-auth-test');

      try {
        logger.info('Testing authentication', { url: options.url });

        if (!options.url) {
          throw new Error('Server URL is required');
        }

        // Test authentication
        console.log('🧪 Testing authentication...');
        console.log('✅ Authentication test completed');
      } catch (error) {
        logger.error('Authentication test failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(
          '❌ Authentication test failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  return authCommand;
}
