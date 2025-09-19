#!/usr/bin/env node

/**
 * Bitbucket MCP Server CLI
 * Command-line interface for the Bitbucket MCP Server
 */

import { Command } from 'commander';
import { z } from 'zod';
import { initializeI18n, t, translateCLI } from '../../config/i18n';

// URL validation schema
const UrlSchema = z.string().url('Invalid URL format');

/**
 * Health check command
 */
async function healthCommand(url: string, options: any): Promise<void> {
  try {
    // Validate URL
    const validatedUrl = UrlSchema.parse(url);
    
    // Import server detection service
    const { serverDetectionService } = await import('../../services/server-detection.js');
    
    // Perform actual health check
    const startTime = Date.now();
    const serverInfo = await serverDetectionService.detectServerType(validatedUrl);
    const responseTime = Date.now() - startTime;
    
    if (options.verbose) {
      console.log('Request details:');
      console.log(`  URL: ${validatedUrl}`);
      console.log(`  Method: GET`);
      console.log(`  Response time: ${responseTime}ms`);
      console.log(`  Server type: ${serverInfo.serverType}`);
      console.log(`  Version: ${serverInfo.version}`);
      console.log(`  Supported: ${serverInfo.isSupported}`);
    }
    
    if (options.format === 'json') {
      const result = {
        status: 'success',
        url: validatedUrl,
        timestamp: new Date().toISOString(),
        responseTime,
        serverInfo: {
          serverType: serverInfo.serverType,
          version: serverInfo.version,
          isSupported: serverInfo.isSupported,
          healthStatus: serverInfo.healthStatus,
        }
      };
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Health check for ${validatedUrl} completed successfully`);
      console.log(`Server type: ${serverInfo.serverType} ${serverInfo.version}`);
      console.log(`Response time: ${responseTime}ms`);
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error:', error.errors[0]?.message || 'Validation error');
      process.exit(1);
    }
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

/**
 * Configuration commands
 */
async function configInit(options: any): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const config = {
      server: {
        url: options.serverUrl || 'https://bitbucket.example.com',
      },
      auth: {
        type: options.authType || 'oauth',
        clientId: process.env.BITBUCKET_CLIENT_ID || '',
        clientSecret: process.env.BITBUCKET_CLIENT_SECRET || '',
        accessToken: process.env.BITBUCKET_ACCESS_TOKEN || '',
      },
      cache: {
        type: 'memory',
        ttl: 300, // 5 minutes
        maxSize: 100 * 1024 * 1024, // 100MB
      },
      logging: {
        level: 'info',
        format: 'json',
      },
    };
    
    const configPath = path.resolve(options.config || 'bitbucket-mcp.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(`Configuration created successfully at ${configPath}`);
    
    if (options.verbose) {
      console.log('Config content:');
      console.log(JSON.stringify(config, null, 2));
    }
    
  } catch (error) {
    console.error('Failed to create configuration:', error);
    process.exit(1);
  }
}

async function configValidate(options: any): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = path.resolve(options.config || 'bitbucket-mcp.json');
    
    // Check if config file exists
    try {
      await fs.access(configPath);
    } catch {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    
    // Read and parse config
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Validate required fields
    const errors: string[] = [];
    
    if (!config.server?.url) {
      errors.push('Server URL is required');
    } else {
      try {
        UrlSchema.parse(config.server.url);
      } catch {
        errors.push('Server URL must be a valid URL');
      }
    }
    
    if (!config.auth?.type) {
      errors.push('Authentication type is required');
    } else if (!['oauth', 'token', 'basic'].includes(config.auth.type)) {
      errors.push('Authentication type must be oauth, token, or basic');
    }
    
    if (config.auth?.type === 'oauth') {
      if (!config.auth.clientId) {
        errors.push('Client ID is required for OAuth authentication');
      }
      if (!config.auth.clientSecret) {
        errors.push('Client Secret is required for OAuth authentication');
      }
    }
    
    if (config.auth?.type === 'token' && !config.auth.accessToken) {
      errors.push('Access token is required for token authentication');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
    
    console.log('Configuration is valid');
    
    if (options.verbose) {
      console.log('Validated configuration:');
      console.log(JSON.stringify(config, null, 2));
    }
    
  } catch (error) {
    console.error('Invalid configuration:', error);
    process.exit(1);
  }
}

/**
 * Authentication commands
 */
async function authOAuth(options: any): Promise<void> {
  try {
    const { serverDetectionService } = await import('../../services/server-detection.js');
    const { AuthenticationService } = await import('../../services/authentication.js');
    
    const serverUrl = process.env.BITBUCKET_URL || 'https://bitbucket.example.com';
    const serverInfo = await serverDetectionService.detectServerType(serverUrl);
    
    const authService = new AuthenticationService(serverInfo);
    
    console.log('OAuth authentication initiated');
    console.log(`Server: ${serverUrl} (${serverInfo.serverType})`);
    console.log(`Client ID: ${options.clientId || 'Not provided'}`);
    console.log(`Redirect URI: ${options.redirectUri || 'Not provided'}`);
    
    if (options.clientId && options.redirectUri) {
      // Generate authorization URL
      const authUrl = authService.generateAuthorizationUrl({
        clientId: options.clientId,
        redirectUri: options.redirectUri,
        scope: 'read write',
      });
      
      console.log('\nPlease visit the following URL to authorize:');
      console.log(authUrl);
      console.log('\nAfter authorization, you will receive a code that can be used to exchange for an access token.');
    } else {
      console.log('\nTo complete OAuth setup, provide --client-id and --redirect-uri options');
    }
    
  } catch (error) {
    console.error('OAuth authentication failed:', error);
    process.exit(1);
  }
}

async function authToken(options: any): Promise<void> {
  try {
    const { serverDetectionService } = await import('../../services/server-detection.js');
    const { AuthenticationService } = await import('../../services/authentication.js');
    
    const serverUrl = process.env.BITBUCKET_URL || 'https://bitbucket.example.com';
    const serverInfo = await serverDetectionService.detectServerType(serverUrl);
    
    const authService = new AuthenticationService(serverInfo);
    
    if (!options.token) {
      throw new Error('Token is required. Use --token option to provide the access token.');
    }
    
    // Validate token by making a test request
    try {
      const userInfo = await authService.getCurrentUser(options.token);
      console.log('Token authentication successful');
      console.log(`Authenticated as: ${userInfo.displayName || userInfo.name}`);
      console.log(`User ID: ${userInfo.id || userInfo.name}`);
      
      if (options.verbose) {
        console.log('User details:');
        console.log(JSON.stringify(userInfo, null, 2));
      }
    } catch (tokenError) {
      throw new Error(`Token validation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Token authentication failed:', error);
    process.exit(1);
  }
}

/**
 * Main CLI program
 */
function createCLI(): Command {
  const program = new Command();
  
  program
    .name('bitbucket-mcp')
    .description('Bitbucket MCP Server CLI')
    .version('1.1.0');
  
  // Health check command
  program
    .command('health <url>')
    .description('Check Bitbucket server health and connectivity')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-f, --format <format>', 'Output format (json, table)', 'text')
    .action(healthCommand);
  
  // Configuration commands
  const configCmd = program
    .command('config')
    .description('Configuration management');
  
  configCmd
    .command('init')
    .description('Initialize configuration file')
    .option('-c, --config <file>', 'Configuration file path', 'bitbucket-mcp.json')
    .option('--server-url <url>', 'Bitbucket server URL')
    .option('--auth-type <type>', 'Authentication type (oauth, token, basic)', 'oauth')
    .action(configInit);
  
  configCmd
    .command('validate')
    .description('Validate configuration file')
    .option('-c, --config <file>', 'Configuration file path', 'bitbucket-mcp.json')
    .action(configValidate);
  
  // Authentication commands
  const authCmd = program
    .command('auth')
    .description('Authentication management');
  
  authCmd
    .command('oauth')
    .description('OAuth authentication')
    .option('--client-id <id>', 'OAuth client ID')
    .option('--redirect-uri <uri>', 'OAuth redirect URI')
    .action(authOAuth);
  
  authCmd
    .command('token')
    .description('Personal access token authentication')
    .option('-t, --token <token>', 'Personal access token')
    .action(authToken);
  
  // Global options
  program
    .option('--verbose', 'Enable verbose output')
    .option('--format <format>', 'Output format (json, table)', 'text');
  
  return program;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Initialize internationalization
    await initializeI18n();
    
    const program = createCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('CLI error:', error);
    process.exit(1);
  }
}

// Start CLI if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled CLI error:', error);
    process.exit(1);
  });
}

export { createCLI, healthCommand, configInit, configValidate, authOAuth, authToken };
