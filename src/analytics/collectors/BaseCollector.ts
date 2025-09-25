/**
 * Base collector interface for repository data extraction
 */

import { AnalyticsResponse, TimeRange } from '../types';

export interface BaseCollector<T> {
    /**
     * Unique identifier for this collector
     */
    readonly name: string;

    /**
     * Description of what this collector gathers
     */
    readonly description: string;

    /**
     * Collect data for a specific repository and time range
     * @param repositoryId - The repository to collect data from
     * @param timeRange - The time range to collect data for
     * @returns Promise resolving to collected data
     */
    collect(repositoryId: string, timeRange: TimeRange): Promise<AnalyticsResponse<T>>;

    /**
     * Validate that this collector can access the required data sources
     * @returns Promise resolving to validation result
     */
    validate(): Promise<boolean>;

    /**
     * Get the last time data was successfully collected
     * @param repositoryId - The repository to check
     * @returns Promise resolving to last collection timestamp or null
     */
    getLastCollectionTime(repositoryId: string): Promise<string | null>;

    /**
     * Check if the collected data is fresh enough based on collector's requirements
     * @param repositoryId - The repository to check
     * @param maxAgeMinutes - Maximum age in minutes before data is considered stale
     * @returns Promise resolving to true if data is fresh
     */
    isDataFresh(repositoryId: string, maxAgeMinutes: number): Promise<boolean>;
}

/**
 * Configuration options for collectors
 */
export interface CollectorConfig {
    /**
     * API credentials or authentication tokens
     */
    credentials?: {
        token?: string;
        username?: string;
        password?: string;
    };

    /**
     * API endpoints and URLs
     */
    endpoints?: {
        baseUrl?: string;
        apiUrl?: string;
    };

    /**
     * Rate limiting configuration
     */
    rateLimit?: {
        requestsPerMinute: number;
        burstLimit: number;
    };

    /**
     * Cache configuration
     */
    cache?: {
        enabled: boolean;
        ttlMinutes: number;
    };

    /**
     * Retry configuration
     */
    retry?: {
        maxAttempts: number;
        backoffMs: number;
    };
}

/**
 * Result from data collection operations
 */
export interface CollectionResult<T> {
    /**
     * Whether the collection was successful
     */
    success: boolean;

    /**
     * The collected data (if successful)
     */
    data?: T;

    /**
     * Error message (if failed)
     */
    error?: string;

    /**
     * Collection metadata
     */
    metadata: {
        /**
         * When the collection was performed
         */
        collectedAt: string;

        /**
         * How long the collection took (in milliseconds)
         */
        duration: number;

        /**
         * Number of items collected
         */
        itemCount: number;

        /**
         * Any warnings during collection
         */
        warnings?: string[];
    };
}

/**
 * Abstract base class implementing common collector functionality
 */
export abstract class AbstractCollector<T> implements BaseCollector<T> {
    protected config: CollectorConfig;
    protected lastCollectionTimes: Map<string, string> = new Map();

    constructor(
        public readonly name: string,
        public readonly description: string,
        config: CollectorConfig = {}
    ) {
        this.config = {
            cache: { enabled: true, ttlMinutes: 60 },
            retry: { maxAttempts: 3, backoffMs: 1000 },
            rateLimit: { requestsPerMinute: 60, burstLimit: 10 },
            ...config,
        };
    }

    abstract collect(repositoryId: string, timeRange: TimeRange): Promise<AnalyticsResponse<T>>;

    abstract validate(): Promise<boolean>;

    async getLastCollectionTime(repositoryId: string): Promise<string | null> {
        return this.lastCollectionTimes.get(repositoryId) || null;
    }

    async isDataFresh(repositoryId: string, maxAgeMinutes: number): Promise<boolean> {
        const lastCollection = await this.getLastCollectionTime(repositoryId);
        if (!lastCollection) {
            return false;
        }

        const lastCollectionTime = new Date(lastCollection).getTime();
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        const now = Date.now();

        return (now - lastCollectionTime) < maxAgeMs;
    }

    /**
     * Update the last collection time for a repository
     */
    protected updateLastCollectionTime(repositoryId: string): void {
        this.lastCollectionTimes.set(repositoryId, new Date().toISOString());
    }

    /**
     * Create a standardized error response
     */
    protected createErrorResponse(error: string): AnalyticsResponse<T> {
        return {
            success: false,
            error,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingTime: 0,
                dataFreshness: new Date().toISOString(),
            },
        };
    }

    /**
     * Create a standardized success response
     */
    protected createSuccessResponse(data: T, processingTime: number): AnalyticsResponse<T> {
        return {
            success: true,
            data,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingTime,
                dataFreshness: new Date().toISOString(),
            },
        };
    }

    /**
     * Sleep for the specified number of milliseconds (for rate limiting)
     */
    protected async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}