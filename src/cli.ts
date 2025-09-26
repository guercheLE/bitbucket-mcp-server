#!/usr/bin/env node
import { Command } from "commander";

import { createServer } from "./server";

const program = new Command();

program
    .name("bitbucket-mcp")
    .description("Bitbucket MCP server CLI")
    .version("0.1.0");

program
    .command("start")
    .description("Start the Bitbucket MCP server")
    .option("--host <host>", "Bitbucket host", process.env.BITBUCKET_HOST ?? "https://api.bitbucket.org")
    .option("--token <token>", "Personal access token", process.env.BITBUCKET_TOKEN)
    .action(async (options: { host: string; token?: string }) => {
        const server = createServer();

        if (options.token) {
            server.getAuthenticationService().configure({ host: options.host, token: options.token });
        }

        await server.start();
        // eslint-disable-next-line no-console
        console.log(`Bitbucket MCP server listening using ${options.host}`);

        process.on("SIGINT", async () => {
            await server.stop();
            process.exit(0);
        });
    });

export const run = async (): Promise<void> => {
    await program.parseAsync(process.argv);
};

if (require.main === module) {
    run().catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
    });
}
