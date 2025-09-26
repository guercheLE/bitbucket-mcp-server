```typescript
import { z } from 'zod';

// Contract for security middleware - Rate Limiting
export const rateLimitContract = {
  name: 'security.rateLimit',
  description: 'Verifies that the rate limiter rejects excessive requests.',
  request: z.object({
    // No specific payload, the test will involve sending multiple requests
  }),
  response: z.object({
    status: z.number(), // Expect 429 for rate-limited requests
  }),
};

// Contract for security middleware - Circuit Breaker
export const circuitBreakerContract = {
  name: 'security.circuitBreaker',
  description: 'Verifies that the circuit breaker opens on repeated failures.',
  request: z.object({
    forceFailure: z.boolean(), // A flag to make the downstream service fail
  }),
  response: z.object({
    status: z.number(), // Expect 503 when the circuit is open
    message: z.string(),
  }),
};
```;
