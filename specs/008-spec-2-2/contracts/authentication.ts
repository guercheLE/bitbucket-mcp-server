```typescript
import { z } from 'zod';

// Contract for OAuth 2.0 authentication flow
export const oauth2Contract = {
  name: 'authentication.oauth2',
  description: 'Verifies that the server can perform OAuth 2.0 authentication.',
  request: z.object({
    accessToken: z.string(),
  }),
  response: z.object({
    authenticated: z.boolean(),
    user: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  }),
};

// Contract for authentication fallback logic
export const authFallbackContract = {
  name: 'authentication.fallback',
  description: 'Tests the priority-based authentication fallback logic.',
  request: z.object({
    credentials: z.record(z.any()), // Represents different credential types
    preferredOrder: z.array(z.string()),
  }),
  response: z.object({
    methodUsed: z.string(),
    authenticated: z.boolean(),
  }),
};
```
