# Console Client Usage Guide

This guide walks through installing, configuring, and operating the Bitbucket MCP console client. It expands on the semantic discovery workflow covered in the Quickstart and provides additional reference material for everyday use.

---

## 1. Overview

The console client is a Node.js executable that discovers tools from the Bitbucket MCP server at runtime and exposes them as CLI commands. Every command corresponds to a server capability, so new tools become immediately available without a client update.

Key features:

- Automatic capability discovery using the MCP protocol
- Dynamic command registration powered by `commander.js`
- First-class support for the semantic discovery workflow (`search-ids`, `get-id`, `call-id`)
- Consistent JSON output suitable for shell scripting and automation

---

## 2. Prerequisites

1. **Node.js 18+** installed locally.
2. **Bitbucket MCP Server** running and reachable over HTTP.
3. The following environment variable or CLI flag defined to tell the client where the MCP server lives:
   - `BITBUCKET_MCP_ENDPOINT`
   - `MCP_SERVER_URL`
   - `MCP_ENDPOINT`
   - or pass `--endpoint <url>` when invoking the client programmatically.

---

## 3. Installation

The client ships with the repository and is compiled alongside the server. After cloning the project:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Link the executable (optional but recommended for local development):
   ```bash
   npm link
   ```
   This exposes the binary as `mcp-client` on your PATH.

To invoke the bundled TypeScript directly during development without linking, use `node dist/client/index.js` (after `npm run build`).

---

## 4. Configuration

The client accepts a minimal JSON configuration object, but most users only need the endpoint. You can configure it in three ways:

- **Environment variable**: `export BITBUCKET_MCP_ENDPOINT="https://localhost:8765"`
- **Process environment**: set the variable inline, e.g. `BITBUCKET_MCP_ENDPOINT=http://127.0.0.1:8765 mcp-client --help`
- **Programmatic usage**: pass `endpoint` when embedding the client through `buildClient` or `run` in TypeScript.

If no endpoint can be resolved, the client exits with an informative error.

---

## 5. Discovering Commands

Run the help command to trigger capability discovery and list all commands provided by the server:

```bash
mcp-client --help
```

Sample output:

```
Usage: mcp-client [options] [command]

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  call-id [options]  Execute Bitbucket API operation with dynamic parameter validation and authentication
  get-id [options]   Retrieve detailed schema and documentation for specific Bitbucket API operation
  search-ids [options] Semantic search across Bitbucket API operations and documentation
  help [command]     display help for command
```

Commands are sorted alphabetically and reflect the current server capabilities. If a capability disappears server-side, the command is automatically removed during the next client invocation.

---

## 6. Semantic Discovery Workflow

Follow the three-step workflow to go from a vague goal to an executed Bitbucket operation:

1. **Search for candidates**
   ```bash
   mcp-client search-ids --query "list projects"
   ```
   - Returns a ranked list of matching operations.
   - Supports additional flags such as `--limit <number>` and `--include-archived` when the server exposes them.

2. **Inspect a specific operation**
   ```bash
   mcp-client get-id --endpoint-id "bitbucket.list-projects"
   ```
   - Shows the JSON schema, descriptions, and input expectations.
   - Use the schema to craft valid arguments for execution.

3. **Execute the operation**
   ```bash
   mcp-client call-id --endpoint-id "bitbucket.list-projects"
   ```
   - Forwards arguments to the MCP server and streams JSON responses to stdout.

All commands print structured JSON so you can pipe the output into tools such as `jq` or other automation scripts.

---

## 7. Scripted & Programmatic Usage

You can embed the client programmatically inside another Node.js script:

```ts
import { run } from 'bitbucket-mcp-server/dist/client';

await run(['node', 'mcp-client', 'search-ids', '--query', 'pull requests'], {
  endpoint: process.env.BITBUCKET_MCP_ENDPOINT,
});
```

The exported `buildClient` API returns the underlying `commander.js` `Command` instance and the `McpService`, allowing advanced integrations, custom logging, or alternative transports.

---

## 8. Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `Unable to determine MCP endpoint` | Endpoint not configured | Set `BITBUCKET_MCP_ENDPOINT` or pass `--endpoint` programmatically. |
| `Command "xyz" is not supported` | Server did not advertise the tool | Run `mcp-client --help` to refresh capabilities. Ensure the server exposes the desired tool. |
| Command exits without output | Tool returned `undefined` or empty result | This is expected for no-op commands. Add `--verbose` logging on the server for more insight. |
| HTTP or network errors | Server offline or credentials invalid | Start the server, verify firewall/proxy rules, and confirm authentication configuration. |

---

## 9. Related Resources

- [`quickstart.md`](./quickstart.md) – fast walkthrough of the same workflow
- Server-side documentation in `docs/configuration.md`
- Feature specification in `specs/010-spec-3-2/spec.md`

With the documentation complete, the console client is ready for end users and automation scenarios alike.
