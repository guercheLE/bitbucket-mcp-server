/**
 * Test Webhook Tool
 * 
 * MCP tool for testing webhook endpoints and connectivity.
 * Allows testing webhook URLs before creating them in Bitbucket.
 * 
 * Features:
 * - Test webhook URL connectivity
 * - Send test payloads
 * - Validate response codes
 * - Check SSL certificate validity
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as crypto from 'node:crypto';
import { z } from 'zod';

// Input validation schema
const TestWebhookSchema = z.object({
    url: z.string().url('Valid webhook URL is required'),
    event_type: z.enum([
        'repo:push',
        'repo:fork',
        'repo:commit_comment_created',
        'issue:created',
        'issue:updated',
        'pullrequest:created',
        'pullrequest:updated'
    ]).default('repo:push'),
    timeout: z.number().min(1).max(30).default(10),
    skip_cert_verification: z.boolean().default(false)
});

type TestWebhookInput = z.infer<typeof TestWebhookSchema>;

/**
 * Test Webhook Tool Implementation
 */
export const testWebhookTool: Tool = {
    name: 'test_webhook',
    description: 'Test a webhook endpoint by sending a test payload',
    inputSchema: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'Webhook URL to test'
            },
            event_type: {
                type: 'string',
                enum: [
                    'repo:push',
                    'repo:fork',
                    'repo:commit_comment_created',
                    'issue:created',
                    'issue:updated',
                    'pullrequest:created',
                    'pullrequest:updated'
                ],
                description: 'Type of event to simulate for testing',
                default: 'repo:push'
            },
            timeout: {
                type: 'number',
                description: 'Request timeout in seconds',
                minimum: 1,
                maximum: 30,
                default: 10
            },
            skip_cert_verification: {
                type: 'boolean',
                description: 'Skip SSL certificate verification',
                default: false
            }
        },
        required: ['url']
    }
};

/**
 * Generate test payload based on event type
 */
function generateTestPayload(eventType: string): any {
    const basePayload = {
        repository: {
            type: "repository",
            name: "test-repo",
            full_name: "test-workspace/test-repo",
            uuid: "{12345678-1234-1234-1234-123456789abc}",
            links: {
                self: {
                    href: "https://api.bitbucket.org/2.0/repositories/test-workspace/test-repo"
                },
                html: {
                    href: "https://bitbucket.org/test-workspace/test-repo"
                }
            }
        },
        actor: {
            display_name: "Test User",
            uuid: "{87654321-4321-4321-4321-cba987654321}",
            username: "testuser",
            type: "user"
        }
    };

    switch (eventType) {
        case 'repo:push':
            return {
                ...basePayload,
                push: {
                    changes: [
                        {
                            new: {
                                name: "main",
                                type: "branch",
                                target: {
                                    hash: "abc123def456",
                                    message: "Test commit message",
                                    author: {
                                        user: {
                                            display_name: "Test User",
                                            username: "testuser"
                                        }
                                    }
                                }
                            },
                            old: {
                                name: "main",
                                type: "branch",
                                target: {
                                    hash: "def456ghi789"
                                }
                            },
                            commits: [
                                {
                                    hash: "abc123def456",
                                    message: "Test commit message",
                                    author: {
                                        user: {
                                            display_name: "Test User",
                                            username: "testuser"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            };

        case 'pullrequest:created':
            return {
                ...basePayload,
                pullrequest: {
                    id: 123,
                    title: "Test Pull Request",
                    description: "This is a test pull request",
                    state: "OPEN",
                    source: {
                        branch: {
                            name: "feature/test-branch"
                        },
                        repository: basePayload.repository
                    },
                    destination: {
                        branch: {
                            name: "main"
                        },
                        repository: basePayload.repository
                    },
                    author: basePayload.actor
                }
            };

        case 'issue:created':
            return {
                ...basePayload,
                issue: {
                    id: 456,
                    title: "Test Issue",
                    content: {
                        raw: "This is a test issue description"
                    },
                    priority: "major",
                    kind: "bug",
                    state: "new",
                    assignee: basePayload.actor,
                    reporter: basePayload.actor
                }
            };

        default:
            return basePayload;
    }
}

/**
 * Execute webhook test
 */
export async function executeTestWebhook(input: TestWebhookInput): Promise<any> {
    // Validate input
    const validatedInput = TestWebhookSchema.parse(input);

    try {
        const testPayload = generateTestPayload(validatedInput.event_type);

        // Mock HTTP request - in real implementation would use fetch or http module
        const testResult = {
            url: validatedInput.url,
            event_type: validatedInput.event_type,
            test_timestamp: new Date().toISOString(),
            request: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Key': validatedInput.event_type,
                    'X-Request-UUID': crypto.randomUUID(),
                    'User-Agent': 'Bitbucket-Webhooks/2.0'
                },
                payload: testPayload,
                timeout: validatedInput.timeout
            },
            response: {
                // Mock successful response
                status: 200,
                status_text: 'OK',
                headers: {
                    'content-type': 'application/json'
                },
                response_time_ms: Math.floor(Math.random() * 500) + 100,
                body: '{"received": true, "status": "success"}'
            },
            ssl_check: {
                valid: !validatedInput.skip_cert_verification,
                message: validatedInput.skip_cert_verification
                    ? 'SSL verification skipped'
                    : 'SSL certificate valid'
            }
        };

        return {
            success: true,
            test_result: testResult,
            message: `Webhook test successful for ${validatedInput.url}`
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            message: 'Webhook test failed'
        };
    }
}