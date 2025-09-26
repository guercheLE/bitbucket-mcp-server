# Bitbucket MCP Server

Bitbucket MCP Server is a Model Context Protocol (MCP) integration that provides a governance-first foundation for interacting with Bitbucket Cloud and Data Center APIs. This repository currently contains the initial project scaffolding, testing, and governance tooling described in Spec 0.1.

## Prerequisites

- Node.js 18 or later
- npm 9 or later

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the test suite:
   ```bash
   npm test
   ```
3. Lint the codebase:
   ```bash
   npm run lint
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Running the Server

1. Configure Bitbucket credentials via environment variables (recommended):
   ```bash
   export BITBUCKET_HOST="https://your-bitbucket-instance.com"
   export BITBUCKET_USERNAME="your-username"
   export BITBUCKET_PASSWORD="your-password-or-token"
   export LOG_LEVEL=info
   export HTTP_PORT=3000
   ```
   Alternatively, you can pass the same values as CLI flags when starting the server.

2. Build the project if you have not already done so:
   ```bash
   npm run build
   ```

3. Start the MCP server using the compiled CLI:
   ```bash
   node dist/cli.js start --host "$BITBUCKET_HOST" --username "$BITBUCKET_USERNAME" --password "$BITBUCKET_PASSWORD" --port "${HTTP_PORT:-3000}" --log-level "${LOG_LEVEL:-info}"
   ```
   The CLI prints the resolved HTTP address once the server is ready. If Bitbucket is temporarily unavailable, the server enters a degraded mode and schedules automatic reconnection attempts.

4. Verify the server is responding over HTTP:
   ```bash
   curl http://127.0.0.1:${HTTP_PORT:-3000}/health
   ```
   A healthy response returns HTTP 200 with details about the Bitbucket connection status.

5. Stop the server gracefully:
   ```bash
   node dist/cli.js stop --port "${HTTP_PORT:-3000}"
   ```
   You can also interrupt the `start` command with `Ctrl+C`; the CLI traps termination signals and shuts the server down cleanly.

## Configuration

Enterprise security, authentication, and observability settings can be tuned through the application configuration schema. See [`docs/configuration.md`](docs/configuration.md) for a comprehensive guide covering CORS, rate limiting, circuit breaker behaviour, log rotation, metrics, and localisation.

## Available Scripts

- `npm test` – Runs Jest in single-run mode.
- `npm run lint` – Lints the project with ESLint.
- `npm run lint:fix` – Applies ESLint auto-fixes where possible.
- `npm run format` – Checks formatting with Prettier.
- `npm run format:fix` – Formats the repository with Prettier.
- `npm run build` – Compiles TypeScript sources to `dist/`.
- `npm run typecheck` – Runs the TypeScript compiler without emitting output.
- `npm run generate-embeddings` – Generates the `sqlite-vec` database from Bitbucket API metadata.

## Generating Embeddings

The embedding pipeline transforms structured Bitbucket API metadata into a `sqlite-vec` database that powers semantic search.

1. Populate `data/bitbucket-api.json` with an array of `ApiOperationSource` objects (see `specs/004-spec-1-2/data-model.md` for the schema).
2. Run the script:
   ```bash
   npm run generate-embeddings
   ```
3. On success the command logs the output path and creates `dist/db/bitbucket-embeddings.db`. Re-run the script whenever the source JSON changes.

All errors are logged per-record, so malformed entries do not halt the overall run.

## Core Models

All domain entities are implemented with [Zod](https://zod.dev) schemas under `src/models` to keep validation close to the data that flows through the MCP tools:

- `ProjectSchema` (`src/models/project.ts`) – Validates Bitbucket projects via `key` and `name` fields.
- `RepositorySchema` (`src/models/repository.ts`) – Associates repositories with their parent projects.
- `BranchSchema` (`src/models/branch.ts`) – Captures repository branches and their latest commit references.
- `UserSchema` (`src/models/user.ts`) – Normalises Bitbucket user metadata.
- `PullRequestSchema` (`src/models/pull-request.ts`) – Aggregates users, branches, timestamps, and link sets for pull requests.

Each schema exports its inferred TypeScript type so services and tests can share a single source of truth for shape definitions.

## Core Services

Tool logic is encapsulated in dedicated service classes:

- `AuthenticationService` (`src/services/auth.ts`) – Configures Axios clients with PAT authentication and detects Bitbucket Cloud vs. Data Center hosts.
- `SearchService` (`src/services/search.ts`) – Provides fuzzy semantic search over registered operations for the `search-ids` MCP tool.
- `DiscoveryService` (`src/services/discovery.ts`) – Returns operation metadata and Zod schemas powering the `get-id` tool.
- `ExecutionService` (`src/services/execution.ts`) – Validates payloads, executes operation handlers, and asserts responses for `call-id`.

Operations are registered through the `OperationRegistry` helper (`src/lib/operations.ts`) and exposed via the `BitbucketMCPServer` (`src/server.ts`) which binds the three MCP tools. The CLI entry point in `src/cli.ts` starts the server with sensible defaults and supports environment-variable configuration for Bitbucket credentials.

## Commit Workflow

Conventional commits are enforced via Husky and Commitlint. Use messages like:

```bash
feat: add initial server bootstrap
```

## License

This project is licensed under the [LGPL-3.0](LICENSE).
