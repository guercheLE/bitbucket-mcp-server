/**
 * Webhook Event Validator Tool
 * 
 * MCP tool for validating and processing webhook events from Bitbucket.
 * Supports both Bitbucket Data Center and Cloud webhook payload validation.
 * 
 * Features:
 * - Validate webhook payload structure
 * - Verify webhook signatures
 * - Process different event types
 * - Extract event metadata
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as crypto from 'crypto';
import { z } from 'zod';

// Webhook event types schema
const WebhookEventSchema = z.object({
    event_key: z.string().min(1, 'Event key is required'),
    payload: z.record(z.any()),
    headers: z.record(z.string()).optional(),
    signature: z.string().optional(),
    secret: z.string().optional()
});

type WebhookEventInput = z.infer<typeof WebhookEventSchema>;

/**
 * Webhook Event Validator Tool Implementation
 */
export const validateWebhookEventTool: Tool = {
    name: 'validate_webhook_event',
    description: 'Validate and process webhook events from Bitbucket repositories',
    inputSchema: {
        type: 'object',
        properties: {
            event_key: {
                type: 'string',
                description: 'The webhook event type (e.g., repo:push, pullrequest:created)'
            },
            payload: {
                type: 'object',
                description: 'The webhook payload data from Bitbucket'
            },
            headers: {
                type: 'object',
                description: 'HTTP headers from the webhook request'
            },
            signature: {
                type: 'string',
                description: 'HMAC signature for payload verification'
            },
            secret: {
                type: 'string',
                description: 'Secret key for signature validation'
            }
        },
        required: ['event_key', 'payload']
    }
};

/**
 * Validate webhook signature
 */
function validateSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(cleanSignature, 'hex')
    );
}

/**
 * Extract event metadata based on event type
 */
function extractEventMetadata(eventKey: string, payload: any): any {
    const metadata: any = {
        event_type: eventKey,
        timestamp: new Date().toISOString()
    };

    switch (eventKey) {
        case 'repo:push':
            metadata.repository = payload.repository?.full_name;
            metadata.branch = payload.push?.changes?.[0]?.new?.name;
            metadata.commits = payload.push?.changes?.[0]?.commits?.length || 0;
            metadata.author = payload.push?.changes?.[0]?.commits?.[0]?.author?.user?.display_name;
            break;

        case 'pullrequest:created':
        case 'pullrequest:updated':
        case 'pullrequest:fulfilled':
        case 'pullrequest:rejected':
            metadata.repository = payload.repository?.full_name;
            metadata.pull_request_id = payload.pullrequest?.id;
            metadata.title = payload.pullrequest?.title;
            metadata.source_branch = payload.pullrequest?.source?.branch?.name;
            metadata.destination_branch = payload.pullrequest?.destination?.branch?.name;
            metadata.author = payload.pullrequest?.author?.display_name;
            break;

        case 'issue:created':
        case 'issue:updated':
            metadata.repository = payload.repository?.full_name;
            metadata.issue_id = payload.issue?.id;
            metadata.title = payload.issue?.title;
            metadata.priority = payload.issue?.priority;
            metadata.assignee = payload.issue?.assignee?.display_name;
            break;

        case 'repo:fork':
            metadata.repository = payload.repository?.full_name;
            metadata.fork = payload.fork?.full_name;
            metadata.forked_by = payload.actor?.display_name;
            break;

        default:
            metadata.raw_payload_keys = Object.keys(payload);
            break;
    }

    return metadata;
}

/**
 * Execute webhook event validation
 */
export async function executeValidateWebhookEvent(input: WebhookEventInput): Promise<any> {
    // Validate input
    const validatedInput = WebhookEventSchema.parse(input);

    try {
        const validationResult: any = {
            event_key: validatedInput.event_key,
            valid: true,
            timestamp: new Date().toISOString(),
            validation_checks: {}
        };

        // Validate signature if provided
        if (validatedInput.signature && validatedInput.secret) {
            const payloadString = JSON.stringify(validatedInput.payload);
            const signatureValid = validateSignature(payloadString, validatedInput.signature, validatedInput.secret);

            validationResult.validation_checks.signature = {
                valid: signatureValid,
                message: signatureValid ? 'Signature validated successfully' : 'Invalid signature'
            };

            if (!signatureValid) {
                validationResult.valid = false;
            }
        } else {
            validationResult.validation_checks.signature = {
                valid: null,
                message: 'No signature provided for validation'
            };
        }

        // Validate payload structure
        const hasRequiredFields = validatedInput.payload && typeof validatedInput.payload === 'object';
        validationResult.validation_checks.payload_structure = {
            valid: hasRequiredFields,
            message: hasRequiredFields ? 'Payload structure valid' : 'Invalid payload structure'
        };

        if (!hasRequiredFields) {
            validationResult.valid = false;
        }

        // Extract event metadata
        validationResult.metadata = extractEventMetadata(validatedInput.event_key, validatedInput.payload);

        // Overall validation result
        if (validationResult.valid) {
            return {
                success: true,
                validation: validationResult,
                message: `Webhook event ${validatedInput.event_key} validated successfully`
            };
        } else {
            return {
                success: false,
                validation: validationResult,
                message: `Webhook event ${validatedInput.event_key} validation failed`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Failed to validate webhook event'
        };
    }
}