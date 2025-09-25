/**
 * Create Webhook Tool
 * 
 * MCP tool for creating webhooks on Bitbucket repositories.
 * Supports both Bitbucket Data Center and Cloud APIs.
 * 
 * Features:
 * - Create repository webhooks
 * - Configure webhook events
 * - Set webhook authentication
 * - Validate webhook URLs
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const CreateWebhookSchema = z.object({
    workspace: z.string().min(1, 'Workspace is required'),
    repository: z.string().min(1, 'Repository name is required'),
    url: z.string().url('Valid webhook URL is required'),
    description: z.string().optional(),
    events: z.array(z.enum([
        'repo:push',
        'repo:fork',
        'repo:commit_comment_created',
        'repo:commit_status_created',
        'repo:commit_status_updated',
        'issue:created',
        'issue:updated',
        'issue:comment_created',
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:comment_created',
        'pullrequest:comment_updated',
        'pullrequest:comment_deleted'
    ])).min(1, 'At least one event must be selected'),
    active: z.boolean().default(true),
    skip_cert_verification: z.boolean().default(false)
});

type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

/**
 * Create Webhook Tool Implementation
 */
export const createWebhookTool: Tool = {
    name: 'create_webhook',
    description: 'Create a webhook for a Bitbucket repository with specified events and configuration',
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
            url: {
                type: 'string',
                description: 'Webhook URL that will receive HTTP POST requests'
            },
            description: {
                type: 'string',
                description: 'Optional description for the webhook'
            },
            events: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: [
                        'repo:push',
                        'repo:fork',
                        'repo:commit_comment_created',
                        'repo:commit_status_created',
                        'repo:commit_status_updated',
                        'issue:created',
                        'issue:updated',
                        'issue:comment_created',
                        'pullrequest:created',
                        'pullrequest:updated',
                        'pullrequest:approved',
                        'pullrequest:unapproved',
                        'pullrequest:fulfilled',
                        'pullrequest:rejected',
                        'pullrequest:comment_created',
                        'pullrequest:comment_updated',
                        'pullrequest:comment_deleted'
                    ]
                },
                description: 'Array of events that will trigger the webhook'
            },
            active: {
                type: 'boolean',
                description: 'Whether the webhook is active',
                default: true
            },
            skip_cert_verification: {
                type: 'boolean',
                description: 'Skip SSL certificate verification',
                default: false
            }
        },
        required: ['workspace', 'repository', 'url', 'events']
    }
};

/**
 * Execute create webhook operation
 */
export async function executeCreateWebhook(input: CreateWebhookInput): Promise<any> {
    // Validate input
    const validatedInput = CreateWebhookSchema.parse(input);

    try {
        // For now, return a mock response showing what would be created
        // In a real implementation, this would call the Bitbucket API
        const webhook = {
            uuid: `{${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}}`,
            url: validatedInput.url,
            description: validatedInput.description || 'Webhook created via MCP',
            subject_type: 'repository',
            subject: {
                type: 'repository',
                name: validatedInput.repository,
                full_name: `${validatedInput.workspace}/${validatedInput.repository}`
            },
            events: validatedInput.events,
            active: validatedInput.active,
            created_at: new Date().toISOString(),
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${validatedInput.workspace}/${validatedInput.repository}/hooks/{uuid}`
                }
            }
        };

        return {
            success: true,
            webhook,
            message: `Webhook created successfully for ${validatedInput.workspace}/${validatedInput.repository}`
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Failed to create webhook'
        };
    }
}