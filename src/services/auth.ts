import axios, { AxiosInstance } from "axios";

export type BitbucketEnvironment = "cloud" | "data-center";

export interface AuthenticationConfig {
    host: string;
    token: string;
}

const ensureProtocol = (host: string): string => {
    if (host.startsWith("http://") || host.startsWith("https://")) {
        return host;
    }
    return `https://${host}`;
};

export class AuthenticationService {
    private config: AuthenticationConfig | null = null;

    configure(config: AuthenticationConfig): void {
        if (!config.host || !config.token) {
            throw new Error("Both host and token are required to configure authentication");
        }

        this.config = {
            host: ensureProtocol(config.host).replace(/\/$/, ""),
            token: config.token
        };
    }

    detectEnvironment(host: string): BitbucketEnvironment {
        const normalized = ensureProtocol(host).toLowerCase();
        return normalized.includes("bitbucket.org") ? "cloud" : "data-center";
    }

    isConfigured(): boolean {
        return this.config !== null;
    }

    createHttpClient(): AxiosInstance {
        if (!this.config) {
            throw new Error("Authentication service is not configured");
        }

        return axios.create({
            baseURL: this.config.host,
            headers: this.getAuthHeaders()
        });
    }

    getAuthHeaders(): Record<string, string> {
        if (!this.config) {
            throw new Error("Authentication service is not configured");
        }

        return {
            Authorization: `Bearer ${this.config.token}`
        };
    }
}
