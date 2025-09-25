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

## Commit Workflow

Conventional commits are enforced via Husky and Commitlint. Use messages like:

```bash
feat: add initial server bootstrap
```

## License

This project is licensed under the [LGPL-3.0](LICENSE).
