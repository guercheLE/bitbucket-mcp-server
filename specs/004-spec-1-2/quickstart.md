# Quickstart: Vector DB & Embedding Pipeline

This guide provides the steps to generate and verify the vector database.

## Prerequisites
- Node.js 18+ installed
- Project dependencies installed (`npm install`)

## Step 1: Prepare the API Documentation Source

1.  Ensure that a file named `bitbucket-api.json` exists in the `data/` directory at the root of the project.
2.  This file should contain an array of `ApiOperationSource` objects, as defined in `data-model.md`.

    **Example `data/bitbucket-api.json`:**
    ```json
    [
      {
        "id": "get-repository",
        "operationName": "Get Repository",
        "endpoint": "/2.0/repositories/{workspace}/{repo_slug}",
        "type": "GET",
        "tags": ["repositories"],
        "description": "Returns the repository.",
        "inputSchema": {},
        "outputSchema": { "type": "object" },
        "samples": "axios.get('/2.0/repositories/my-workspace/my-repo')"
      }
    ]
    ```

## Step 2: Run the Embedding Generation Script

Execute the script to process the source file and create the vector database.

```bash
npm run generate-embeddings
```

-   **Expected Output**:
    -   A log message indicating the number of embeddings generated.
    -   A new file created at `dist/db/bitbucket-embeddings.db`.
    -   A log message for any endpoints that failed to process.

## Step 3: Verify the Database

A simple verification script or a test can be run to ensure the database is valid and contains the expected data.

1.  **Run the verification test:**

    ```bash
    npm test -- tests/integration/embedding-verification.test.ts
    ```

2.  **Expected Test Output**:
    -   The test should pass, confirming:
        -   The database file exists.
        -   The database can be opened.
        -   A sample query for a known API operation (e.g., "get repository") returns the correct ID.

## Success Criteria

The quickstart is successful if:
- The `bitbucket-embeddings.db` file is created.
- The verification test passes, demonstrating that the database is queryable and returns relevant results.
