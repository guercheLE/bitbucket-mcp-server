import type { IncomingMessage, ServerResponse } from 'node:http';

export interface SseEvent {
  id?: string;
  event?: string;
  retry?: number;
  data: unknown;
}

export interface SseConnection {
  send(event: SseEvent): Promise<void>;
  close(): void;
}

export interface SseTransportOptions {
  heartbeatIntervalMs?: number;
  serializer?: (data: unknown) => string;
}

export interface SseTransport {
  handle(
    req: IncomingMessage,
    res: ServerResponse,
    onConnect: (connection: SseConnection) => Promise<void> | void,
  ): Promise<void>;
}

const serializeData = (input: unknown): string => {
  if (typeof input === 'string') {
    return input;
  }

  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
};

const formatEvent = (event: SseEvent, serializer: (data: unknown) => string): string => {
  const lines: string[] = [];

  if (event.id) {
    lines.push(`id: ${event.id}`);
  }

  if (event.event) {
    lines.push(`event: ${event.event}`);
  }

  const serialized = serializer(event.data);
  const payload = serialized.split(/\r?\n/);
  for (const line of payload) {
    lines.push(`data: ${line}`);
  }

  if (typeof event.retry === 'number') {
    lines.push(`retry: ${event.retry}`);
  }

  lines.push('');
  return `${lines.join('\n')}`;
};

export const createSseTransport = (options: SseTransportOptions = {}): SseTransport => {
  const heartbeatInterval = options.heartbeatIntervalMs ?? 15_000;
  const serializer = options.serializer ?? serializeData;

  return {
    async handle(req, res, onConnect): Promise<void> {
      res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      if (
        typeof (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders === 'function'
      ) {
        (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders();
      } else {
        res.writeHead(res.statusCode || 200);
      }

      const eventQueue: SseEvent[] = [];
      let closed = false;

      const flush = (event: SseEvent) => {
        if (closed) {
          return;
        }
        const payload = formatEvent(event, serializer);
        res.write(`${payload}\n`);
      };

      const heartbeat =
        heartbeatInterval > 0
          ? setInterval(() => {
              res.write(':\n\n');
            }, heartbeatInterval)
          : null;

      const connection: SseConnection = {
        async send(event) {
          eventQueue.push(event);
          flush(eventQueue.shift()!);
        },
        close() {
          if (closed) {
            return;
          }
          closed = true;
          if (heartbeat) {
            clearInterval(heartbeat);
          }
          res.end();
        },
      };

      req.on('close', () => connection.close());

      try {
        await onConnect(connection);
      } finally {
        connection.close();
      }
    },
  };
};

export type { SseTransport as Transport };
