# Quickstart: 3-Tool Implementation

This quickstart demonstrates the end-to-end flow of using the 3-tool semantic discovery pattern.

## 1. Find an Operation ID

First, use the `search-ids` tool to find a relevant Bitbucket API operation. Let's say we want to find out how to get a list of projects.

**Request:**

```json
{
  "tool": "search-ids",
  "params": {
    "query": "get list of projects"
  }
}
```

**Response:**

```json
[
  {
    "id": "GET /rest/api/1.0/projects",
    "description": "Get a list of projects.",
    "score": 0.95
  }
]
```

## 2. Get the Operation Schema

Now that we have the `OperationID` (`GET /rest/api/1.0/projects`), use the `get-id` tool to retrieve its parameter schema.

**Request:**

```json
{
  "tool": "get-id",
  "params": {
    "id": "GET /rest/api/1.0/projects"
  }
}
```

**Response (conceptual):**
This will return a Zod schema. For this specific endpoint, the schema would be empty as it takes no parameters.

```typescript
z.object({});
```

## 3. Call the Operation

Finally, use the `call-id` tool to execute the operation. Since there are no parameters, we pass an empty object.

**Request:**

```json
{
  "tool": "call-id",
  "params": {
    "id": "GET /rest/api/1.0/projects",
    "parameters": {}
  }
}
```

**Response:**
The response will be the direct output from the Bitbucket API.

```json
{
  "size": 1,
  "limit": 25,
  "isLastPage": true,
  "values": [
    {
      "key": "PROJ",
      "id": 1,
      "name": "My Project",
      "public": true,
      "type": "NORMAL",
      "link": {
        "url": "/projects/PROJ",
        "rel": "self"
      }
    }
  ],
  "start": 0
}
```
