import CircuitBreaker from "opossum";

import type { CircuitBreakerConfig } from "../models/config";
import { CircuitBreakerConfigSchema } from "../models/config";

export type BitbucketCommand<T> = () => Promise<T>;

export interface CircuitBreakerOverrides extends Partial<CircuitBreakerConfig> {
    volumeThreshold?: number;
}

const defaultConfig = CircuitBreakerConfigSchema.parse({});

export const createBitbucketCircuitBreaker = <T>(
    command: BitbucketCommand<T>,
    overrides: CircuitBreakerOverrides = {}
): CircuitBreaker<T> => {
    const options = {
        timeout: overrides.timeout ?? defaultConfig.timeout,
        errorThresholdPercentage: overrides.errorThresholdPercentage ?? defaultConfig.errorThresholdPercentage,
        resetTimeout: overrides.resetTimeout ?? defaultConfig.resetTimeout,
        volumeThreshold: overrides.volumeThreshold ?? 1
    } satisfies CircuitBreaker.Options<T>;

    const breaker = new CircuitBreaker(command, options);

    breaker.on("open", () => {
        // no-op hook for custom logging in consuming services
    });

    breaker.on("halfOpen", () => {
        // placeholder for instrumentation hooks
    });

    breaker.on("close", () => {
        // placeholder for instrumentation hooks
    });

    return breaker;
};
