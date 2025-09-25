/**
 * Analytics Module
 * 
 * Entry point for the analytics module, providing comprehensive
 * analytics capabilities for Bitbucket repositories.
 * 
 * This module includes:
 * - Data collection from repositories and pull requests
 * - Analytics aggregation and health scoring
 * - MCP tools for external integration
 * - TypeScript types and validation schemas
 */

// Core types and schemas
export * from './types';

// Data collectors
export type { BaseCollector, CollectorConfig } from './collectors/BaseCollector';
export { PullRequestMetricsCollector } from './collectors/PullRequestMetricsCollector';
export { RepositoryActivityCollector } from './collectors/RepositoryActivityCollector';

// Analytics aggregation
export {
    AnalyticsAggregationService
} from './aggregators/AnalyticsAggregationService';
export type { AggregatedAnalytics } from './aggregators/AnalyticsAggregationService';

// MCP tools
export {
    AnalyticsMCPTools,
    createAnalyticsTools
} from './tools';
export type { MCPTool } from './tools';

/**
 * Analytics module version and metadata
 */
export const ANALYTICS_MODULE = {
    version: '1.0.0',
    name: 'bitbucket-analytics',
    description: 'Comprehensive analytics for Bitbucket repositories',
    supportedFeatures: [
        'repository-activity-tracking',
        'pull-request-metrics',
        'developer-productivity',
        'project-health-scoring',
        'time-series-analysis',
        'repository-comparison',
        'data-export',
    ],
    mcpTools: [
        'get-repository-analytics',
        'get-developer-metrics',
        'compare-repositories',
        'export-analytics-data',
        'get-time-series-data',
        'get-available-metrics',
    ],
} as const;