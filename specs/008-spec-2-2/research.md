# Research: Enterprise Readiness

## 1. Security Hardening (Helmet, CORS, Rate Limiting, Circuit Breaker)

### Helmet

- **Purpose**: Sets various HTTP headers to secure Express apps.
- **Integration**: `app.use(helmet());`
- **Key Headers**:
  - `Content-Security-Policy`: Prevents XSS.
  - `Strict-Transport-Security`: Enforces HTTPS.
  - `X-Frame-Options`: Prevents clickjacking.
- **Reference**: [https://helmetjs.github.io/](https://helmetjs.github.io/)

### CORS (Cross-Origin Resource Sharing)

- **Purpose**: Allows/denies cross-origin requests.
- **Integration**: `app.use(cors(corsOptions));`
- **`corsOptions`**:
  - `origin`: Whitelist of allowed origins (can be a string, regex, or function).
  - `methods`: `['GET', 'POST', 'PUT', 'DELETE']`.
- **Reference**: [https://expressjs.com/en/resources/middleware/cors.html](https://expressjs.com/en/resources/middleware/cors.html)

### Rate Limiting (`express-rate-limit`)

- **Purpose**: Prevents brute-force attacks by limiting request frequency.
- **Integration**: `app.use(rateLimit({ windowMs, max }));`
- **Configuration**:
  - `windowMs`: Time frame (e.g., `15 * 60 * 1000` for 15 minutes).
  - `max`: Max requests per window per IP.
  - `keyGenerator`: Can be customized to create a key based on IP and user ID.
- **Reference**: [https://www.npmjs.com/package/express-rate-limit](https://www.npmjs.com/package/express-rate-limit)

### Circuit Breaker (`opossum`)

- **Purpose**: Prevents cascading failures when a service (e.g., Bitbucket API) is down.
- **Integration**: Wrap Axios calls in a circuit breaker.
- **State Machine**: Closed -> Open -> Half-Open.
- **Configuration**:
  - `timeout`: Time until the action is considered a failure.
  - `errorThresholdPercentage`: Percentage of failures to trip the breaker.
  - `resetTimeout`: Time in open state before moving to half-open.
- **Reference**: [https://nodeshift.github.io/opossum/](https://nodeshift.github.io/opossum/)

## 2. Observability (Prometheus, Advanced Logging)

### Prometheus (`prom-client`)

- **Purpose**: Exposes application metrics for scraping by a Prometheus server.
- **Integration**:
  1.  Create a registry: `const register = new client.Registry();`
  2.  Define metrics (Counter, Gauge, Histogram).
  3.  Create a `/metrics` endpoint: `res.set('Content-Type', register.contentType); res.end(await register.metrics());`
- **Key Metrics**:
  - `http_requests_total`: Counter for total requests.
  - `http_request_duration_ms`: Histogram for request latency.
  - `app_version`: Gauge to expose the application version.
- **Reference**: [https://www.npmjs.com/package/prom-client](https://www.npmjs.com/package/prom-client)

### Advanced Logging (`winston`)

- **Purpose**: Flexible logging with multiple transports.
- **Integration**: Already in use, can be extended.
- **Log Rotation**: Use `winston-daily-rotate-file`.
  - `filename`: `'application-%DATE%.log'`.
  - `datePattern`: `'YYYY-MM-DD-HH'`.
  - `zippedArchive`: `true`.
  - `maxSize`: `'20m'`.
  - `maxFiles`: `'14d'`.
- **Reference**: [https://www.npmjs.com/package/winston-daily-rotate-file](https://www.npmjs.com/package/winston-daily-rotate-file)

## 3. New Transport Protocols (SSE, HTTP Streaming)

### Server-Sent Events (SSE)

- **Purpose**: Unidirectional real-time communication from server to client.
- **Integration**:
  - Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
  - Send data chunks formatted as `data: { "key": "value" }\n\n`.
- **Use Case**: Pushing updates for long-running MCP tool calls.

### HTTP Streaming

- **Purpose**: Similar to SSE but more flexible; can be used for various data formats.
- **Integration**:
  - Use `res.write(chunk)` to send data pieces as they become available.
  - End the stream with `res.end()`.
- **Use Case**: Streaming large responses that don't fit in memory.

## 4. Multi-Language Support (`i18next`)

- **Purpose**: Internationalization (i18n) framework.
- **Integration**:
  1.  Initialize `i18next` with a backend (e.g., `i18next-fs-backend`).
  2.  Use middleware (`i18next-http-middleware`) to detect user language from headers.
  3.  Organize translation files in `locales/[language]/translation.json`.
  4.  Use `t('key')` function to retrieve translated strings.
- **Reference**: [https://www.i18next.com/](https://www.i18next.com/)
