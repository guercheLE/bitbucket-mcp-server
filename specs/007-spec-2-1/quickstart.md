# Quickstart: Complete API Operation Implementation

This guide provides a quick way to test the core functionality of the implemented Bitbucket API operations using the 3-tool semantic discovery pattern.

## Prerequisites

- A running instance of the Bitbucket MCP Server.
- The server is configured with valid Bitbucket credentials (e.g., via environment variables).
- The vector database has been generated and is accessible to the server.

## Testing the Implementation

This quickstart follows the primary user story: discovering and executing an API operation. We will use "listing repositories" as the example.

### Step 1: Discover the Operation ID using `search-ids`

Use a natural language query to find the operation related to listing repositories.

**Request:**

```json
{
  "tool": "search-ids",
  "params": {
    "query": "list all repositories in a project"
  }
}
```

**Expected Response:**
The server should return a paginated list of matching operation summaries. The top result should be for listing repositories.

```json
{
  "items": [
    {
      "id": "bitbucket.repositories.list",
      "summary": "Returns a paginated list of repositories in the specified project.",
      "compatibility": {
        "cloud": true,
        "dataCenter": ">=7.16.0"
      }
    }
    // ... other results
  ],
  "pagination": {
    "total_count": 1,
    "has_more": false
  }
}
```

_(Note: The exact `id` may vary based on final implementation, but it should be clear and descriptive.)_

### Step 2: Get Operation Details using `get-id`

Use the `id` from the previous step to get the detailed schema for the operation.

**Request:**

```json
{
  "tool": "get-id",
  "params": {
    "endpoint_id": "bitbucket.repositories.list"
  }
}
```

**Expected Response:**
The server should return the full details of the operation, including its Zod schema for parameters.

```json
{
  "id": "bitbucket.repositories.list",
  "summary": "Returns a paginated list of repositories in the specified project.",
  "parameters": {
    // A JSON representation of the Zod schema
    "type": "object",
    "properties": {
      "workspace": { "type": "string", "description": "The workspace ID or slug." },
      "projectKey": { "type": "string", "description": "The project key." }
    },
    "required": ["workspace", "projectKey"]
  },
  "response": {
    // A JSON representation of the Zod schema for the response
  }
}
```

### Step 3: Execute the Operation using `call-id`

Finally, execute the operation with the required parameters.

**Request:**

```json
{
  "tool": "call-id",
  "params": {
    "endpoint_id": "bitbucket.repositories.list",
    "params": {
      "workspace": "my-workspace",
      "projectKey": "MYPROJ"
    }
  }
}
```

**Expected Response:**
The server will call the actual Bitbucket API and return the result, which should be a paginated list of repository objects.

```json
{
  "items": [
    {
      "slug": "my-first-repo",
      "name": "My First Repo",
      "scm": "git",
      "is_private": true
      // ... other repository fields
    },
    {
      "slug": "another-repo",
      "name": "Another Repo",
      "scm": "git",
      "is_private": true
      // ... other repository fields
    }
  ],
  "pagination": {
    "total_count": 2,
    "has_more": false
  }
}
```

This completes the end-to-end test of the semantic discovery and execution workflow. The same 3-step process can be used for any of the 200+ implemented Bitbucket API operations.
