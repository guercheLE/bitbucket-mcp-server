import { AuthConfigSchema } from "../../src/models/config";
import { AuthService, type AuthCredentials, type AuthMethod, type AuthStrategy } from "../../src/services/authService";
import type { Logger } from "../../src/utils/logger";

describe("authentication contracts", () => {
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

    const buildService = (strategies: Partial<Record<AuthMethod, AuthStrategy>>, priority: AuthMethod[] = ["oauth2", "bearer", "apiKey", "basic"]) => {
        const config = AuthConfigSchema.parse({ priority });
        return new AuthService({ strategies, config, logger: createLogger() });
    };

    describe("oauth2Contract", () => {
        it("authenticates successfully when the access token is valid", async () => {
            const authenticate = jest.fn().mockResolvedValue({
                authenticated: true,
                user: { id: "123", name: "Jane Admin" }
            });

            const service = buildService({
                oauth2: {
                    name: "oauth2",
                    authenticate
                }
            });

            const result = await service.authenticateOAuth2({ accessToken: "valid-token" });

            expect(result).toEqual({
                authenticated: true,
                user: { id: "123", name: "Jane Admin" }
            });
            expect(authenticate).toHaveBeenCalledWith({ accessToken: "valid-token" });
        });

        it("returns an unauthenticated response when the access token is invalid", async () => {
            const authenticate = jest.fn().mockResolvedValue({ authenticated: false });
            const service = buildService({
                oauth2: {
                    name: "oauth2",
                    authenticate
                }
            });

            const result = await service.authenticateOAuth2({ accessToken: "invalid-token" });

            expect(result).toEqual({ authenticated: false });
            expect(authenticate).toHaveBeenCalledWith({ accessToken: "invalid-token" });
        });
    });

    describe("authFallbackContract", () => {
        const buildCredentials = (overrides: Partial<AuthCredentials> = {}): AuthCredentials => ({
            oauth2: { accessToken: "token" },
            bearer: { token: "bearer-token" },
            apiKey: { key: "api-key" },
            basic: { username: "user", password: "pass" },
            ...overrides
        });

        it("uses the highest priority strategy that succeeds", async () => {
            const strategies: Partial<Record<AuthMethod, AuthStrategy>> = {
                oauth2: { name: "oauth2", authenticate: jest.fn().mockResolvedValue({ authenticated: false }) },
                bearer: { name: "bearer", authenticate: jest.fn().mockResolvedValue({ authenticated: false }) },
                apiKey: { name: "apiKey", authenticate: jest.fn().mockResolvedValue({ authenticated: true, user: { id: "42", name: "API" } }) }
            };

            const service = buildService(strategies);

            const result = await service.authenticateWithFallback(buildCredentials(), ["oauth2", "bearer", "apiKey"]);

            expect(result).toEqual({
                methodUsed: "apiKey",
                authenticated: true,
                user: { id: "42", name: "API" }
            });
            expect((strategies.oauth2 as AuthStrategy).authenticate).toHaveBeenCalled();
            expect((strategies.bearer as AuthStrategy).authenticate).toHaveBeenCalled();
            expect((strategies.apiKey as AuthStrategy).authenticate).toHaveBeenCalledWith({ key: "api-key" });
        });

        it("returns unauthenticated when all strategies fail", async () => {
            const strategies: Partial<Record<AuthMethod, AuthStrategy>> = {
                oauth2: { name: "oauth2", authenticate: jest.fn().mockResolvedValue({ authenticated: false }) },
                bearer: { name: "bearer", authenticate: jest.fn().mockResolvedValue({ authenticated: false }) }
            };

            const service = buildService(strategies, ["oauth2", "bearer"]);

            const result = await service.authenticateWithFallback(buildCredentials(), ["oauth2", "bearer"]);

            expect(result).toEqual({ authenticated: false, methodUsed: null });
            expect((strategies.oauth2 as AuthStrategy).authenticate).toHaveBeenCalled();
            expect((strategies.bearer as AuthStrategy).authenticate).toHaveBeenCalled();
        });
    });
});
