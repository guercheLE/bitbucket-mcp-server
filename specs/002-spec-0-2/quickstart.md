# Quickstart: Core Component Design & Test Definition

This document provides a guide to understanding and using the core components of the Bitbucket MCP server.

## 1. Setup

1.  Ensure you have Node.js 18+ installed.
2.  Install dependencies: `npm install`
3.  Configure your Bitbucket credentials (Personal Access Token) in a `.env` file.

## 2. Running the Server

Start the server using:

```bash
npm start
```

## 3. Using the Core Tools

The server exposes a 3-tool semantic discovery pattern for interacting with Bitbucket Pull Requests.

### Step 1: `search-ids`

Find relevant operations using a natural language query.

**Example:**

```
search-ids "get all open pull requests"
```

**Result:**
A list of operation IDs, including one for "get-open-pull-requests".

### Step 2: `get-id`

Get the contract (Zod schema) for an operation.

**Example:**

```
get-id "get-open-pull-requests"
```

**Result:**
A JSON object containing the Zod schema for the inputs and outputs of the operation.

### Step 3: `call-id`

Execute the operation with the required parameters.

**Example:**

```
call-id "get-open-pull-requests" '{"project": "MYPROJ", "repository": "my-repo"}'
```

**Result:**
A list of open pull requests from the specified repository.
