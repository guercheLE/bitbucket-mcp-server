import { run } from "./cli";
import { createServer } from "./server";

export const bootstrap = async () => {
    const server = createServer();
    await server.start();
    return server;
};

export * from "./server";
export * from "./services/auth";
export * from "./services/discovery";
export * from "./services/execution";
export * from "./services/search";

if (require.main === module) {
    run().catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
    });
}
