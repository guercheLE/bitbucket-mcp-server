import type { Handler } from "express";

import { MetricsService } from "../../src/services/metricsService";

type CounterMock = {
    inc: jest.Mock;
};

type HistogramMock = {
    observe: jest.Mock;
};

type GaugeMock = {
    set: jest.Mock;
};

type RegistryMock = {
    setDefaultLabels: jest.Mock;
    metrics: jest.Mock<Promise<string>, []>;
    contentType: string;
};

type CollectDefaultMetricsMock = jest.Mock;

jest.mock("prom-client", () => {
    const counterMock: CounterMock = { inc: jest.fn() };
    const histogramMock: HistogramMock = { observe: jest.fn() };
    const gaugeMock: GaugeMock = { set: jest.fn() };
    const registryMock: RegistryMock = {
        setDefaultLabels: jest.fn(),
        metrics: jest.fn().mockResolvedValue("metrics"),
        contentType: "text/plain"
    };

    const collectDefaultMetrics: CollectDefaultMetricsMock = jest.fn();

    const Counter = jest.fn(() => counterMock);
    const Histogram = jest.fn(() => histogramMock);
    const Gauge = jest.fn(() => gaugeMock);
    const Registry = jest.fn(() => registryMock);

    return {
        __esModule: true,
        default: {
            Counter,
            Histogram,
            Gauge,
            Registry,
            collectDefaultMetrics
        },
        Counter,
        Histogram,
        Gauge,
        Registry,
        collectDefaultMetrics,
        _mocks: {
            counterMock,
            histogramMock,
            gaugeMock,
            registryMock
        }
    };
});

const promClient = jest.requireMock("prom-client");
const counterMock: CounterMock = promClient._mocks.counterMock;
const histogramMock: HistogramMock = promClient._mocks.histogramMock;
const gaugeMock: GaugeMock = promClient._mocks.gaugeMock;
const registryMock: RegistryMock = promClient._mocks.registryMock;
const collectDefaultMetrics: CollectDefaultMetricsMock = promClient.collectDefaultMetrics;

const Counter = promClient.Counter as jest.Mock;
const Histogram = promClient.Histogram as jest.Mock;
const Gauge = promClient.Gauge as jest.Mock;
const Registry = promClient.Registry as jest.Mock;

describe("MetricsService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        registryMock.metrics.mockResolvedValue("metrics");
        registryMock.contentType = "text/plain";
    });

    it("records HTTP requests with default configuration", async () => {
        const service = new MetricsService();

        service.recordHttpRequest({
            route: "/health",
            method: "GET",
            statusCode: 200,
            durationMs: 125
        });

        expect(Registry).toHaveBeenCalledTimes(1);
        expect(registryMock.setDefaultLabels).toHaveBeenCalledWith({ service: "bitbucket-mcp-server" });
        expect(Counter).toHaveBeenCalledWith(expect.objectContaining({ name: "http_requests_total" }));
        expect(Histogram).toHaveBeenCalledWith(expect.objectContaining({ name: "http_request_duration_seconds" }));
        expect(counterMock.inc).toHaveBeenCalledWith({ method: "GET", route: "/health", status: "200" });
        expect(histogramMock.observe).toHaveBeenCalledWith({ method: "GET", route: "/health", status: "200" }, 0.125);
        expect(Gauge).toHaveBeenCalledWith(expect.objectContaining({ name: "health_check_success_rate" }));
        expect(collectDefaultMetrics).toHaveBeenCalledWith({ register: registryMock });
    });

    it("honors custom prefix and disables default metrics when requested", () => {
        const service = new MetricsService({ prefix: "test_", collectDefault: false });

        service.recordHttpRequest({
            route: "/metrics",
            method: "POST",
            statusCode: 201,
            durationMs: 500
        });

        expect(Counter).toHaveBeenCalledWith(expect.objectContaining({ name: "test_http_requests_total" }));
        expect(Histogram).toHaveBeenCalledWith(expect.objectContaining({ name: "test_http_request_duration_seconds" }));
        expect(collectDefaultMetrics).not.toHaveBeenCalled();
    });

    it("records health check results and latency", () => {
        const service = new MetricsService();

        service.recordHealthCheck({ success: true, durationMs: 250 });

        expect(gaugeMock.set).toHaveBeenCalledWith(1);
        expect(histogramMock.observe).toHaveBeenCalledWith({ operation: "health" }, 0.25);
    });

    it("exposes an Express handler that emits registry metrics", async () => {
        const service = new MetricsService();
        registryMock.metrics.mockResolvedValue("metric-data");

        const handler = service.createHandler();
        const res = {
            setHeader: jest.fn(),
            send: jest.fn()
        } as unknown as Parameters<Handler>[1];

        await handler({} as any, res, jest.fn());

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
        expect(res.send).toHaveBeenCalledWith("metric-data");
    });
});
