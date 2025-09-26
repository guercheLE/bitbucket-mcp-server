# Bitbucket MCP Server

Bitbucket MCP Server is a Model Context Protocol (MCP) integration that provides a governance-first foundation for interacting with Bitbucket Cloud and Data Center APIs. This repository currently contains the initial project scaffolding, testing, and governance tooling described in Spec 0.1.

## Prerequisites

- Node.js 18 or later
- npm 9 or later

## Installation

Install the server and client directly from npm:

```bash
npm install @guerchele/bitbucket-mcp-server
```

The package publishes the compiled CLI under `dist/cli.js` and exposes TypeScript helpers for embedding the server programmatically.

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

   A healthy response returns HTTP 200 with details about the Bitbucket connection status. When the Bitbucket API is unavailable the endpoint reports a `degraded` status so automation can pause risky tasks. Metrics from each probe, including response latency, are forwarded to Prometheus under the `health_check_success_rate` gauge.

   You can also scrape Prometheus metrics at:

   ```bash
   curl http://127.0.0.1:${HTTP_PORT:-3000}/metrics
   ```

   The payload aggregates request counts, request durations, health check signals, and internal API latencies.

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

## Maintenance Automation

Three operational scripts live under `src/scripts/maintenance/` and are wired into the CI pipeline as well as the weekly scheduled workflow (`.github/workflows/weekly-maintenance.yml`). Each script is safe to execute locally when you need to run maintenance on demand.

### Dependency refresh (`update-dependencies.sh`)

Checks for non-breaking (minor and patch) package updates using `npm-check-updates` and installs them when available. Exit codes communicate intent: `0` for successful upgrades, `2` when no changes are needed, and `1` if an error occurs. Use the `--dry-run` flag to review prospective changes without modifying the lockfile.

```bash
./src/scripts/maintenance/update-dependencies.sh --dry-run
./src/scripts/maintenance/update-dependencies.sh
```

### Vulnerability monitoring (`monitor-vulnerabilities.sh`)

Runs `npm audit` at a configurable severity threshold (default `critical`). CI executes this on every push to `main`, failing the pipeline when actionable vulnerabilities are detected so the team can respond quickly.

```bash
./src/scripts/maintenance/monitor-vulnerabilities.sh --level high
```

### Documentation drift guard (`regenerate-embeddings.sh`)

Downloads the reference API documentation, stores a checksum, and exits with code `2` whenever the source changes. That signal tells the weekly workflow to request a manual review before regenerating vector embeddings, preventing unintended embedding churn.

```bash
API_DOCS_URL="https://developer.atlassian.com" \
CHECKSUM_FILE=".specify/state/api-checksum.json" \
./src/scripts/maintenance/regenerate-embeddings.sh
```

The weekly workflow triggers every Monday at 08:00 UTC and can also be launched manually from the Actions tab. It runs the dependency refresh in dry-run mode, surfaces vulnerability alerts, and records workflow artefacts to aid triage.

## Release Process

Automated publishing is handled by [semantic-release](https://semantic-release.gitbook.io/semantic-release/). Keep the following guardrails in mind when preparing a release:

- Always fast-forward your local `main` branch to the remote before invoking the release task locally. `semantic-release` aborts if it detects that the local branch is behind the remote, which prevents conflicting history from being published.
- Run the release workflow from CI or from a workstation that has just pulled the latest `origin/main` to guarantee the repository state matches the remote.
- Use [Conventional Commits](https://www.conventionalcommits.org/) to communicate the desired version bump. Prefix a breaking change with `feat!` or include a `BREAKING CHANGE:` footer to request a major bump (for example, publishing `v3.0.0`).
- After pushing the release commit to `main`, let CI execute the release job; it will tag the release and push the npm package automatically when new semantic-release-worthy commits land.

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
