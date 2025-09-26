import type { AuthConfig } from "../models/config";
import { AuthConfigSchema } from "../models/config";
import type { Logger } from "../utils/logger";
import { createLogger } from "../utils/logger";

export type AuthMethod = "oauth2" | "bearer" | "apiKey" | "basic";

export interface AuthCredentials {
    oauth2?: { accessToken: string };
    bearer?: { token: string };
    apiKey?: { key: string };
    basic?: { username: string; password: string };
    [key: string]: unknown;
}

export interface AuthResult {
    authenticated: boolean;
    user?: { id: string; name: string };
}

export interface AuthFallbackResult extends AuthResult {
    methodUsed: AuthMethod | null;
}

export interface AuthStrategy<TInput = unknown> {
    name: AuthMethod;
    authenticate(input: TInput): Promise<AuthResult>;
    canHandle?(credentials: AuthCredentials): boolean;
}

export interface AuthServiceOptions {
    strategies?: Partial<Record<AuthMethod, AuthStrategy>>;
    config?: Partial<AuthConfig>;
    logger?: Logger;
}

const DEFAULT_PRIORITY: AuthMethod[] = ["oauth2", "bearer", "apiKey", "basic"];

const createDefaultLogger = (): Logger => createLogger({ defaultMeta: { scope: "auth-service" } });

export class AuthService {
    private readonly strategies: Map<AuthMethod, AuthStrategy>;
    private readonly logger: Logger;
    private readonly config: AuthConfig;

    constructor(options: AuthServiceOptions = {}) {
        this.logger = options.logger ?? createDefaultLogger();
        this.config = AuthConfigSchema.parse({ priority: options.config?.priority ?? DEFAULT_PRIORITY });
        this.strategies = new Map<AuthMethod, AuthStrategy>();

        if (options.strategies) {
            for (const [method, strategy] of Object.entries(options.strategies) as [AuthMethod, AuthStrategy][]) {
                if (strategy) {
                    this.registerStrategy(strategy);
                }
            }
        }
    }

    registerStrategy(strategy: AuthStrategy): void {
        this.strategies.set(strategy.name, strategy);
    }

    hasStrategy(method: AuthMethod): boolean {
        return this.strategies.has(method);
    }

    hasStrategies(): boolean {
        return this.strategies.size > 0;
    }

    getRegisteredStrategies(): AuthMethod[] {
        return Array.from(this.strategies.keys());
    }

    getPriority(): AuthMethod[] {
        return [...this.config.priority];
    }

    async authenticateOAuth2(payload: { accessToken: string }): Promise<AuthResult> {
        const strategy = this.strategies.get("oauth2");
        if (!strategy) {
            this.logger.warn("OAuth2 strategy not configured");
            return { authenticated: false };
        }

        try {
            return await strategy.authenticate(payload);
        } catch (error) {
            this.logger.error("OAuth2 authentication failed", { error: (error as Error).message });
            return { authenticated: false };
        }
    }

    async authenticateWithFallback(credentials: AuthCredentials, preferredOrder?: AuthMethod[]): Promise<AuthFallbackResult> {
        const order = preferredOrder && preferredOrder.length > 0 ? preferredOrder : this.config.priority;

        for (const method of order) {
            const strategy = this.strategies.get(method);
            if (!strategy) {
                this.logger.debug("Authentication strategy not available", { method });
                continue;
            }

            if (typeof strategy.canHandle === "function" && !strategy.canHandle(credentials)) {
                this.logger.debug("Skipping authentication strategy", { method, reason: "canHandle returned false" });
                continue;
            }

            const input = credentials[method];
            if (!input) {
                this.logger.debug("Skipping authentication strategy", { method, reason: "missing credentials" });
                continue;
            }

            try {
                const result = await strategy.authenticate(input);
                if (result.authenticated) {
                    return { ...result, methodUsed: method };
                }
            } catch (error) {
                this.logger.warn("Authentication strategy failed", { method, error: (error as Error).message });
            }
        }

        return { authenticated: false, methodUsed: null };
    }
}

export default AuthService;
