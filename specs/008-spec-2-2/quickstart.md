# Quickstart: Enterprise Readiness

This guide provides a brief overview of how to configure and use the new enterprise features.

## 1. Configuration

The new features are configured in your main server configuration file (e.g., `config.json`). Below is an example snippet showing the new sections.

```json
{
  "security": {
    "helmet": true,
    "cors": {
      "origin": "https://your-frontend.com"
    },
    "rateLimit": {
      "windowMs": 60000,
      "max": 1000
    },
    "circuitBreaker": {
      "timeout": 5000,
      "errorThresholdPercentage": 50,
      "resetTimeout": 30000
    }
  },
  "observability": {
    "logRotation": {
      "maxSize": "50m",
      "maxFiles": "30d"
    },
    "enableMetrics": true
  },
  "authentication": {
    "priority": ["oauth2", "bearer"]
  },
  "i18n": {
    "fallbackLng": "en",
    "supportedLngs": ["en", "es", "fr"]
  }
}
```

## 2. Verifying Features

### Security
- **Helmet**: Check the response headers for security-related fields like `Content-Security-Policy`.
- **CORS**: Attempt a cross-origin request from an unauthorized domain; it should be blocked.
- **Rate Limiting**: Send a burst of requests exceeding the `max` limit within the `windowMs` timeframe. You should receive a `429 Too Many Requests` error.

### Observability
- **Logging**: Check the specified log directory for rotated log files (e.g., `application-2025-09-25.log`).
- **Metrics**: Access the `/metrics` endpoint of the server (e.g., `http://localhost:3000/metrics`). You should see a text-based response in Prometheus format.

### New Transports
- **SSE**: Connect to an SSE-enabled endpoint using a compatible client. You should receive a stream of events.
- **HTTP Streaming**: Make a request to a streaming endpoint. The response should arrive in chunks.

### Multi-Language Support
- Send a request with an `Accept-Language` header (e.g., `Accept-Language: fr`). Server responses should be in French, provided the translations exist.

## 3. Example: Connecting with SSE

Here is a simple Node.js client example for connecting to an SSE stream:

```javascript
import EventSource from 'eventsource';

const url = 'http://localhost:3000/my-sse-endpoint';
const source = new EventSource(url);

source.onmessage = (event) => {
  console.log('Received event:', JSON.parse(event.data));
};

source.onerror = (err) => {
  console.error('EventSource failed:', err);
};
```
