import type { IncomingMessage, ServerResponse } from 'node:http';

export interface HttpStreamChunk {
  data: string | Buffer;
  isLast?: boolean;
}

export interface HttpStreamConnection {
  write(chunk: HttpStreamChunk): Promise<void>;
  close(): void;
}

export interface HttpStreamTransportOptions {
  contentType?: string;
}

export interface HttpStreamTransport {
  handle(
    req: IncomingMessage,
    res: ServerResponse,
    onConnect: (connection: HttpStreamConnection) => Promise<void> | void,
  ): Promise<void>;
}

export const createHttpStreamTransport = (
  options: HttpStreamTransportOptions = {},
): HttpStreamTransport => {
  const contentType = options.contentType ?? 'application/json; charset=utf-8';

  return {
    async handle(req, res, onConnect): Promise<void> {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');

      if (
        typeof (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders === 'function'
      ) {
        (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders();
      } else {
        res.writeHead(res.statusCode || 200);
      }

      let closed = false;

      const connection: HttpStreamConnection = {
        async write(chunk) {
          if (closed) {
            return;
          }
          res.write(chunk.data);
          if (chunk.isLast) {
            connection.close();
          }
        },
        close() {
          if (closed) {
            return;
          }
          closed = true;
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
