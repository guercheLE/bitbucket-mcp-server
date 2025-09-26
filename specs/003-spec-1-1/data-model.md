# Data Model: Server & Connectivity

This document outlines the data models for the MCP server and its connectivity with Bitbucket.

---

## 1. Server Configuration

### `ServerConfig`

Represents the configuration for the MCP server, loaded from environment variables.

| Field      | Type     | Description                                | Validation                   |
| ---------- | -------- | ------------------------------------------ | ---------------------------- |
| `port`     | `number` | The port for the HTTP transport.           | Required, integer            |
| `logLevel` | `string` | The logging level (e.g., 'info', 'debug'). | Optional, defaults to 'info' |

### `BitbucketCredentials`

Represents the credentials for connecting to the Bitbucket API, loaded from environment variables.

| Field      | Type     | Description                      | Validation          |
| ---------- | -------- | -------------------------------- | ------------------- |
| `host`     | `string` | The Bitbucket server host.       | Required, valid URL |
| `username` | `string` | The username for authentication. | Required            |
| `password` | `string` | The password or API token.       | Required            |

---

## 2. Bitbucket API

### `BitbucketServerInfo`

Represents the information retrieved from the Bitbucket server.

| Field     | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `version` | `string` | The version of the Bitbucket server.                           |
| `type`    | `string` | The type of the Bitbucket server (Cloud, Server, Data Center). |

---

## 3. State Management

### `ServerState`

Represents the internal state of the MCP server.

| Field                 | Type                  | Description                                                             |
| --------------------- | --------------------- | ----------------------------------------------------------------------- |
| `isRunning`           | `boolean`             | Indicates if the server is currently running.                           |
| `bitbucketConnected`  | `boolean`             | Indicates if the server is connected to Bitbucket.                      |
| `bitbucketServerInfo` | `BitbucketServerInfo` | Information about the connected Bitbucket server.                       |
| `degradedMode`        | `boolean`             | Indicates if the server is in a degraded mode due to connection issues. |
