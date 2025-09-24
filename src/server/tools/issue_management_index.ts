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
 * - update_issue: Update issues with status workflow transitions
 * - manage_issue_assignment: Manage issue assignments and ownership
 * - manage_issue_comments: Manage issue comments with threading
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

export { createIssueTool } from './create_issue.js';
export { listIssuesTool } from './list_issues.js';
export { getIssueTool } from './get_issue.js';
export { updateIssueTool } from './update_issue.js';
export { manageIssueAssignmentTool } from './manage_issue_assignment.js';
export { manageIssueCommentsTool } from './manage_issue_comments.js';

// Export all tools as an array for easy registration
export const issueManagementTools = [
  createIssueTool,
  listIssuesTool,
  getIssueTool,
  updateIssueTool,
  manageIssueAssignmentTool,
  manageIssueCommentsTool
];

export default issueManagementTools;
