/**
 * Integration tests for CLI Client
 * TDD Red Phase - These tests should fail initially
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

describe('CLI Client Integration Tests', () => {
  const cliPath = path.join(__dirname, '../../dist/client/cli/index.js');
  const testTimeout = 30000;

  beforeAll(async () => {
    // Ensure CLI is built
    if (!fs.existsSync(cliPath)) {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });

  describe('Health Check Command', () => {
    it('should execute health check with valid URL', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health', 'https://bitbucket.example.com']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Health check completed');
      expect(stderr).toBe('');
    }, testTimeout);

    it('should validate URL format', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health', 'invalid-url']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid URL format');
    }, testTimeout);

    it('should handle connection timeout', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health', 'https://timeout.example.com']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Connection timeout');
    }, testTimeout);

    it('should handle server not found', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health', 'https://nonexistent.example.com']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Server not found');
    }, testTimeout);
  });

  describe('Help Command', () => {
    it('should display help information', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Bitbucket MCP Server CLI');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('health');
      expect(stderr).toBe('');
    }, testTimeout);

    it('should display version information', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['--version']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('1.0.0');
      expect(stderr).toBe('');
    }, testTimeout);
  });

  describe('Configuration Commands', () => {
    const configFile = path.join(__dirname, '../../test-config.json');

    beforeEach(async () => {
      // Clean up any existing test config
      if (fs.existsSync(configFile)) {
        await unlink(configFile);
      }
    });

    afterEach(async () => {
      // Clean up test config
      if (fs.existsSync(configFile)) {
        await unlink(configFile);
      }
    });

    it('should create configuration file', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'config',
        'init',
        '--config',
        configFile,
        '--server-url',
        'https://bitbucket.example.com',
        '--auth-type',
        'oauth',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Configuration created');
      expect(fs.existsSync(configFile)).toBe(true);
    }, testTimeout);

    it('should validate configuration', async () => {
      // Create a config file first
      await writeFile(configFile, JSON.stringify({
        server: {
          url: 'https://bitbucket.example.com',
        },
        auth: {
          type: 'oauth',
        },
      }));

      const { stdout, stderr, exitCode } = await executeCLI(['config', 'validate', '--config', configFile]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Configuration is valid');
    }, testTimeout);

    it('should reject invalid configuration', async () => {
      // Create an invalid config file
      await writeFile(configFile, JSON.stringify({
        server: {
          url: 'invalid-url',
        },
      }));

      const { stdout, stderr, exitCode } = await executeCLI(['config', 'validate', '--config', configFile]);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid configuration');
    }, testTimeout);
  });

  describe('Authentication Commands', () => {
    it('should handle OAuth authentication flow', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'auth',
        'oauth',
        '--client-id',
        'test-client-id',
        '--redirect-uri',
        'http://localhost:3000/callback',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('OAuth authentication initiated');
    }, testTimeout);

    it('should handle personal access token authentication', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'auth',
        'token',
        '--token',
        'test-token',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Token authentication configured');
    }, testTimeout);

    it('should validate token format', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'auth',
        'token',
        '--token',
        'invalid-token-format',
      ]);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid token format');
    }, testTimeout);
  });

  describe('Error Handling', () => {
    it('should handle unknown command', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['unknown-command']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown command');
    }, testTimeout);

    it('should handle missing required arguments', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Required argument missing');
    }, testTimeout);

    it('should handle invalid options', async () => {
      const { stdout, stderr, exitCode } = await executeCLI(['health', 'https://example.com', '--invalid-option']);
      
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown option');
    }, testTimeout);
  });

  describe('Output Formatting', () => {
    it('should output JSON format when requested', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'health',
        'https://bitbucket.example.com',
        '--format',
        'json',
      ]);
      
      expect(exitCode).toBe(0);
      expect(() => JSON.parse(stdout)).not.toThrow();
      const output = JSON.parse(stdout);
      expect(output).toHaveProperty('status');
      expect(output).toHaveProperty('timestamp');
    }, testTimeout);

    it('should output table format when requested', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'health',
        'https://bitbucket.example.com',
        '--format',
        'table',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('│');
      expect(stdout).toContain('┌');
      expect(stdout).toContain('└');
    }, testTimeout);

    it('should output verbose information when requested', async () => {
      const { stdout, stderr, exitCode } = await executeCLI([
        'health',
        'https://bitbucket.example.com',
        '--verbose',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Request details');
      expect(stdout).toContain('Response time');
    }, testTimeout);
  });

  describe('Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use environment variables for configuration', async () => {
      process.env.BITBUCKET_SERVER_URL = 'https://bitbucket.example.com';
      process.env.BITBUCKET_AUTH_TOKEN = 'test-token';

      const { stdout, stderr, exitCode } = await executeCLI(['health']);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Health check completed');
    }, testTimeout);

    it('should override environment variables with command line arguments', async () => {
      process.env.BITBUCKET_SERVER_URL = 'https://env.example.com';

      const { stdout, stderr, exitCode } = await executeCLI([
        'health',
        'https://cli.example.com',
      ]);
      
      expect(exitCode).toBe(0);
      expect(stdout).toContain('https://cli.example.com');
    }, testTimeout);
  });
});

/**
 * Helper function to execute CLI commands
 */
function executeCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, '../../dist/client/cli/index.js');
    const child = spawn('node', [cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });

    child.on('error', (error) => {
      resolve({
        stdout,
        stderr: error.message,
        exitCode: 1,
      });
    });
  });
}
