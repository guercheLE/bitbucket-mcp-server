import { Writable } from "node:stream";

import { transports } from "winston";

import { createLogger } from "../../src/utils/logger";

describe("logger sanitization", () => {
    it("redacts sensitive fields from log metadata", async () => {
        const messages: string[] = [];
        const captureStream = new transports.Stream({
            stream: new Writable({
                write(chunk, _encoding, callback) {
                    messages.push(chunk.toString());
                    callback();
                }
            })
        });

        const logger = createLogger({ level: "debug", transports: [captureStream] });

        logger.info("Connecting to Bitbucket", {
            username: "ci-user",
            password: "super-secret",
            token: "abc-123",
            nested: {
                password: "another-secret",
                authorization: "Bearer something"
            }
        });

        await new Promise((resolve) => setImmediate(resolve));

        const output = messages.join("\n");
        expect(output).not.toContain("super-secret");
        expect(output).not.toContain("abc-123");
        expect(output).not.toContain("another-secret");
        expect(output).not.toContain("Bearer something");
        expect(output).toContain("[REDACTED]");
    });
});
