```typescript
import { z } from 'zod';

// Contract for SSE transport
export const sseTransportContract = {
  name: 'transport.sse',
  description: 'Verifies that the server correctly handles SSE connections.',
  request: z.object({
    topic: z.string(),
  }),
  // SSE is a stream, so the response is a sequence of events, not a single object.
  // This contract represents a single event in the stream.
  event: z.object({
    id: z.string().optional(),
    event: z.string().optional(),
    data: z.any(),
  }),
};

// Contract for HTTP Streaming transport
export const httpStreamingTransportContract = {
  name: 'transport.httpStreaming',
  description: 'Verifies that the server can stream data over HTTP.',
  request: z.object({
    resourceId: z.string(),
  }),
  // The response is a stream of chunks. This contract represents one chunk.
  chunk: z.object({
    data: z.string(), // Assuming string chunks for simplicity
    isLast: z.boolean(),
  }),
};
```
