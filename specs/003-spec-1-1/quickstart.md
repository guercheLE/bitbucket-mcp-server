# Quickstart: Server & Connectivity

This guide provides the steps to start the MCP server and verify its basic functionality.

---

## Prerequisites

- Node.js 18+
- pnpm

## 1. Installation

```bash
pnpm install
```

## 2. Environment Variables

Create a `.env` file in the root of the project with the following content:

```
BITBUCKET_HOST=https://your-bitbucket-instance.com
BITBUCKET_USERNAME=your-username
BITBUCKET_PASSWORD=your-password-or-token
HTTP_PORT=3000
LOG_LEVEL=info
```

## 3. Start the Server

```bash
pnpm start
```

The server will start and listen on both `stdio` and `HTTP` (port 3000). It will also attempt to connect to the Bitbucket instance.

## 4. Verify Connectivity

You can send a request to the health check endpoint to verify that the server is running:

```bash
curl http://localhost:3000/health
```

If the server is running and connected to Bitbucket, you should receive a `200 OK` response.

## 5. Stop the Server

```bash
pnpm stop
```

This will gracefully shut down the server.
