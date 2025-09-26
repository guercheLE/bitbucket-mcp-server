import { Command } from "commander";

import { DefaultCommandMapper, type CommandMapper } from "./command-mapper";
import { createMcpService, type McpService, type McpServiceDependencies } from "./mcp-service";
import type { CapabilityDiscoveryResult, ConsoleClientConfig } from "./types";

export interface ConsoleClientDependencies {
    createMcpService?: (config: ConsoleClientConfig, dependencies: McpServiceDependencies) => McpService;
    createCommandMapper?: (program: Command, service: McpService) => CommandMapper;
    serviceDependencies?: McpServiceDependencies;
    stdout?: NodeJS.WritableStream;
    stderr?: NodeJS.WritableStream;
}

export interface BuildClientResult {
    program: Command;
    service: McpService;
    mapper: CommandMapper;
}

export const buildClient = (
    config: ConsoleClientConfig = {},
    dependencies: ConsoleClientDependencies = {}
): BuildClientResult => {
    const stdout = dependencies.stdout ?? process.stdout;
    const stderr = dependencies.stderr ?? process.stderr;

    const program = new Command();
    program.name("bitbucket-mcp-client").description("Console client for the Bitbucket MCP server");

    program.configureOutput({
        writeOut: (str) => stdout.write(str),
        writeErr: (str) => stderr.write(str)
    });

    const serviceFactory = dependencies.createMcpService ?? createMcpService;
    const serviceDependencies = dependencies.serviceDependencies ?? {};
    const service = serviceFactory(config, serviceDependencies);

    const mapperFactory = dependencies.createCommandMapper ?? ((cmd: Command, _service: McpService) => new DefaultCommandMapper(cmd));
    const mapper = mapperFactory(program, service);

    return { program, service, mapper };
};

export const run = async (
    argv: string[] = process.argv,
    config: ConsoleClientConfig = {},
    dependencies: ConsoleClientDependencies = {}
): Promise<void> => {
    const { program } = buildClient(config, dependencies);
    await program.parseAsync(argv);
};

export const registerCapabilities = (mapper: CommandMapper, capabilities: CapabilityDiscoveryResult): void => {
    mapper.registerCapabilities(capabilities);
};

export * from "./command-mapper";
export * from "./mcp-service";
export * from "./types";

