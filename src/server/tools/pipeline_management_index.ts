/**
 * Pipeline Management Tools Index
 * 
 * Centralized export of all pipeline management MCP tools.
 * Provides comprehensive pipeline capabilities for Bitbucket repositories.
 * 
 * Available Tools:
 * - create_pipeline: Create new pipelines with configurable settings
 * - configure_pipeline: Update pipeline configurations and settings
 * - execute_pipeline: Start, stop, and restart pipeline runs
 * - monitor_pipeline: Real-time pipeline status monitoring
 * - get_pipeline_status: Retrieve detailed pipeline status information
 * - list_pipeline_runs: List pipeline execution history
 * - get_pipeline_logs: Retrieve pipeline execution logs
 * - get_pipeline_artifacts: Access build artifacts and outputs
 * - update_pipeline_config: Update pipeline configurations
 * - manage_pipeline_variables: Handle environment variables and secrets
 * - configure_pipeline_triggers: Set up automated triggers
 * - manage_pipeline_permissions: Handle user and group permissions
 * - configure_pipeline_access: Set up access control policies
 * - audit_pipeline_access: Track and audit pipeline access
 * - configure_pipeline_webhooks: Set up webhook integrations
 * - manage_pipeline_integrations: Handle external tool integrations
 * - setup_pipeline_notifications: Configure alerts and notifications
 * - get_pipeline_analytics: Retrieve pipeline performance metrics
 * - generate_pipeline_reports: Generate comprehensive reports
 * - track_pipeline_metrics: Track key performance indicators
 * - diagnose_pipeline_issues: Identify and diagnose pipeline problems
 * - troubleshoot_pipeline_failures: Handle pipeline failure analysis
 * - optimize_pipeline_performance: Suggest performance improvements
 * - archive_pipeline: Archive old and unused pipelines
 * - cleanup_pipeline_data: Clean up old pipeline data
 * - migrate_pipeline_config: Migrate pipeline configurations
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

export { createPipelineTool } from './create_pipeline.js';
export { configurePipelineTool } from './configure_pipeline.js';
export { executePipelineTool } from './execute_pipeline.js';
export { monitorPipelineTool } from './monitor_pipeline.js';
export { getPipelineStatusTool } from './get_pipeline_status.js';

// Export all tools as an array for easy registration
export const pipelineManagementTools = [
  createPipelineTool,
  configurePipelineTool,
  executePipelineTool,
  monitorPipelineTool,
  getPipelineStatusTool
];

export default pipelineManagementTools;
