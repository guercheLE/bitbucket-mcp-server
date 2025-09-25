/**
 * Pull Request Management Tools Index
 * 
 * Centralized export of all pull request management MCP tools.
 * Provides comprehensive pull request management capabilities for Bitbucket repositories.
 * 
 * Available Tools:
 * - create_pull_request: Create new pull requests with configurable fields
 * - list_pull_requests: List and discover pull requests with filtering and search
 * - get_pull_request: Retrieve comprehensive pull request information
 * - update_pull_request: Update pull requests with status workflow transitions
 * - manage_pull_request_reviews: Manage pull request reviews and approvals
 * - manage_pull_request_comments: Manage pull request comments with threading
 * - merge_pull_request: Merge pull requests with various strategies
 * - manage_pull_request_branches: Manage pull request branch operations
 * - manage_pull_request_integration: Manage pull request integrations and status checks
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

export { createPullRequestTool } from './create_pull_request.js';
export { listPullRequestsTool } from './list_pull_requests.js';
export { getPullRequestTool } from './get_pull_request.js';
export { updatePullRequestTool } from './update_pull_request.js';
export { managePullRequestReviewsTool } from './manage_pull_request_reviews.js';
export { managePullRequestCommentsTool } from './manage_pull_request_comments.js';
export { mergePullRequestTool } from './merge_pull_request.js';
export { managePullRequestBranchesTool } from './manage_pull_request_branches.js';
export { managePullRequestIntegrationTool } from './manage_pull_request_integration.js';

// Export all tools as an array for easy registration
export const pullRequestManagementTools = [
  createPullRequestTool,
  listPullRequestsTool,
  getPullRequestTool,
  updatePullRequestTool,
  managePullRequestReviewsTool,
  managePullRequestCommentsTool,
  mergePullRequestTool,
  managePullRequestBranchesTool,
  managePullRequestIntegrationTool
];

export default pullRequestManagementTools;
