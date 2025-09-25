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
 * - audit_pipeline_access: Audit pipeline access and permissions
 * - configure_pipeline_webhooks: Configure webhook integrations
 * - manage_pipeline_integrations: Handle third-party integrations
 * - setup_pipeline_notifications: Configure notifications and alerts
 * - get_pipeline_analytics: Retrieve pipeline analytics and insights
 * - generate_pipeline_reports: Generate comprehensive pipeline reports
 * - track_pipeline_metrics: Track and monitor pipeline performance metrics
 * - analyze_pipeline_data: Analyze pipeline data for insights
 * - export_pipeline_data: Export pipeline data for analysis
 * - diagnose_pipeline_issues: Identify and diagnose pipeline problems
 * - troubleshoot_pipeline_failures: Handle pipeline failure analysis
 * - optimize_pipeline_performance: Optimize and improve pipeline performance
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

// Import tools for array export
import { analyzePipelineDataTool } from './analyze_pipeline_data.js';
import { auditPipelineAccessTool } from './audit_pipeline_access.js';
import { configurePipelineTool } from './configure_pipeline.js';
import { configurePipelineAccessTool } from './configure_pipeline_access.js';
import { configurePipelineTriggersTool } from './configure_pipeline_triggers.js';
import { configurePipelineWebhooksTool } from './configure_pipeline_webhooks.js';
import { createPipelineTool } from './create_pipeline.js';
import { diagnosePipelineIssuesTool } from './diagnose_pipeline_issues.js';
import { executePipelineTool } from './execute_pipeline.js';
import { exportPipelineDataTool } from './export_pipeline_data.js';
import { generatePipelineReportsTool } from './generate_pipeline_reports.js';
import { getPipelineAnalyticsTool } from './get_pipeline_analytics.js';
import { getPipelineArtifactsTool } from './get_pipeline_artifacts.js';
import { getPipelineLogsTool } from './get_pipeline_logs.js';
import { getPipelineStatusTool } from './get_pipeline_status.js';
import { listPipelineRunsTool } from './list_pipeline_runs.js';
import { managePipelineIntegrationsTool } from './manage_pipeline_integrations.js';
import { managePipelinePermissionsTool } from './manage_pipeline_permissions.js';
import { managePipelineVariablesTool } from './manage_pipeline_variables.js';
import { monitorPipelineTool } from './monitor_pipeline.js';
import { optimizePipelinePerformanceTool } from './optimize_pipeline_performance.js';
import { setupPipelineNotificationsTool } from './setup_pipeline_notifications.js';
import { trackPipelineMetricsTool } from './track_pipeline_metrics.js';
import { troubleshootPipelineFailuresTool } from './troubleshoot_pipeline_failures.js';
import { updatePipelineConfigTool } from './update_pipeline_config.js';

export { analyzePipelineDataTool } from './analyze_pipeline_data.js';
export { auditPipelineAccessTool } from './audit_pipeline_access.js';
export { configurePipelineTool } from './configure_pipeline.js';
export { configurePipelineAccessTool } from './configure_pipeline_access.js';
export { configurePipelineTriggersTool } from './configure_pipeline_triggers.js';
export { configurePipelineWebhooksTool } from './configure_pipeline_webhooks.js';
export { createPipelineTool } from './create_pipeline.js';
export { diagnosePipelineIssuesTool } from './diagnose_pipeline_issues.js';
export { executePipelineTool } from './execute_pipeline.js';
export { exportPipelineDataTool } from './export_pipeline_data.js';
export { generatePipelineReportsTool } from './generate_pipeline_reports.js';
export { getPipelineAnalyticsTool } from './get_pipeline_analytics.js';
export { getPipelineArtifactsTool } from './get_pipeline_artifacts.js';
export { getPipelineLogsTool } from './get_pipeline_logs.js';
export { getPipelineStatusTool } from './get_pipeline_status.js';
export { listPipelineRunsTool } from './list_pipeline_runs.js';
export { managePipelineIntegrationsTool } from './manage_pipeline_integrations.js';
export { managePipelinePermissionsTool } from './manage_pipeline_permissions.js';
export { managePipelineVariablesTool } from './manage_pipeline_variables.js';
export { monitorPipelineTool } from './monitor_pipeline.js';
export { optimizePipelinePerformanceTool } from './optimize_pipeline_performance.js';
export { setupPipelineNotificationsTool } from './setup_pipeline_notifications.js';
export { trackPipelineMetricsTool } from './track_pipeline_metrics.js';
export { troubleshootPipelineFailuresTool } from './troubleshoot_pipeline_failures.js';
export { updatePipelineConfigTool } from './update_pipeline_config.js';

// Export all tools as an array for easy registration
export const pipelineManagementTools = [
  createPipelineTool,
  configurePipelineTool,
  executePipelineTool,
  monitorPipelineTool,
  getPipelineStatusTool,
  listPipelineRunsTool,
  getPipelineLogsTool,
  getPipelineArtifactsTool,
  updatePipelineConfigTool,
  managePipelineVariablesTool,
  configurePipelineTriggersTool,
  managePipelinePermissionsTool,
  configurePipelineAccessTool,
  auditPipelineAccessTool,
  configurePipelineWebhooksTool,
  managePipelineIntegrationsTool,
  setupPipelineNotificationsTool,
  getPipelineAnalyticsTool,
  generatePipelineReportsTool,
  trackPipelineMetricsTool,
  analyzePipelineDataTool,
  exportPipelineDataTool,
  diagnosePipelineIssuesTool,
  troubleshootPipelineFailuresTool,
  optimizePipelinePerformanceTool
];

export default pipelineManagementTools;
