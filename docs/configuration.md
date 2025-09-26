# Server Configuration Guide

This guide documents every runtime option that controls the Enterprise Readiness features introduced in Spec 2.2. The Bitbucket MCP server can be configured entirely in code by passing an `appConfig` object to `createServer`. The CLI (`bitbucket-mcp start`) currently applies the defaults described below. To override them you can bootstrap the server from a custom script:

```ts
import { readFile } from 'node:fs/promises';
import { createServer } from 'bitbucket-mcp-server';

const main = async () => {
  const raw = await readFile('app.config.json', 'utf-8');
  const appConfig = JSON.parse(raw);

  const server = createServer({
    config: { port: 3000, logLevel: 'info' },
    credentials: {
      host: process.env.BITBUCKET_HOST!,
      username: process.env.BITBUCKET_USERNAME!,
      password: process.env.BITBUCKET_PASSWORD!,
    },
    appConfig,
  });

  await server.start();
  process.on('SIGINT', () => server.stop());
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

The schema for `appConfig` is defined in `src/models/config.ts`. Each section below lists the available keys, default values, and their effect on the running server.

## Security Middleware

| Key                                                | Type                                        | Default                            | Description                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `security.helmet`                                  | boolean                                     | `true`                             | Toggles the [Helmet](https://helmetjs.github.io/) middleware. When disabled, no security headers are injected into HTTP responses. |
| `security.cors.origin`                             | string \| RegExp \| Array<string \| RegExp> | `"*"`                              | Allowed origins for CORS requests. Accepts a single origin, a regular expression, or a list of both.                               |
| `security.cors.methods`                            | string[]                                    | `["GET", "POST", "PUT", "DELETE"]` | Whitelisted HTTP methods for cross-origin calls.                                                                                   |
| `security.rateLimit.windowMs`                      | number                                      | `900_000` (15 minutes)             | Duration of the rolling rate-limit window in milliseconds.                                                                         |
| `security.rateLimit.max`                           | number                                      | `100`                              | Maximum request count per window for each client key.                                                                              |
| `security.circuitBreaker.timeout`                  | number                                      | `3000`                             | Time in milliseconds before a Bitbucket API call is considered failed.                                                             |
| `security.circuitBreaker.errorThresholdPercentage` | number                                      | `50`                               | Failure percentage that trips the circuit breaker.                                                                                 |
| `security.circuitBreaker.resetTimeout`             | number                                      | `30000`                            | Wait time before the breaker attempts to close again.                                                                              |

**Rate limiting behaviour.** Keys combine the Express `req.ip` (or the first `x-forwarded-for` value) with the authenticated user identifier. Users are detected in this order:

1. `x-user-id` header
2. `x-forwarded-user` header
3. `req.user.id` (populated by the authentication middleware)
4. Fallback to `anonymous`

You can further customise behaviour by injecting a custom rate limiter factory via `createServer({ dependencies: { createRateLimiter: ... } })`.

## Authentication Fallback Logic

| Key                       | Type            | Default  | Description |
| ------------------------- | --------------- | -------- | ----------- | --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `authentication.priority` | Array<`"oauth2" | "bearer" | "apiKey"    | "basic"`> | `["oauth2", "bearer", "apiKey", "basic"]` | Ordered list that controls which credential types are attempted first when authenticating an incoming request. |

The `AuthService` executes strategies in the declared order and stops at the first successful authentication. Provide only the methods you support in your deployment—unknown values are ignored.

## Observability & Metrics

| Key                                       | Type    | Default                    | Description                                                                                                           |
| ----------------------------------------- | ------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `observability.logRotation.filename`      | string  | `"application-%DATE%.log"` | Filename pattern passed to `winston-daily-rotate-file`.                                                               |
| `observability.logRotation.datePattern`   | string  | `"YYYY-MM-DD"`             | Rotation cadence.                                                                                                     |
| `observability.logRotation.zippedArchive` | boolean | `true`                     | Compress rotated archives.                                                                                            |
| `observability.logRotation.maxSize`       | string  | `"20m"`                    | Maximum size for a log file before rotation.                                                                          |
| `observability.logRotation.maxFiles`      | string  | `"14d"`                    | Retention period or count of rotated files.                                                                           |
| `observability.enableMetrics`             | boolean | `true`                     | When `true`, the server exposes `/metrics` and records per-route request counters and histograms using `prom-client`. |

Log files are written to the `logs/` directory by default. To redirect them elsewhere, wrap `createServer` and supply a custom logger factory through `dependencies.createLogger`.

When metrics are enabled, each HTTP request emits the following Prometheus series:

- `http_requests_total{method,route,status}`
- `http_request_duration_seconds{method,route,status}`

Default buckets for the histogram are `[0.05, 0.1, 0.3, 0.5, 1, 2, 5]` seconds. Disable collection by setting `observability.enableMetrics` to `false`.

## Internationalisation (i18n)

The server bundles the `i18next` middleware. By default it loads translations from the `locales/` directory, uses English (`en`) as the fallback language, and detects the preferred language from the `Accept-Language` header, query parameters, or cookies.

To add a new language:

1. Create `locales/<language-code>/translation.json` with the desired keys.
2. Extend the i18n service by injecting a factory:

   ```ts
   import { createServer } from 'bitbucket-mcp-server';
   import { createI18nService } from './dist/services/i18n';

   const server = createServer({
     appConfig: {
       /* ... */
     },
     dependencies: {
       createI18nService: () =>
         createI18nService({
           fallbackLng: 'en',
           supportedLngs: ['en', 'fr'],
           resourcesPath: './locales',
         }),
     },
   });
   ```

3. Restart the server. Requests that include `Accept-Language: fr` now receive French responses where translations exist.

## Streaming Transports

No additional configuration is required for the SSE or HTTP streaming transports. The following endpoints are always available:

- `GET /transports/sse?topic=<name>` – establishes a Server-Sent Events stream subscribed to the provided topic.
- `GET /transports/http-stream?resourceId=<id>` – starts a chunked HTTP response for long-running jobs.

Both protocols leverage the internal event bus (`EventEmitter`) and inherit the same security, authentication, and observability settings described above.

## Circuit Breaker Fail-Fast Behaviour

The Bitbucket client uses the [`opossum`](https://nodeshift.dev/opossum/) circuit breaker. When the configured thresholds are exceeded, new outbound requests fail immediately with a 503 response until the `resetTimeout` elapses. The server also flips into a "degraded" health state, which is reflected in the `/health` endpoint.

## Example `app.config.json`

```json
{
  "security": {
    "helmet": true,
    "cors": {
      "origin": ["https://console.example.com", "https://ops.example.com"],
      "methods": ["GET", "POST", "OPTIONS"]
    },
    "rateLimit": {
      "windowMs": 60000,
      "max": 30
    },
    "circuitBreaker": {
      "timeout": 2000,
      "errorThresholdPercentage": 40,
      "resetTimeout": 15000
    }
  },
  "observability": {
    "enableMetrics": true,
    "logRotation": {
      "filename": "bitbucket-%DATE%.log",
      "maxFiles": "7d"
    }
  },
  "authentication": {
    "priority": ["oauth2", "bearer", "apiKey"]
  }
}
```

Save the JSON alongside your deployment script and load it with the example at the top of this guide.
