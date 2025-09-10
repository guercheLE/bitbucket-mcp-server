/**
 * Application constants and configuration values
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Logger } from './logger.util.js';

// Get package.json path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');

// Read version from package.json
let VERSION = 'unknown';
let PACKAGE_NAME = 'bitbucket-mcp-server';

try {
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  VERSION = packageJson.version || 'unknown';
  PACKAGE_NAME = packageJson.name || 'bitbucket-mcp-server';
} catch {
  // Use logger instead of console.warn to avoid interfering with MCP protocol
  const logger = Logger.forContext('constants.util.ts');
  logger.warn('Could not read package.json, using default values');
}

export { PACKAGE_NAME, VERSION };

// API Configuration
export const DEFAULT_BITBUCKET_CLOUD_URL = 'https://api.bitbucket.org/2.0';
export const DEFAULT_BITBUCKET_SERVER_URL = 'https://bitbucket.company.com';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;

// MCP Tool Categories
export const TOOL_CATEGORIES = {
  WORKSPACE: 'workspace',
  REPOSITORY: 'repository',
  PULL_REQUEST: 'pull-request',
  ISSUE: 'issue',
  PIPELINE: 'pipeline',
  WEBHOOK: 'webhook',
  USER: 'user',
  PROJECT: 'project',
  SEARCH: 'search',
  DIFF: 'diff',
} as const;

// Bitbucket API Endpoints
export const API_ENDPOINTS = {
  WORKSPACES: '/workspaces',
  REPOSITORIES: '/repositories',
  PULL_REQUESTS: '/pullrequests',
  ISSUES: '/issues',
  PIPELINES: '/pipelines',
  WEBHOOKS: '/hooks',
  USERS: '/users',
  PROJECTS: '/projects',
  COMMITS: '/commits',
  BRANCHES: '/refs/branches',
  FILES: '/src',
} as const;

// Supported Bitbucket Versions
export const SUPPORTED_VERSIONS = {
  CLOUD: 'cloud',
  SERVER: 'server',
} as const;

// Authentication Methods
export const AUTH_METHODS = {
  APP_PASSWORD: 'app-password',
  API_TOKEN: 'api-token',
  OAUTH: 'oauth',
  REPOSITORY_TOKEN: 'repository-token',
  PROJECT_TOKEN: 'project-token',
  WORKSPACE_TOKEN: 'workspace-token',
  SSH: 'ssh',
} as const;

// OAuth 2.0 Scopes (NEW!)
export const OAUTH_SCOPES = {
  // Repository scopes
  REPOSITORY_READ: 'repository',
  REPOSITORY_WRITE: 'repository:write',
  REPOSITORY_ADMIN: 'repository:admin',
  REPOSITORY_DELETE: 'repository:delete',

  // Pull request scopes
  PULL_REQUEST_READ: 'pullrequest',
  PULL_REQUEST_WRITE: 'pullrequest:write',

  // Webhook scopes
  WEBHOOK_READ: 'webhook',

  // Pipeline scopes
  PIPELINE_READ: 'pipeline',
  PIPELINE_WRITE: 'pipeline:write',
  PIPELINE_VARIABLE: 'pipeline:variable',

  // Runner scopes
  RUNNER_READ: 'runner',
  RUNNER_WRITE: 'runner:write',

  // Project scopes
  PROJECT_READ: 'project',
  PROJECT_ADMIN: 'project:admin',

  // Account scopes
  ACCOUNT_READ: 'account',
} as const;

// Repository Access Token Scopes (NEW!)
export const REPOSITORY_TOKEN_SCOPES = [
  OAUTH_SCOPES.REPOSITORY_READ,
  OAUTH_SCOPES.REPOSITORY_WRITE,
  OAUTH_SCOPES.REPOSITORY_ADMIN,
  OAUTH_SCOPES.REPOSITORY_DELETE,
  OAUTH_SCOPES.PULL_REQUEST_READ,
  OAUTH_SCOPES.PULL_REQUEST_WRITE,
  OAUTH_SCOPES.WEBHOOK_READ,
  OAUTH_SCOPES.PIPELINE_READ,
  OAUTH_SCOPES.PIPELINE_WRITE,
  OAUTH_SCOPES.PIPELINE_VARIABLE,
  OAUTH_SCOPES.RUNNER_READ,
  OAUTH_SCOPES.RUNNER_WRITE,
] as const;

// Project Access Token Scopes (NEW!)
export const PROJECT_TOKEN_SCOPES = [
  OAUTH_SCOPES.PROJECT_READ,
  OAUTH_SCOPES.PROJECT_ADMIN,
  OAUTH_SCOPES.REPOSITORY_READ,
  OAUTH_SCOPES.REPOSITORY_WRITE,
  OAUTH_SCOPES.REPOSITORY_ADMIN,
  OAUTH_SCOPES.REPOSITORY_DELETE,
  OAUTH_SCOPES.PULL_REQUEST_READ,
  OAUTH_SCOPES.PULL_REQUEST_WRITE,
  OAUTH_SCOPES.WEBHOOK_READ,
  OAUTH_SCOPES.PIPELINE_READ,
  OAUTH_SCOPES.PIPELINE_WRITE,
  OAUTH_SCOPES.PIPELINE_VARIABLE,
  OAUTH_SCOPES.RUNNER_READ,
  OAUTH_SCOPES.RUNNER_WRITE,
] as const;

// Workspace Access Token Scopes (NEW!)
export const WORKSPACE_TOKEN_SCOPES = [
  OAUTH_SCOPES.PROJECT_READ,
  OAUTH_SCOPES.PROJECT_ADMIN,
  OAUTH_SCOPES.REPOSITORY_READ,
  OAUTH_SCOPES.REPOSITORY_WRITE,
  OAUTH_SCOPES.REPOSITORY_ADMIN,
  OAUTH_SCOPES.REPOSITORY_DELETE,
  OAUTH_SCOPES.PULL_REQUEST_READ,
  OAUTH_SCOPES.PULL_REQUEST_WRITE,
  OAUTH_SCOPES.WEBHOOK_READ,
  OAUTH_SCOPES.ACCOUNT_READ,
  OAUTH_SCOPES.PIPELINE_READ,
  OAUTH_SCOPES.PIPELINE_WRITE,
  OAUTH_SCOPES.PIPELINE_VARIABLE,
  OAUTH_SCOPES.RUNNER_READ,
  OAUTH_SCOPES.RUNNER_WRITE,
] as const;

// OAuth 2.0 Endpoints (NEW!)
export const OAUTH_ENDPOINTS = {
  AUTHORIZE: 'https://bitbucket.org/site/oauth2/authorize',
  ACCESS_TOKEN: 'https://bitbucket.org/site/oauth2/access_token',
  REVOKE: 'https://bitbucket.org/site/oauth2/revoke',
} as const;

// Merge Strategies
export const MERGE_STRATEGIES = {
  MERGE_COMMIT: 'merge-commit',
  SQUASH: 'squash',
  FAST_FORWARD: 'fast-forward',
} as const;

// Pull Request States
export const PR_STATES = {
  OPEN: 'OPEN',
  MERGED: 'MERGED',
  DECLINED: 'DECLINED',
  SUPERSEDED: 'SUPERSEDED',
} as const;

// Issue States
export const ISSUE_STATES = {
  NEW: 'new',
  OPEN: 'open',
  RESOLVED: 'resolved',
  ON_HOLD: 'on hold',
  INVALID: 'invalid',
  DUPLICATE: 'duplicate',
  WONT_FIX: 'wont fix',
  CLOSED: 'closed',
} as const;

// Pipeline States
export const PIPELINE_STATES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
  ERROR: 'error',
} as const;

// Webhook Events
export const WEBHOOK_EVENTS = {
  REPOSITORY_PUSH: 'repo:push',
  REPOSITORY_FORK: 'repo:fork',
  REPOSITORY_UPDATED: 'repo:updated',
  REPOSITORY_CREATED: 'repo:created',
  PULL_REQUEST_CREATED: 'pullrequest:created',
  PULL_REQUEST_UPDATED: 'pullrequest:updated',
  PULL_REQUEST_APPROVED: 'pullrequest:approved',
  PULL_REQUEST_MERGED: 'pullrequest:fulfilled',
  PULL_REQUEST_DECLINED: 'pullrequest:rejected',
  ISSUE_CREATED: 'issue:created',
  ISSUE_UPDATED: 'issue:updated',
  ISSUE_COMMENTED: 'issue:commented',
} as const;
