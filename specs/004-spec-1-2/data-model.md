# Data Model: Vector DB & Embedding Pipeline

This document outlines the data structures for the embedding generation process.

## 1. API Operation Source (`ApiOperationSource`)

This is the structure of the JSON objects that will be the source for generating embeddings. An array of these objects is expected as the input to the embedding script.

- **Format**: JSON
- **Source**: A file, assumed to be `data/bitbucket-api.json`

```typescript
import { z } from 'zod';

export const ApiOperationSourceSchema = z.object({
  /** A unique identifier for the API operation. */
  id: z.string(),

  /** The name of the API operation. */
  operationName: z.string(),

  /** The full endpoint path. */
  endpoint: z.string(),

  /** The HTTP method (e.g., 'GET', 'POST'). */
  type: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),

  /** A list of tags categorizing the operation. */
  tags: z.array(z.string()),

  /** A detailed description of the operation, including its purpose and any related operations. */
  description: z.string(),

  /** The JSON schema for the request body or parameters. */
  inputSchema: z.record(z.string(), z.any()).optional(),

  /** The JSON schema for the successful response body. */
  outputSchema: z.record(z.string(), z.any()).optional(),

  /** The JSON schema for error responses. */
  errorSchema: z.record(z.string(), z.any()).optional(),

  /** A string containing meaningful usage examples. */
  samples: z.string().optional(),
});

export type ApiOperationSource = z.infer<typeof ApiOperationSourceSchema>;
```

## 2. Vector Database Entry

This represents the data that will be stored in the `sqlite-vec` database for each API operation. The embedding itself will be managed by `sqlite-vec`, associated with the `id`.

- **Database**: `sqlite-vec`
- **Table**: `bitbucket_api_embeddings`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (Primary Key) | The unique identifier from `ApiOperationSource`. |
| `embedding` | BLOB | The vector embedding generated from the source data. (Managed by `sqlite-vec`) |
| `metadata` | TEXT | A JSON string containing the full `ApiOperationSource` object for retrieval. |

### Rationale

Storing the full `ApiOperationSource` object as JSON in the `metadata` column allows us to retrieve all necessary context for a search result without needing to join with another data source. When a semantic search returns a matching ID, we can immediately return the full details of the API operation to the user.
