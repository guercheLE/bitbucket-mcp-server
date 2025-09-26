import { Command, CommanderError } from "commander";

import pkg from "../../package.json";

import { DefaultCommandMapper, type CommandMapper } from "./command-mapper";
import { createMcpService, type McpService, type McpServiceDependencies } from "./mcp-service";
import type { CapabilityDiscoveryResult, ConsoleClientConfig } from "./types";

export interface ConsoleClientDependencies {
    createMcpService?: (config: ConsoleClientConfig, dependencies: McpServiceDependencies) => McpService;
    createCommandMapper?: (
        program: Command,
        service: McpService,
        io: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream }
    ) => CommandMapper;
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
    program.name("mcp-client").description("Console client for the Bitbucket MCP server");
    if (pkg.version) {
        program.version(pkg.version);
    }
    program.exitOverride((err) => {
        throw err;
    });

    program.configureOutput({
        writeOut: (str) => stdout.write(str),
        writeErr: (str) => stderr.write(str)
    });

    const serviceFactory = dependencies.createMcpService ?? createMcpService;
    const serviceDependencies = dependencies.serviceDependencies ?? {};
    const service = serviceFactory(config, serviceDependencies);

    const mapperFactory =
        dependencies.createCommandMapper ??
        ((cmd: Command, svc: McpService, io: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream }) =>
            new DefaultCommandMapper(cmd, svc, io.stdout, io.stderr));
    const mapper = mapperFactory(program, service, { stdout, stderr });

    return { program, service, mapper };
};

export const run = async (
    argv: string[] = process.argv,
    config: ConsoleClientConfig = {},
    dependencies: ConsoleClientDependencies = {}
): Promise<void> => {
    const { program, service, mapper } = buildClient(config, dependencies);

    try {
        await service.connect();
        const capabilities = await service.discoverCapabilities();
        mapper.registerCapabilities(capabilities);

        ensureCommandSupported(program, argv);

        await program.parseAsync(argv);
    } catch (error) {
        if (error instanceof CommanderError && error.code === "commander.helpDisplayed") {
            return;
        }
        throw error;
    } finally {
        try {
            await service.disconnect();
        } catch {
            // Swallow disconnect errors so they don't mask the primary failure.
        }
    }
};

const ensureCommandSupported = (program: Command, argv: string[]): void => {
    const commandName = argv
        .slice(2)
        .find((arg) => !arg.startsWith("-"));

    if (!commandName) {
        return;
    }

    if (commandName === "help") {
        return;
    }

    const supported = program.commands.some((cmd) => cmd.name() === commandName);
    if (!supported) {
        throw new Error(`Command "${commandName}" is not supported by the server.`);
    }
};

export const registerCapabilities = (mapper: CommandMapper, capabilities: CapabilityDiscoveryResult): void => {
    mapper.registerCapabilities(capabilities);
};

export * from "./command-mapper";
export * from "./mcp-service";
export * from "./types";

