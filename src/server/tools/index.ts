/**
 * Repository Management Tools
 * 
 * This module exports all MCP tools related to repository management
 * functionality for the Bitbucket MCP server.
 * 
 * Tools included:
 * - create_repository: Create new repositories with configurable settings
 * - list_repositories: List and discover repositories with filtering
 * - get_repository: Retrieve comprehensive repository information
 * - update_repository_settings: Update repository configuration settings
 * - manage_repository_permissions: Manage repository access control
 * - repository_lifecycle: Manage repository lifecycle operations
 * 
 * All tools support both Bitbucket Data Center and Cloud APIs.
 */

export { createRepositoryTool } from './create_repository.js';
export { listRepositoriesTool } from './list_repositories.js';
export { getRepositoryTool } from './get_repository.js';
export { updateRepositorySettingsTool } from './update_repository_settings.js';
export { manageRepositoryPermissionsTool } from './manage_repository_permissions.js';
export { repositoryLifecycleTool } from './repository_lifecycle.js';

// Export all tools as an array for easy registration
export const repositoryManagementTools = [
  createRepositoryTool,
  listRepositoriesTool,
  getRepositoryTool,
  updateRepositorySettingsTool,
  manageRepositoryPermissionsTool,
  repositoryLifecycleTool
];

export default repositoryManagementTools;
