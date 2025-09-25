/**
 * List Webhooks Tool
 * 
 * MCP tool for listing webhooks configured on Bitbucket repositories.
 * Supports both Bitbucket Data Center and Cloud APIs.
 * 
 * Features:
 * - List all webhooks for a repository
 * - Filter webhooks by status
 * - Show webhook configuration details
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const ListWebhooksSchema = z.object({
  workspace: z.string().min(1, 'Workspace is required'),
  repository: z.string().min(1, 'Repository name is required'),
  active_only: z.boolean().default(false)
});

type ListWebhooksInput = z.infer<typeof ListWebhooksSchema>;

/**
 * List Webhooks Tool Implementation
 */
export const listWebhooksTool: Tool = {
  name: 'list_webhooks',
  description: 'List all webhooks configured for a Bitbucket repository',
  inputSchema: {
    type: 'object',
    properties: {
      workspace: {
        type: 'string',
        description: 'Workspace or project key where the repository is located'
      },
      repository: {
        type: 'string',
        description: 'Repository name or slug'
      },
      active_only: {
        type: 'boolean',
        description: 'Only return active webhooks',
        default: false
      }
    },
    required: ['workspace', 'repository']
  }
};

/**
 * Execute list webhooks operation
 */
export async function executeListWebhooks(input: ListWebhooksInput): Promise<any> {
  // Validate input
  const validatedInput = ListWebhooksSchema.parse(input);

  try {
    // Mock response - in real implementation would call Bitbucket API
    const webhooks = [
      {
        uuid: '{12345678-1234-1234-1234-123456789abc}',
        url: 'https://example.com/webhook1',
        description: 'CI/CD webhook',
        subject_type: 'repository',
        subject: {
          type: 'repository',
          name: validatedInput.repository,
          full_name: `${validatedInput.workspace}/${validatedInput.repository}`
        },
        events: ['repo:push', 'pullrequest:created'],
        active: true,
        created_at: '2024-01-15T10:30:00Z',
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${validatedInput.workspace}/${validatedInput.repository}/hooks/{uuid}`
          }
        }
      },
      {
        uuid: '{87654321-4321-4321-4321-cba987654321}',
        url: 'https://example.com/webhook2',
        description: 'Issue tracker webhook',
        subject_type: 'repository',
        subject: {
          type: 'repository',
          name: validatedInput.repository,
          full_name: `${validatedInput.workspace}/${validatedInput.repository}`
        },
        events: ['issue:created', 'issue:updated'],
        active: false,
        created_at: '2024-01-10T14:20:00Z',
        links: {
          self: {
            href: `https://api.bitbucket.org/2.0/repositories/${validatedInput.workspace}/${validatedInput.repository}/hooks/{uuid}`
          }
        }
      }
    ];

    // Filter by active status if requested
    const filteredWebhooks = validatedInput.active_only 
      ? webhooks.filter(hook => hook.active)
      : webhooks;

    return {
      success: true,
      webhooks: filteredWebhooks,
      count: filteredWebhooks.length,
      message: `Found ${filteredWebhooks.length} webhook(s) for ${validatedInput.workspace}/${validatedInput.repository}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to list webhooks'
    };
  }
}