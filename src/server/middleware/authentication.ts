import type { NextFunction, Request, Response } from "express";

import type { AuthCredentials, AuthMethod, AuthService } from "../../services/authService";
import type { Logger } from "../../utils/logger";

export interface AuthenticationMiddlewareOptions {
    publicPaths?: Array<string | RegExp>;
    priority?: AuthMethod[];
    logger?: Logger;
}

interface RequestWithAuthContext extends Request {
    user?: { id?: string; name?: string };
    auth?: { method?: AuthMethod | null };
}

const DEFAULT_PUBLIC_PATHS = ["/health"] as const;

const isPublicPath = (pathname: string, patterns: Array<string | RegExp>): boolean => {
    return patterns.some((pattern) => {
        if (typeof pattern === "string") {
            if (pattern.endsWith("*")) {
                return pathname.startsWith(pattern.slice(0, -1));
            }
            return pathname === pattern;
        }
        return pattern.test(pathname);
    });
};

const parseBasicCredentials = (header: string): { username: string; password: string } | null => {
    if (!header.toLowerCase().startsWith("basic ")) {
        return null;
    }

    const encoded = header.slice(6).trim();
    if (!encoded) {
        return null;
    }

    try {
        const decoded = Buffer.from(encoded, "base64").toString("utf8");
        const separatorIndex = decoded.indexOf(":");
        if (separatorIndex === -1) {
            return null;
        }
        const username = decoded.slice(0, separatorIndex);
        const password = decoded.slice(separatorIndex + 1);
        if (!username) {
            return null;
        }
        return { username, password };
    } catch {
        return null;
    }
};

const extractCredentials = (req: Request): AuthCredentials => {
    const credentials: AuthCredentials = {};
    const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization.trim() : null;

    if (authorization) {
        if (authorization.toLowerCase().startsWith("bearer ")) {
            const token = authorization.slice(7).trim();
            if (token) {
                credentials.oauth2 = { accessToken: token };
                credentials.bearer = { token };
            }
        } else {
            const basic = parseBasicCredentials(authorization);
            if (basic) {
                credentials.basic = basic;
            }
        }
    }

    const accessTokenHeader = typeof req.headers["x-access-token"] === "string" ? req.headers["x-access-token"].trim() : null;
    if (accessTokenHeader) {
        credentials.oauth2 = { accessToken: accessTokenHeader };
    }

    const bearerHeader = typeof req.headers["x-auth-token"] === "string" ? req.headers["x-auth-token"].trim() : null;
    if (bearerHeader) {
        credentials.bearer = { token: bearerHeader };
    }

    const apiKeyHeader = typeof req.headers["x-api-key"] === "string" ? req.headers["x-api-key"].trim() : null;
    if (apiKeyHeader) {
        credentials.apiKey = { key: apiKeyHeader };
    }

    const extractQueryValue = (value: unknown): string | null => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : null;
        }

        if (Array.isArray(value)) {
            for (const entry of value) {
                const normalized = extractQueryValue(entry);
                if (normalized) {
                    return normalized;
                }
            }
        }

        return null;
    };

    const accessTokenQuery = extractQueryValue(req.query.access_token);
    if (accessTokenQuery) {
        credentials.oauth2 = { accessToken: accessTokenQuery };
    }

    const apiKeyQuery = extractQueryValue(req.query.apiKey);
    if (apiKeyQuery) {
        credentials.apiKey = { key: apiKeyQuery };
    }

    return credentials;
};

const hasCredentials = (credentials: AuthCredentials): boolean => {
    return Object.keys(credentials).length > 0;
};

export const createAuthenticationMiddleware = (
    authService: AuthService,
    options: AuthenticationMiddlewareOptions = {}
) => {
    const logger = options.logger;
    const publicPaths = [...DEFAULT_PUBLIC_PATHS, ...(options.publicPaths ?? [])];

    return async (req: Request, res: Response, next: NextFunction) => {
        if (!authService.hasStrategies()) {
            return next();
        }

        const pathname = req.path ?? req.url ?? "";
        if (isPublicPath(pathname, publicPaths)) {
            return next();
        }

        const credentials = extractCredentials(req);
        if (!hasCredentials(credentials)) {
            logger?.warn?.("Authentication credentials missing", { path: pathname });
            return res.status(401).json({ error: "Missing authentication credentials" });
        }

        try {
            const preferredOrder = options.priority ?? authService.getPriority();
            const result = await authService.authenticateWithFallback(credentials, preferredOrder);

            if (!result.authenticated) {
                logger?.warn?.("Authentication failed", { path: pathname, strategies: authService.getRegisteredStrategies() });
                return res.status(401).json({ error: "Authentication failed" });
            }

            const requestWithAuth = req as RequestWithAuthContext;
            if (result.user) {
                requestWithAuth.user = result.user;
            }
            requestWithAuth.auth = { method: result.methodUsed ?? null };

            return next();
        } catch (error) {
            logger?.error?.("Authentication middleware error", { error: (error as Error).message, path: pathname });
            return res.status(401).json({ error: "Authentication error" });
        }
    };
};

export type { RequestWithAuthContext };
