import { EventEmitter } from "node:events";

declare namespace CircuitBreaker {
    interface Options<T = unknown> {
        timeout?: number;
        errorThresholdPercentage?: number;
        resetTimeout?: number;
        volumeThreshold?: number;
        rollingCountTimeout?: number;
        rollingCountBuckets?: number;
        name?: string;
        group?: string;
        allowWarmUp?: boolean;
    }

    class OpenCircuitError extends Error { }
    class TimeoutError extends Error { }
    class SemaphoreRejectedError extends Error { }
}

declare class CircuitBreaker<T = unknown> extends EventEmitter {
    constructor(action: (...args: any[]) => Promise<T>, options?: CircuitBreaker.Options<T>);
    fire(...args: any[]): Promise<T>;
    fallback(fn: (...args: any[]) => T | Promise<T>): this;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    open(): void;
    close(): void;
    halfOpen(): void;
}

declare module "opossum" {
    export default CircuitBreaker;
    export type Options<T = unknown> = CircuitBreaker.Options<T>;
    export type OpenCircuitError = CircuitBreaker.OpenCircuitError;
}
