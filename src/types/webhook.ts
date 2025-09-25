/**
 * Webhook Types and Interfaces
 * 
 * TypeScript type definitions for webhook functionality.
 */

export interface WebhookEvent {
    uuid: string;
    url: string;
    description?: string;
    subject_type: 'repository';
    subject: {
        type: 'repository';
        name: string;
        full_name: string;
    };
    events: WebhookEventType[];
    active: boolean;
    created_at: string;
    updated_at?: string;
    links: {
        self: {
            href: string;
        };
    };
}

export type WebhookEventType =
    | 'repo:push'
    | 'repo:fork'
    | 'repo:commit_comment_created'
    | 'repo:commit_status_created'
    | 'repo:commit_status_updated'
    | 'issue:created'
    | 'issue:updated'
    | 'issue:comment_created'
    | 'pullrequest:created'
    | 'pullrequest:updated'
    | 'pullrequest:approved'
    | 'pullrequest:unapproved'
    | 'pullrequest:fulfilled'
    | 'pullrequest:rejected'
    | 'pullrequest:comment_created'
    | 'pullrequest:comment_updated'
    | 'pullrequest:comment_deleted';

export interface WebhookPayload {
    repository?: {
        type: string;
        name: string;
        full_name: string;
        uuid: string;
        links: {
            self: { href: string };
            html: { href: string };
        };
    };
    actor?: {
        display_name: string;
        uuid: string;
        username: string;
        type: string;
    };
    push?: {
        changes: Array<{
            new?: {
                name: string;
                type: string;
                target: {
                    hash: string;
                    message: string;
                    author: {
                        user: {
                            display_name: string;
                            username: string;
                        };
                    };
                };
            };
            old?: {
                name: string;
                type: string;
                target: {
                    hash: string;
                };
            };
            commits: Array<{
                hash: string;
                message: string;
                author: {
                    user: {
                        display_name: string;
                        username: string;
                    };
                };
            }>;
        }>;
    };
    pullrequest?: {
        id: number;
        title: string;
        description?: string;
        state: string;
        source: {
            branch: { name: string };
            repository: any;
        };
        destination: {
            branch: { name: string };
            repository: any;
        };
        author: any;
    };
    issue?: {
        id: number;
        title: string;
        content?: {
            raw: string;
        };
        priority: string;
        kind: string;
        state: string;
        assignee?: any;
        reporter?: any;
    };
    fork?: {
        full_name: string;
    };
}

export interface WebhookValidationResult {
    event_key: string;
    valid: boolean;
    timestamp: string;
    validation_checks: {
        signature?: {
            valid: boolean | null;
            message: string;
        };
        payload_structure: {
            valid: boolean;
            message: string;
        };
    };
    metadata: {
        event_type: string;
        timestamp: string;
        repository?: string;
        branch?: string;
        commits?: number;
        author?: string;
        pull_request_id?: number;
        title?: string;
        source_branch?: string;
        destination_branch?: string;
        issue_id?: number;
        priority?: string;
        assignee?: string;
        fork?: string;
        forked_by?: string;
        raw_payload_keys?: string[];
    };
}

export interface WebhookTestResult {
    url: string;
    event_type: string;
    test_timestamp: string;
    request: {
        method: string;
        headers: Record<string, string>;
        payload: any;
        timeout: number;
    };
    response: {
        status: number;
        status_text: string;
        headers: Record<string, string>;
        response_time_ms: number;
        body: string;
    };
    ssl_check: {
        valid: boolean;
        message: string;
    };
}

export interface CreateWebhookRequest {
    workspace: string;
    repository: string;
    url: string;
    description?: string;
    events: WebhookEventType[];
    active?: boolean;
    skip_cert_verification?: boolean;
}

export interface UpdateWebhookRequest {
    workspace: string;
    repository: string;
    webhook_uuid: string;
    url?: string;
    description?: string;
    events?: WebhookEventType[];
    active?: boolean;
    skip_cert_verification?: boolean;
}

export interface ListWebhooksRequest {
    workspace: string;
    repository: string;
    active_only?: boolean;
}

export interface DeleteWebhookRequest {
    workspace: string;
    repository: string;
    webhook_uuid: string;
}

export interface ValidateWebhookEventRequest {
    event_key: string;
    payload: Record<string, any>;
    headers?: Record<string, string>;
    signature?: string;
    secret?: string;
}

export interface TestWebhookRequest {
    url: string;
    event_type?: WebhookEventType;
    timeout?: number;
    skip_cert_verification?: boolean;
}