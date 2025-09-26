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

## Available Scripts

- `npm test` – Runs Jest in single-run mode.
- `npm run lint` – Lints the project with ESLint.
- `npm run lint:fix` – Applies ESLint auto-fixes where possible.
- `npm run format` – Checks formatting with Prettier.
- `npm run format:fix` – Formats the repository with Prettier.
- `npm run build` – Compiles TypeScript sources to `dist/`.
- `npm run typecheck` – Runs the TypeScript compiler without emitting output.

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
