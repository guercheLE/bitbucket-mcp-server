import type { Handler } from 'express';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

/**
 * Provides typed helpers around `prom-client` to expose consistent metrics for the
 * Bitbucket MCP server. Metrics emitted here power the `/metrics` endpoint and
 * support health instrumentation during automated maintenance workflows.
 */

/**
 * Configuration flags that influence how metrics are registered with Prometheus.
 *
 * @property prefix Optional namespace prepended to each metric name allowing multiple instances to coexist.
 * @property collectDefault Controls whether `prom-client` should register its default process metrics.
 */
export interface MetricsServiceOptions {
  prefix?: string;
  collectDefault?: boolean;
}

/**
 * Describes a completed HTTP request that should be recorded for observability.
 */
export interface RecordRequestOptions {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
}

/**
 * Captures the latency of an internal operation so it can be surfaced via histograms.
 */
export interface RecordApiLatencyOptions {
  operation: string;
  durationMs: number;
}

/**
 * Represents the outcome of a health probe. When duration is provided we also record
 * latency under the `health` operation bucket.
 */
export interface RecordHealthCheckOptions {
  success: boolean;
  durationMs?: number;
}

/**
 * Central registry that encapsulates all metrics exposed by the HTTP server. The class
 * wires up counters, histograms, and gauges needed to satisfy operational requirements.
 */
export class MetricsService {
  private readonly registry: Registry;
  private readonly requestCounter: Counter<string>;
  private readonly requestDuration: Histogram<string>;
  private readonly healthCheckGauge: Gauge<string>;
  private readonly apiLatency: Histogram<string>;
  private readonly enabledDefaultMetrics: boolean;

  /**
   * Creates a metrics service with optional customisation for namespaces and default collection.
   *
   * @param options Controls prefixing and whether default `prom-client` metrics are registered.
   */
  constructor(options: MetricsServiceOptions = {}) {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ service: '@guerchele/bitbucket-mcp-server' });

    this.requestCounter = new Counter({
      name: `${options.prefix ?? ''}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: `${options.prefix ?? ''}http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.healthCheckGauge = new Gauge({
      name: `${options.prefix ?? ''}health_check_success_rate`,
      help: 'Indicator of the latest health check result (1 = healthy, 0 = degraded)',
      registers: [this.registry],
    });

    this.apiLatency = new Histogram({
      name: `${options.prefix ?? ''}api_latency`,
      help: 'Latency of internal API operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.enabledDefaultMetrics = options.collectDefault ?? true;
    if (this.enabledDefaultMetrics) {
      collectDefaultMetrics({ register: this.registry });
    }
  }

  /**
   * Records a single HTTP request including count and duration. Routes are labelled using
   * the resolved Express path to ensure aggregation works under variable parameters.
   */
  recordHttpRequest(options: RecordRequestOptions): void {
    const labels = {
      method: options.method,
      route: options.route,
      status: String(options.statusCode),
    };
    this.requestCounter.inc(labels);
    this.requestDuration.observe(labels, options.durationMs / 1000);
  }

  /**
   * Observes the latency (in milliseconds) for a named operation and emits it to the latency histogram.
   */
  recordApiLatency(options: RecordApiLatencyOptions): void {
    this.apiLatency.observe({ operation: options.operation }, options.durationMs / 1000);
  }

  /**
   * Publishes the latest health probe result for the `/health` endpoint. When a duration is supplied
   * it is forwarded to {@link recordApiLatency} so health latency trends are available.
   */
  recordHealthCheck(options: RecordHealthCheckOptions): void {
    this.healthCheckGauge.set(options.success ? 1 : 0);
    if (typeof options.durationMs === 'number') {
      this.recordApiLatency({ operation: 'health', durationMs: options.durationMs });
    }
  }

  /**
   * Serialises all registered metrics in Prometheus exposition format.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Produces an Express handler that returns the latest metrics payload with content type headers set.
   */
  createHandler(): Handler {
    return async (_req, res) => {
      res.setHeader('Content-Type', this.registry.contentType);
      res.send(await this.getMetrics());
    };
  }
}

/**
 * Factory wrapper to mirror the pattern used across other services, making dependency
 * injection and testing more ergonomic.
 */
export const createMetricsService = (options?: MetricsServiceOptions): MetricsService =>
  new MetricsService(options);
