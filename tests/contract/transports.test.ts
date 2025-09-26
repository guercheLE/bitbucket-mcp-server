import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import {
  createHttpStreamTransport,
  type HttpStreamConnection,
} from '../../src/server/transports/httpStream';
import { createSseTransport, type SseConnection } from '../../src/server/transports/sse';

describe('transport contracts', () => {
  describe('sseTransportContract', () => {
    it('initializes the SSE stream and flushes events', async () => {
      const req = new EventEmitter();
      const res = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        end: jest.fn(),
      } as any;

      const transport = createSseTransport({ heartbeatIntervalMs: 0 });

      await transport.handle(req as any, res as any, async (connection: SseConnection) => {
        await connection.send({ data: { message: 'hello' }, event: 'update', id: '1' });
        connection.close();
      });

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream;charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('id: 1'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('event: update'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('data: {"message":"hello"}'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('\n\n'));
    });
  });

  describe('httpStreamingTransportContract', () => {
    it('streams chunks over the HTTP response', async () => {
      const req = new EventEmitter();
      const passThrough = new PassThrough();
      const res = Object.assign(passThrough, {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(passThrough.end.bind(passThrough)),
      });
      const transport = createHttpStreamTransport();
      const chunks: string[] = [];

      passThrough.on('data', (chunk) => {
        chunks.push(chunk.toString());
      });

      await transport.handle(req as any, res as any, async (stream: HttpStreamConnection) => {
        await stream.write({ data: 'chunk-1', isLast: false });
        await stream.write({ data: 'chunk-2', isLast: true });
      });

      expect(chunks.join('')).toContain('chunk-1');
      expect(chunks.join('')).toContain('chunk-2');
    });
  });
});
