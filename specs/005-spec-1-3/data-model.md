# Data Model: 3-Tool Implementation

## Entities

### OperationID

- **Description**: A unique string that identifies a Bitbucket API operation. It typically combines the HTTP method and the API path.
- **Type**: `string`
- **Example**: `"GET /rest/api/1.0/projects/{projectKey}/repos"`

### ZodSchema

- **Description**: A Zod object schema that defines the validation rules for the parameters of a given `OperationID`.
- **Type**: `z.ZodObject<any>`
- **Example**:

  ```typescript
  import { z } from 'zod';

  const GetRepoParamsSchema = z.object({
    projectKey: z.string(),
    repositorySlug: z.string(),
  });
  ```

### SearchResult

- **Description**: The object returned by the `search-ids` tool.
- **Fields**:
  - `id`: `OperationID` - The unique identifier for the operation.
  - `description`: `string` - A brief description of what the operation does.
  - `score`: `number` - The similarity score from the vector search.

### StandardizedError

- **Description**: The standardized JSON error response returned by `call-id` when a Bitbucket API call fails.
- **Fields**:
  - `status`: `number` - The HTTP status code from the Bitbucket API response.
  - `message`: `string` - A user-friendly error message.
  - `correlationId`: `string` - A unique ID to correlate the user-facing error with server-side logs.
