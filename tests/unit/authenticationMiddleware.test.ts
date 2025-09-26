import type { NextFunction, Request, Response } from "express";

import { createAuthenticationMiddleware } from "../../src/server/middleware/authentication";
import { AuthService, type AuthMethod, type AuthStrategy } from "../../src/services/authService";
import type { Logger } from "../../src/utils/logger";

const createLogger = (): Logger => {
    const logger: Partial<Logger> = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
        debug: jest.fn(),
        silly: jest.fn()
    };

    logger.child = jest.fn().mockReturnValue(logger as Logger);

    return logger as Logger;
};

const createRequest = (overrides: Partial<Request> = {}): Request => {
    return {
        path: "/mcp",
        url: "/mcp",
        headers: {},
        query: {},
        ...overrides
    } as Request;
};

const createResponse = (): Response & { status: jest.Mock; json: jest.Mock } => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        end: jest.fn()
    };

    return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
};

const createStrategy = <TInput = unknown>(
    name: AuthMethod,
    authenticate: (input: TInput) => Promise<{ authenticated: boolean; user?: { id: string; name: string } }>
): AuthStrategy<TInput> => ({
    name,
    authenticate
});

describe("authentication middleware", () => {
    it("skips authentication when no strategies are registered", async () => {
        const authService = new AuthService({ logger: createLogger() });
        const middleware = createAuthenticationMiddleware(authService);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn() as unknown as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("bypasses authentication for public paths", async () => {
        const authService = new AuthService({ logger: createLogger() });
        const strategy = createStrategy("oauth2", jest.fn().mockResolvedValue({ authenticated: true }));
        authService.registerStrategy(strategy);

        const middleware = createAuthenticationMiddleware(authService, { publicPaths: ["/health"] });

        const req = createRequest({ path: "/health", url: "/health" });
        const res = createResponse();
        const next = jest.fn() as unknown as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect((strategy.authenticate as jest.Mock)).not.toHaveBeenCalled();
    });

    it("rejects requests without credentials when strategies exist", async () => {
        const authService = new AuthService({ logger: createLogger() });
        const strategy = createStrategy("oauth2", jest.fn().mockResolvedValue({ authenticated: true }));
        authService.registerStrategy(strategy);

        const middleware = createAuthenticationMiddleware(authService);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn() as unknown as NextFunction;

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing authentication credentials" });
        expect(next).not.toHaveBeenCalled();
    });

    it("authenticates successfully and attaches user context", async () => {
        const authService = new AuthService({ logger: createLogger() });
        const strategy = createStrategy("oauth2", jest.fn().mockResolvedValue({
            authenticated: true,
            user: { id: "123", name: "Jane Admin" }
        }));
        authService.registerStrategy(strategy);

        const middleware = createAuthenticationMiddleware(authService);

        const req = createRequest({
            headers: {
                authorization: "Bearer valid-token"
            } as Record<string, string>
        });
        const res = createResponse();
        const next = jest.fn() as unknown as NextFunction;

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        const requestWithAuth = req as unknown as { user?: { id?: string; name?: string }; auth?: { method?: string | null } };
        expect(requestWithAuth.user).toEqual({ id: "123", name: "Jane Admin" });
        expect(requestWithAuth.auth?.method).toBe("oauth2");
        expect((strategy.authenticate as jest.Mock)).toHaveBeenCalledWith({ accessToken: "valid-token" });
    });

    it("rejects when authentication fails", async () => {
        const authService = new AuthService({ logger: createLogger() });
        const strategy = createStrategy("oauth2", jest.fn().mockResolvedValue({ authenticated: false }));
        authService.registerStrategy(strategy);

        const middleware = createAuthenticationMiddleware(authService);

        const req = createRequest({
            headers: {
                authorization: "Bearer invalid-token"
            } as Record<string, string>
        });
        const res = createResponse();
        const next = jest.fn() as unknown as NextFunction;

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Authentication failed" });
        expect(next).not.toHaveBeenCalled();
    });
});
