import { Writable } from 'node:stream';

import { Command } from 'commander';

import { DefaultCommandMapper } from '../../../src/client/command-mapper';
import type { McpService } from '../../../src/client/mcp-service';
import type { CapabilityDiscoveryResult } from '../../../src/client/types';

const createBuffer = () => {
  const chunks: string[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return {
    writable,
    value: () => chunks.join(''),
  };
};

describe('DefaultCommandMapper', () => {
  const capabilities = {
    tools: [
      {
        name: 'search-ids',
        title: 'Semantic Search',
        description: 'Search Bitbucket operations',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search term' },
          { name: 'limit', type: 'number', required: false, description: 'Maximum results' },
          {
            name: 'include-archived',
            type: 'boolean',
            required: false,
            description: 'Include archived results',
          },
        ],
      },
      {
        name: 'get-id',
        title: 'Retrieve Schema',
        description: 'Retrieve schema for a Bitbucket operation',
        parameters: [
          {
            name: 'endpoint-id',
            type: 'string',
            required: true,
            description: 'Operation identifier',
          },
        ],
      },
    ],
  } as unknown as CapabilityDiscoveryResult;

  const createProgram = () => {
    const program = new Command();
    program.exitOverride((err) => {
      throw err;
    });
    const stdout = createBuffer();
    const stderr = createBuffer();
    program.configureOutput({
      writeOut: (str) => stdout.writable.write(str),
      writeErr: (str) => stderr.writable.write(str),
    });
    return { program, stdout, stderr };
  };

  const createService = (): McpService & { executeTool: jest.Mock } => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    discoverCapabilities: jest.fn(),
    executeTool: jest.fn().mockResolvedValue({ ok: true }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers commands with options derived from capability metadata', async () => {
    const { program } = createProgram();
    const service = createService();
    const mapper = new DefaultCommandMapper(program, service);

    mapper.registerCapabilities(capabilities);

    const names = program.commands.map((cmd) => cmd.name());
    expect(names).toEqual(['get-id', 'search-ids']);

    const searchCommand = program.commands.find((cmd) => cmd.name() === 'search-ids');
    expect(searchCommand?.description()).toContain('Semantic Search');
    expect(searchCommand?.options.map((opt) => opt.flags)).toEqual([
      '--query <query>',
      '--limit <limit>',
      '--include-archived <include-archived>',
    ]);
  });

  it('invokes the MCP service when a registered command is executed', async () => {
    const { program } = createProgram();
    const service = createService();
    const mapper = new DefaultCommandMapper(program, service);
    mapper.registerCapabilities(capabilities);

    await program.parseAsync([
      'node',
      'cli',
      'search-ids',
      '--query',
      'projects',
      '--limit',
      '5',
      '--include-archived',
      'true',
    ]);

    expect(service.executeTool).toHaveBeenCalledWith('search-ids', {
      'include-archived': true,
      limit: 5,
      query: 'projects',
    });
  });

  it('surfaces MCP execution errors to stderr and rethrows them', async () => {
    const { program, stderr } = createProgram();
    const service = createService();
    const failure = new Error('tool execution failed');
    service.executeTool.mockRejectedValue(failure);

    const mapper = new DefaultCommandMapper(program, service, undefined, stderr.writable);
    mapper.registerCapabilities(capabilities);

    await expect(
      program.parseAsync(['node', 'cli', 'search-ids', '--query', 'projects', '--limit', '5']),
    ).rejects.toThrow(failure);

    expect(stderr.value()).toContain('tool execution failed');
  });
});
