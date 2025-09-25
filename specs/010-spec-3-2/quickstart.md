# Quickstart: Console Client

This guide demonstrates how to use the console client to interact with the Bitbucket MCP Server.

## Prerequisites

1.  The Bitbucket MCP Server is running.
2.  The console client is built and accessible in your PATH.

## Steps

1.  **Verify Client and Server Connection**

    Run the `help` command to ensure the client can connect to the server and list the available commands.

    ```bash
    mcp-client --help
    ```

    **Expected Output**:
    The output should display a list of commands discovered from the server, sorted alphabetically, including `call-id`, `get-id`, and `search-ids`.

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

2.  **Use the Semantic Discovery Workflow**

    Follow the three-tool pattern to find and execute an operation.

    *   **Step 2a: Search for an operation**
        Use `search-ids` to find operations related to "list projects".

        ```bash
        mcp-client search-ids --query "list projects"
        ```

    *   **Step 2b: Get operation details**
        Use `get-id` with an ID from the search results to see its schema.

        ```bash
        mcp-client get-id --endpoint-id "bitbucket.list-projects"
        ```

    *   **Step 2c: Call the operation**
        Use `call-id` to execute the operation.

        ```bash
        mcp-client call-id --endpoint-id "bitbucket.list-projects"
        ```

3.  **Verify Documentation**

    Check for the new user documentation in the `/docs` directory.

    ```bash
    ls -l docs/
    ```

    **Expected Output**:
    The directory listing should include a new file, such as `console-client-usage.md`.
