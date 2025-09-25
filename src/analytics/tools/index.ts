/**
 * Analytics Tools Registration
 * 
 * Registers analytics MCP tools with the main MCP server
 */

import { ANALYTICS_TOOLS, AnalyticsMCPTools } from './AnalyticsMCPTools';

export interface MCPTool {
    description: string;
    inputSchema: any;
    handler: (params: any) => Promise<any>;
}

/**
 * Creates and returns analytics tool handlers for MCP server registration
 */
export function createAnalyticsTools(): Record<string, MCPTool> {
    const analyticsTools = new AnalyticsMCPTools();

    return {
        'get-repository-analytics': {
            description: ANALYTICS_TOOLS['get-repository-analytics'].description,
            inputSchema: ANALYTICS_TOOLS['get-repository-analytics'].inputSchema,
            handler: (params: any) => analyticsTools.getRepositoryAnalytics(params),
        },
        'get-developer-metrics': {
            description: ANALYTICS_TOOLS['get-developer-metrics'].description,
            inputSchema: ANALYTICS_TOOLS['get-developer-metrics'].inputSchema,
            handler: (params: any) => analyticsTools.getDeveloperMetrics(params),
        },
        'compare-repositories': {
            description: ANALYTICS_TOOLS['compare-repositories'].description,
            inputSchema: ANALYTICS_TOOLS['compare-repositories'].inputSchema,
            handler: (params: any) => analyticsTools.compareRepositories(params),
        },
        'export-analytics-data': {
            description: ANALYTICS_TOOLS['export-analytics-data'].description,
            inputSchema: ANALYTICS_TOOLS['export-analytics-data'].inputSchema,
            handler: (params: any) => analyticsTools.exportAnalyticsData(params),
        },
        'get-time-series-data': {
            description: ANALYTICS_TOOLS['get-time-series-data'].description,
            inputSchema: ANALYTICS_TOOLS['get-time-series-data'].inputSchema,
            handler: (params: any) => analyticsTools.getTimeSeriesData(params),
        },
        'get-available-metrics': {
            description: ANALYTICS_TOOLS['get-available-metrics'].description,
            inputSchema: ANALYTICS_TOOLS['get-available-metrics'].inputSchema,
            handler: () => analyticsTools.getAvailableMetrics(),
        },
    };
}

// Export for use in main server
export { AnalyticsMCPTools } from './AnalyticsMCPTools';
