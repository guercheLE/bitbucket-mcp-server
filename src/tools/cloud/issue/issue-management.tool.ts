import { z } from 'zod';
import { MCPTool, ToolResult } from '@/types/mcp';
import { BitbucketConfig } from '@/types/config';
import { Issue } from '@/types/server-specific';
import { configService } from '@/services/config.service';
import { bitbucketAPIService } from '@/services/bitbucket-api.service';
import { loggerService } from '@/services/logger.service';
import { assertApiDataResponse } from '@/integration/api-client';

// List Issues Schema
const ListIssuesSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  state: z
    .enum(['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'])
    .optional(),
  kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).optional(),
  priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']).optional(),
  page: z.number().int().min(1).default(1),
  pagelen: z.number().int().min(1).max(100).default(50),
});

// Get Issue Schema
const GetIssueSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  issueId: z.number().int().min(1, 'Issue ID is required'),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Create Issue Schema
const CreateIssueSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).default('task'),
  priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']).default('major'),
  assignee: z.string().optional(),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

// Update Issue Schema
const UpdateIssueSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  workspace: z.string().min(1, 'Workspace is required'),
  repo: z.string().min(1, 'Repository name is required'),
  issueId: z.number().int().min(1, 'Issue ID is required'),
  title: z.string().optional(),
  content: z.string().optional(),
  state: z
    .enum(['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'])
    .optional(),
  kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).optional(),
  priority: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']).optional(),
  assignee: z.string().optional(),
  authType: z.enum(['oauth', 'app_password']),
  accessToken: z.string().optional(),
  username: z.string().optional(),
  appPassword: z.string().optional(),
});

