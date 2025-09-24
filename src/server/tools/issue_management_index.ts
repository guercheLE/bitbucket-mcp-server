/**
 * Issue Management Tools Index
 * 
 * Centralized export of all issue management MCP tools.
 * Provides comprehensive issue tracking capabilities for Bitbucket repositories.
 * 
 * Available Tools:
 * - create_issue: Create new issues with configurable fields
 * - list_issues: List and discover issues with filtering and search
 * - get_issue: Retrieve comprehensive issue information
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

export { createIssueTool } from './create_issue.js';
export { listIssuesTool } from './list_issues.js';
export { getIssueTool } from './get_issue.js';

// Export all tools as an array for easy registration
export const issueManagementTools = [
  createIssueTool,
  listIssuesTool,
  getIssueTool
];

export default issueManagementTools;
