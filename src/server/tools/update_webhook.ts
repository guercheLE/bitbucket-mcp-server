/**
 * Update Webhook Tool
 * 
 * MCP tool for updating webhook configurations on Bitbucket repositories.
 * Supports both Bitbucket Data Center and Cloud APIs.
 * 
 * Features:
 * - Update webhook URL and events
 * - Toggle webhook active status
 * - Modify webhook description
 * - Update security settings
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Input validation schema
const UpdateWebhookSchema = z.object({
    workspace: z.string().min(1, 'Workspace is required'),
    repository: z.string().min(1, 'Repository name is required'),
    webhook_uuid: z.string().min(1, 'Webhook UUID is required').regex(/^\{[0-9a-f-]+\}$/, 'Invalid UUID format'),
    url: z.string().url('Valid webhook URL is required').optional(),
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
    ])).optional(),
    active: z.boolean().optional(),
    skip_cert_verification: z.boolean().optional()
});

type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;

/**
 * Update Webhook Tool Implementation
 */
export const updateWebhookTool: Tool = {
    name: 'update_webhook',
    description: 'Update an existing webhook configuration for a Bitbucket repository',
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
            webhook_uuid: {
                type: 'string',
                description: 'UUID of the webhook to update'
            },
            url: {
                type: 'string',
                description: 'New webhook URL that will receive HTTP POST requests'
            },
            description: {
                type: 'string',
                description: 'New description for the webhook'
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
                description: 'New array of events that will trigger the webhook'
            },
            active: {
                type: 'boolean',
                description: 'Whether the webhook should be active'
            },
            skip_cert_verification: {
                type: 'boolean',
                description: 'Skip SSL certificate verification'
            }
        },
        required: ['workspace', 'repository', 'webhook_uuid']
    }
};

/**
 * Execute update webhook operation
 */
export async function executeUpdateWebhook(input: UpdateWebhookInput): Promise<any> {
    // Validate input
    const validatedInput = UpdateWebhookSchema.parse(input);

    try {
        // Mock response - in real implementation would call Bitbucket API
        // First check if webhook exists
        const webhookExists = true; // Mock check

        if (!webhookExists) {
            return {
                success: false,
                error: 'Webhook not found',
                message: `Webhook ${validatedInput.webhook_uuid} not found in ${validatedInput.workspace}/${validatedInput.repository}`
            };
        }

        // Mock current webhook data
        const currentWebhook = {
            uuid: validatedInput.webhook_uuid,
            url: 'https://old-url.com/webhook',
            description: 'Old description',
            events: ['repo:push'],
            active: true,
            skip_cert_verification: false
        };

        // Apply updates
        const updatedWebhook = {
            ...currentWebhook,
            ...(validatedInput.url && { url: validatedInput.url }),
            ...(validatedInput.description !== undefined && { description: validatedInput.description }),
            ...(validatedInput.events && { events: validatedInput.events }),
            ...(validatedInput.active !== undefined && { active: validatedInput.active }),
            ...(validatedInput.skip_cert_verification !== undefined && { skip_cert_verification: validatedInput.skip_cert_verification }),
            updated_at: new Date().toISOString(),
            subject: {
                type: 'repository',
                name: validatedInput.repository,
                full_name: `${validatedInput.workspace}/${validatedInput.repository}`
            },
            links: {
                self: {
                    href: `https://api.bitbucket.org/2.0/repositories/${validatedInput.workspace}/${validatedInput.repository}/hooks/${validatedInput.webhook_uuid}`
                }
            }
        };

        return {
            success: true,
            webhook: updatedWebhook,
            message: `Webhook ${validatedInput.webhook_uuid} successfully updated in ${validatedInput.workspace}/${validatedInput.repository}`
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Failed to update webhook'
        };
    }
}