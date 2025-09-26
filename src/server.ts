import { z } from "zod";

import { OperationRegistry } from "./lib/operations";
import { PullRequestSchema } from "./models/pull-request";
import { AuthenticationService } from "./services/auth";
import { DiscoveryService } from "./services/discovery";
import { ExecutionService } from "./services/execution";
import { SearchService } from "./services/search";

export interface ToolInvocation<TInput = unknown, TResult = unknown> {
    name: string;
    input: TInput;
    result: TResult;
}

export class BitbucketMCPServer {
    private readonly registry: OperationRegistry;
    private readonly authentication: AuthenticationService;
    private readonly search: SearchService;
    private readonly discovery: DiscoveryService;
    private readonly execution: ExecutionService;

    private readonly toolHandlers: Record<string, (payload: any) => Promise<any>>;

    private running = false;

    constructor(registry?: OperationRegistry) {
        this.registry = registry ?? new OperationRegistry();
        this.authentication = new AuthenticationService();
        this.search = new SearchService(this.registry);
        this.discovery = new DiscoveryService(this.registry);
        this.execution = new ExecutionService(this.registry);

        this.toolHandlers = {
            "search-ids": async ({ query }: { query: string }) => this.search.search(query ?? ""),
            "get-id": async ({ id }: { id: string }) => this.discovery.getOperation(id),
            "call-id": async ({ id, input }: { id: string; input: unknown }) =>
                this.execution.execute(id, input)
        };
    }

    async start(): Promise<void> {
        if (this.running) {
            return;
        }

        this.ensureDefaultOperations();
        this.running = true;
    }

    async stop(): Promise<void> {
        this.running = false;
    }

    isRunning(): boolean {
        return this.running;
    }

    listTools(): string[] {
        return Object.keys(this.toolHandlers);
    }

    async invokeTool<TInput, TResult>(name: string, payload: TInput): Promise<ToolInvocation<TInput, TResult>> {
        const handler = this.toolHandlers[name];
        if (!handler) {
            throw new Error(`Tool ${name} is not registered`);
        }

        const result = await handler(payload);
        return { name, input: payload, result };
    }

    getAuthenticationService(): AuthenticationService {
        return this.authentication;
    }

    getRegistry(): OperationRegistry {
        return this.registry;
    }

    private ensureDefaultOperations(): void {
        if (this.registry.list().length > 0) {
            return;
        }

        const minimalPullRequest = PullRequestSchema.pick({ id: true, title: true, state: true });

        const listOpenPullRequestsInput = z.object({
            projectKey: z.string().min(1),
            repositorySlug: z.string().min(1)
        });

        const listOpenPullRequestsOutput = z.array(minimalPullRequest);

        this.registry.register({
            id: "get-open-pull-requests",
            summary: "Retrieve open pull requests",
            description: "Lists all open pull requests for the given repository.",
            input: listOpenPullRequestsInput,
            output: listOpenPullRequestsOutput,
            handler: async ({ projectKey, repositorySlug }) => [
                {
                    id: 1,
                    title: `Open pull request for ${projectKey}/${repositorySlug}`,
                    state: "OPEN"
                }
            ]
        });

        this.registry.register({
            id: "merge-pull-request",
            summary: "Merge a pull request",
            description: "Marks a pull request as merged without performing a remote call.",
            input: z.object({ id: z.number().int(), projectKey: z.string(), repositorySlug: z.string() }),
            output: minimalPullRequest,
            handler: async ({ id }) => ({
                id,
                title: `Pull request #${id}`,
                state: "MERGED"
            })
        });
    }
}

export const createServer = (registry?: OperationRegistry): BitbucketMCPServer => new BitbucketMCPServer(registry);
