import type { Request, Response } from "express";

import { createRateLimiter } from "../../src/server/security/rateLimiter";

type RateLimitOptions = {
    keyGenerator: (req: Request) => string;
    handler: (req: Request, res: Response, next: () => void, options?: { message?: unknown }) => void;
};

type RateLimitMock = jest.Mock<jest.Mock, [RateLimitOptions]> & { lastOptions?: RateLimitOptions };

jest.mock("express-rate-limit", () => {
    const rateLimit = Object.assign(
        jest.fn((options: RateLimitOptions) => {
            rateLimit.lastOptions = options;
            return jest.fn();
        }),
        { lastOptions: undefined as RateLimitOptions | undefined }
    ) as RateLimitMock;

    return rateLimit;
});

const rateLimitMock = jest.requireMock("express-rate-limit") as RateLimitMock;

describe("createRateLimiter", () => {
    beforeEach(() => {
        rateLimitMock.mockClear();
        rateLimitMock.lastOptions = undefined;
    });

    const buildRequest = (overrides: Partial<Request> = {}): Request => {
        return {
            ip: "203.0.113.5",
            headers: {},
            ...overrides
        } as Request;
    };

    it("combines IP and user identifier for default keys", () => {
        const handler = createRateLimiter();
        expect(typeof handler).toBe("function");

        const options = rateLimitMock.lastOptions as RateLimitOptions;
        expect(options).toBeDefined();

        const req = buildRequest({
            ip: "",
            headers: {
                "x-user-id": "user-123",
                "x-forwarded-for": "198.51.100.20"
            }
        });

        const key = options.keyGenerator(req);
        expect(key).toBe("198.51.100.20:user-123");
    });

    it("falls back to anonymous when no user identifier is present", () => {
        createRateLimiter();
        const options = rateLimitMock.lastOptions as RateLimitOptions;

        const req = buildRequest();
        const key = options.keyGenerator(req);

        expect(key).toBe("203.0.113.5:anonymous");
    });

    it("uses request user context when headers are absent", () => {
        createRateLimiter();
        const options = rateLimitMock.lastOptions as RateLimitOptions;

        const req = buildRequest({
        });
        (req as Request & { user?: { id?: string } }).user = { id: "context-user" };

        const key = options.keyGenerator(req);
        expect(key).toBe("203.0.113.5:context-user");
    });

    it("supports custom user extraction logic", () => {
        createRateLimiter({
            userIdExtractor: () => "custom"
        });

        const options = rateLimitMock.lastOptions as RateLimitOptions;
        const key = options.keyGenerator(buildRequest());

        expect(key).toBe("203.0.113.5:custom");
    });

    it("uses the default handler to return 429 responses", () => {
        createRateLimiter();
        const options = rateLimitMock.lastOptions as RateLimitOptions;

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as Response;

        options.handler(buildRequest(), res, jest.fn(), {});

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.send).toHaveBeenCalledWith({ status: 429, message: "Too many requests" });
    });

    it("passes through custom handler implementations", () => {
        const customHandler = jest.fn();
        const handler = createRateLimiter({ handler: customHandler });

        const options = rateLimitMock.lastOptions as RateLimitOptions;
        expect(options.handler).toBe(customHandler);
        expect(typeof handler).toBe("function");
    });
});
