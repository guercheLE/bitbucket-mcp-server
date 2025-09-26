import type { Handler } from "express";
import client from "prom-client";

export interface MetricsServiceOptions {
    prefix?: string;
    collectDefault?: boolean;
}

export interface RecordRequestOptions {
    route: string;
    method: string;
    statusCode: number;
    durationMs: number;
}

export class MetricsService {
    private readonly registry: client.Registry;
    private readonly requestCounter: client.Counter<string>;
    private readonly requestDuration: client.Histogram<string>;
    private readonly enabledDefaultMetrics: boolean;

    constructor(options: MetricsServiceOptions = {}) {
        this.registry = new client.Registry();
        this.registry.setDefaultLabels({ service: "bitbucket-mcp-server" });

        this.requestCounter = new client.Counter({
            name: `${options.prefix ?? ""}http_requests_total`,
            help: "Total number of HTTP requests",
            labelNames: ["method", "route", "status"],
            registers: [this.registry]
        });

        this.requestDuration = new client.Histogram({
            name: `${options.prefix ?? ""}http_request_duration_seconds`,
            help: "Duration of HTTP requests in seconds",
            labelNames: ["method", "route", "status"],
            buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
            registers: [this.registry]
        });

        this.enabledDefaultMetrics = options.collectDefault ?? true;
        if (this.enabledDefaultMetrics) {
            client.collectDefaultMetrics({ register: this.registry });
        }
    }

    recordHttpRequest(options: RecordRequestOptions): void {
        const labels = {
            method: options.method,
            route: options.route,
            status: String(options.statusCode)
        };
        this.requestCounter.inc(labels);
        this.requestDuration.observe(labels, options.durationMs / 1000);
    }

    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    createHandler(): Handler {
        return async (_req, res) => {
            res.setHeader("Content-Type", this.registry.contentType);
            res.send(await this.getMetrics());
        };
    }
}

export const createMetricsService = (options?: MetricsServiceOptions): MetricsService => new MetricsService(options);
