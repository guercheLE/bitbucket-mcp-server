import http from 'node:http';
import { Writable } from 'node:stream';

import type { Command } from 'commander';

import { buildCli } from '../../src/cli';
import type { ServerInstance } from '../../src/server';

const createWritable = () => {
  const chunks: string[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { writable, chunks };
};

describe('CLI commands', () => {
  let cli: Command;

  beforeEach(() => {
    jest.resetModules();
  });

  it('starts the server when the start command is used', async () => {
    const onceSpy = jest.spyOn(process, 'once').mockImplementation(((
      _event: string | symbol,
      _handler: (...args: unknown[]) => void,
    ) => {
      // Swallow signal registration during tests
      return process as unknown as NodeJS.Process;
    }) as any);

    const serverMock: ServerInstance = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getState: jest.fn().mockReturnValue({
        isRunning: true,
        bitbucketConnected: true,
        bitbucketServerInfo: { version: '8.0.0', type: 'Server' },
        degradedMode: false,
      }),
      getHttpAddress: jest.fn().mockReturnValue({ address: '127.0.0.1', port: 4000 }),
      getLogger: jest.fn(),
    } as unknown as ServerInstance;

    const createServer = jest.fn().mockReturnValue(serverMock);
    const requestShutdown = jest.fn().mockResolvedValue(undefined);
    const { writable: stdout, chunks } = createWritable();
    const stderr = createWritable().writable;

    cli = buildCli({ createServer, requestShutdown, stdout, stderr });
    await cli.parseAsync([
      'node',
      'bitbucket-mcp',
      'start',
      '--port',
      '4000',
      '--host',
      'https://bitbucket.example.com',
      '--username',
      'ci-user',
      '--password',
      'token',
    ]);

    expect(createServer).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ port: 4000 }),
        credentials: expect.objectContaining({
          host: 'https://bitbucket.example.com',
          username: 'ci-user',
          password: 'token',
        }),
      }),
    );
    expect(serverMock.start).toHaveBeenCalled();
    expect(chunks.join('\n')).toContain('Server started on http://127.0.0.1:4000');
    expect(onceSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(onceSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

    onceSpy.mockRestore();
  });

  it('sends a shutdown request when the stop command is used', async () => {
    const createServer = jest.fn();
    const requestShutdown = jest.fn().mockResolvedValue(undefined);
    const stdout = createWritable().writable;
    const stderr = createWritable().writable;

    cli = buildCli({ createServer, requestShutdown, stdout, stderr });
    await cli.parseAsync(['node', 'bitbucket-mcp', 'stop', '--port', '4000']);

    expect(requestShutdown).toHaveBeenCalledWith(4000);
  });

  it('rejects invalid log levels', async () => {
    const createServer = jest.fn();
    const requestShutdown = jest.fn();
    const stdout = createWritable().writable;
    const stderr = createWritable().writable;

    cli = buildCli({ createServer, requestShutdown, stdout, stderr });
    cli.exitOverride((err) => {
      throw err;
    });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await expect(
      cli.parseAsync(['node', 'bitbucket-mcp', 'start', '--log-level', 'invalid']),
    ).rejects.toThrow('Invalid log level');
    expect(createServer).not.toHaveBeenCalled();

    exitSpy.mockRestore();
  });

  it('uses the default port when stopping without specifying one', async () => {
    const createServer = jest.fn();
    const { writable: stdout, chunks } = createWritable();
    const stderr = createWritable().writable;
    const requestShutdown = jest.fn().mockResolvedValue(undefined);

    cli = buildCli({ createServer, requestShutdown, stdout, stderr });
    await cli.parseAsync(['node', 'bitbucket-mcp', 'stop']);

    expect(requestShutdown).toHaveBeenCalledWith(3000);
    expect(chunks.join('\n')).toContain('http://127.0.0.1:3000');
  });

  it('performs shutdown requests using the default handler', async () => {
    const server = http.createServer((req, res) => {
      expect(req.method).toBe('POST');
      expect(req.url).toBe('/shutdown');
      res.statusCode = 202;
      res.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to obtain shutdown test port');
    }

    const { writable: stdout, chunks } = createWritable();
    const stderr = createWritable().writable;

    cli = buildCli({ stdout, stderr });
    cli.exitOverride((err) => {
      throw err;
    });

    await cli.parseAsync(['node', 'bitbucket-mcp', 'stop', '--port', String(address.port)]);

    expect(chunks.join('\n')).toContain(`http://127.0.0.1:${address.port}`);

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it('surfaces shutdown failures from the default handler', async () => {
    const server = http.createServer((_req, res) => {
      res.statusCode = 500;
      res.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to obtain shutdown failure test port');
    }

    const stdout = createWritable().writable;
    const stderr = createWritable().writable;

    cli = buildCli({ stdout, stderr });
    cli.exitOverride((err) => {
      throw err;
    });

    await expect(
      cli.parseAsync(['node', 'bitbucket-mcp', 'stop', '--port', String(address.port)]),
    ).rejects.toThrow('Shutdown request failed with status 500');

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
});
