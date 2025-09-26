#!/usr/bin/env node
import http from 'node:http';

import { Command, InvalidOptionArgumentError } from 'commander';

import { createServer, type ServerInstance, type ServerOptions } from './server';

interface CliDependencies {
  createServer?: (options?: ServerOptions) => ServerInstance;
  requestShutdown?: (port: number) => Promise<void>;
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
}

const defaultRequestShutdown = async (port: number): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: '/shutdown',
        timeout: 10_000,
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300) {
          resolve();
        } else {
          reject(new Error(`Shutdown request failed with status ${res.statusCode}`));
        }
      },
    );

    req.on('error', reject);
    req.end();
  });
};

const LOG_LEVELS = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const;
type LogLevelOption = (typeof LOG_LEVELS)[number];

const parseLogLevel = (value: string): LogLevelOption => {
  if ((LOG_LEVELS as readonly string[]).includes(value)) {
    return value as LogLevelOption;
  }
  throw new InvalidOptionArgumentError(`Invalid log level: ${value}`);
};

export const buildCli = (dependencies: CliDependencies = {}): Command => {
  const program = new Command();
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const createServerFn = dependencies.createServer ?? createServer;
  const shutdownFn = dependencies.requestShutdown ?? defaultRequestShutdown;

  program.name('bitbucket-mcp').description('Bitbucket MCP server CLI').version('0.1.0');

  program.configureOutput({
    writeOut: (str) => {
      stdout.write(str);
    },
    writeErr: (str) => {
      stderr.write(str);
    },
  });

  program
    .command('start')
    .description('Start the Bitbucket MCP server')
    .option('--port <port>', 'HTTP port for the MCP server', (value) => Number(value))
    .option('--log-level <level>', 'Logger level', parseLogLevel)
    .option('--host <host>', 'Bitbucket host')
    .option('--username <username>', 'Bitbucket username')
    .option('--password <password>', 'Bitbucket password or personal token')
    .action(
      async (opts: {
        port?: number;
        logLevel?: LogLevelOption;
        host?: string;
        username?: string;
        password?: string;
      }) => {
        const server = createServerFn({
          config: {
            port: opts.port,
            logLevel: opts.logLevel,
          },
          credentials: {
            host: opts.host,
            username: opts.username,
            password: opts.password,
          },
        });

        await server.start();
        const address = server.getHttpAddress();
        const resolvedAddress = address ? `http://${address.address}:${address.port}` : 'unknown';
        stdout.write(`Server started on ${resolvedAddress}\n`);

        const shutdown = async () => {
          await server.stop();
          stdout.write('Server stopped\n');
          process.exit(0);
        };

        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
      },
    );

  program
    .command('stop')
    .description('Stop a running Bitbucket MCP server')
    .option(
      '--port <port>',
      'HTTP port the MCP server is listening on',
      (value) => Number(value),
      3000,
    )
    .action(async (opts: { port: number }) => {
      await shutdownFn(opts.port);
      stdout.write(`Shutdown request sent to http://127.0.0.1:${opts.port}\n`);
    });

  return program;
};

export const run = async (): Promise<void> => {
  const cli = buildCli();
  await cli.parseAsync(process.argv);
};

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
