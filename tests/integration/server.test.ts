import { createServer } from "../../src/server";

describe("Server startup", () => {
    it("starts and registers the core discovery tools", async () => {
        const server = createServer();
        await server.start();

        expect(server.isRunning()).toBe(true);
        expect(server.listTools()).toEqual(expect.arrayContaining(["search-ids", "get-id", "call-id"]));

        await server.stop();
        expect(server.isRunning()).toBe(false);
    });

    it("does not throw when start is called more than once", async () => {
        const server = createServer();
        await server.start();
        await expect(server.start()).resolves.not.toThrow();
        await server.stop();
    });
});