export const listIssuesTool: MCPTool = {
  name: 'mcp_bitbucket_issue_list',
  description: 'List issues in a Bitbucket Cloud repository',
  inputSchema: ListIssuesSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'listIssues' });

    try {
      logger.info('Listing issues', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = ListIssuesSchema.parse(params);
      const config = buildConfig(validatedParams);

      const queryParams: Record<string, any> = {
        page: validatedParams.page,
        pagelen: validatedParams.pagelen,
      };

      if (validatedParams.state) {
        queryParams['state'] = validatedParams.state;
      }
      if (validatedParams.kind) {
        queryParams['kind'] = validatedParams.kind;
      }
      if (validatedParams.priority) {
        queryParams['priority'] = validatedParams.priority;
      }

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/issues`,
        queryParams
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const responseData = result.data as {
          data: { values: unknown[]; size: number; next?: string; previous?: string };
        };
        const issues = responseData.data.values.map(transformIssue);

        logger.info('Issues listed successfully', {
          count: issues.length,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  issues,
                  pagination: {
                    page: validatedParams.page,
                    pagelen: validatedParams.pagelen,
                    size: responseData.data.size,
                    next: responseData.data.next,
                    previous: responseData.data.previous,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to list issues', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('List issues tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'issue',
  operation: 'list',
};

export const getIssueTool: MCPTool = {
  name: 'mcp_bitbucket_issue_get',
  description: 'Get issue details from Bitbucket Cloud',
  inputSchema: GetIssueSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'getIssue' });

    try {
      logger.info('Getting issue', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = GetIssueSchema.parse(params);
      const config = buildConfig(validatedParams);

      const result = await bitbucketAPIService.get(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/issues/${validatedParams.issueId}`
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const issue = transformIssue(assertApiDataResponse(result.data).data);

        logger.info('Issue retrieved successfully', {
          issueId: validatedParams.issueId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  issue,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to get issue', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Get issue tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'issue',
  operation: 'get',
};

export const createIssueTool: MCPTool = {
  name: 'mcp_bitbucket_issue_create',
  description: 'Create a new issue in Bitbucket Cloud',
  inputSchema: CreateIssueSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'createIssue' });

    try {
      logger.info('Creating issue', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = CreateIssueSchema.parse(params);
      const config = buildConfig(validatedParams);

      const issueData = {
        title: validatedParams.title,
        content: {
          raw: validatedParams.content || '',
        },
        kind: validatedParams.kind,
        priority: validatedParams.priority,
        assignee: validatedParams.assignee
          ? {
              username: validatedParams.assignee,
            }
          : undefined,
      };

      const result = await bitbucketAPIService.post(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/issues`,
        issueData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const issue = transformIssue(assertApiDataResponse(result.data).data);

        logger.info('Issue created successfully', {
          issueId: issue.id,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  issue,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to create issue', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Create issue tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'issue',
  operation: 'create',
};

export const updateIssueTool: MCPTool = {
  name: 'mcp_bitbucket_issue_update',
  description: 'Update an issue in Bitbucket Cloud',
  inputSchema: UpdateIssueSchema.shape,
  handler: async (params): Promise<ToolResult> => {
    const startTime = Date.now();
    const logger = loggerService.getLogger('mcp-tool', { tool: 'updateIssue' });

    try {
      logger.info('Updating issue', {
        params: { ...(params as Record<string, unknown>), appPassword: '[REDACTED]' },
      });

      const validatedParams = UpdateIssueSchema.parse(params);
      const config = buildConfig(validatedParams);

      const issueData: Record<string, any> = {};

      if (validatedParams.title !== undefined) {
        issueData['title'] = validatedParams.title;
      }
      if (validatedParams.content !== undefined) {
        issueData['content'] = {
          raw: validatedParams.content,
        };
      }
      if (validatedParams.state !== undefined) {
        issueData['state'] = validatedParams.state;
      }
      if (validatedParams.kind !== undefined) {
        issueData['kind'] = validatedParams.kind;
      }
      if (validatedParams.priority !== undefined) {
        issueData['priority'] = validatedParams.priority;
      }
      if (validatedParams.assignee !== undefined) {
        issueData['assignee'] = validatedParams.assignee
          ? {
              username: validatedParams.assignee,
            }
          : null;
      }

      const result = await bitbucketAPIService.put(
        config,
        `/2.0/repositories/${validatedParams.workspace}/${validatedParams.repo}/issues/${validatedParams.issueId}`,
        issueData
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        const issue = transformIssue(assertApiDataResponse(result.data).data);

        logger.info('Issue updated successfully', {
          issueId: validatedParams.issueId,
          workspace: validatedParams.workspace,
          repo: validatedParams.repo,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  issue,
                },
                null,
                2
              ),
            },
          ],
          isError: false,
        };
      } else {
        logger.warn('Failed to update issue', {
          error: result.error?.message,
          duration,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: result.error?.code,
                    message: result.error?.message,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('Update issue tool error', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: {
                  code: 'MCP_TOOL_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  },
  serverType: ['cloud'],
  category: 'issue',
  operation: 'update',
};

function buildConfig(params: any): BitbucketConfig {
  const authConfig =
    params.authType === 'oauth'
      ? {
          type: 'oauth' as const,
          credentials: {
            clientId: 'dummy',
            clientSecret: 'dummy',
            tokenType: 'Bearer',
          },
        }
      : {
          type: 'app_password' as const,
          credentials: {
            username: params.username || '',
            appPassword: params.appPassword,
          },
        };

  return {
    baseUrl: params.serverUrl,
    serverType: 'cloud',
    auth: authConfig,
    timeouts: configService.getTimeoutConfig(),
    rateLimit: configService.getRateLimitConfig(),
  };
}

function transformIssue(data: any): Issue {
  return {
    repository: {
      name: data.repository?.name || '',
      id: data.repository?.uuid || '',
      scmId: data.repository?.scm || 'git',
      uuid: data.repository?.uuid || '',
      slug: data.repository?.slug || '',
    },
    id: data.id,
    title: data.title,
    content: data.content?.raw || '',
    state: data.state,
    kind: data.kind,
    priority: data.priority,
    reporter: {
      name: data.reporter?.username || data.reporter?.display_name,
      id: data.reporter?.uuid,
      displayName: data.reporter?.display_name,
      uuid: data.reporter?.uuid,
    },
    assignee: data.assignee
      ? {
          name: data.assignee.username || data.assignee.display_name,
          id: data.assignee.uuid,
          displayName: data.assignee.display_name,
          uuid: data.assignee.uuid,
        }
      : undefined,
    createdAt: data.created_on,
    updatedAt: data.updated_on,
  };
}
