import { EventEmitter } from 'node:events';

import axios, { AxiosError, type AxiosInstance } from 'axios';

import type { BitbucketCredentials } from '../types/config';
import type { BitbucketServerInfo } from '../types/server';
import type { Logger } from '../utils/logger';
import { createLogger } from '../utils/logger';

const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const DEFAULT_RECONNECT_DELAY_MS = 10_000;

const setErrorCause = (error: Error, cause?: unknown) => {
  if (cause !== undefined) {
    try {
      (error as Error & { cause?: unknown }).cause = cause;
    } catch {
      // ignore environments where cause is read-only
    }
  }
};

export class BitbucketServiceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'BitbucketServiceError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, new.target);
    setErrorCause(this, cause);
  }
}

export class BitbucketAuthenticationError extends BitbucketServiceError {
  constructor(message = 'Invalid Bitbucket credentials', cause?: unknown) {
    super(message, cause);
    this.name = 'BitbucketAuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BitbucketConnectionError extends BitbucketServiceError {
  constructor(message = 'Unable to connect to Bitbucket', cause?: unknown) {
    super(message, cause);
    this.name = 'BitbucketConnectionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BitbucketRateLimitError extends BitbucketServiceError {
  constructor(message = 'Bitbucket rate limit exceeded', cause?: unknown) {
    super(message, cause);
    this.name = 'BitbucketRateLimitError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface BitbucketServiceOptions {
  client?: AxiosInstance;
  logger?: Logger;
  retryAttempts?: number;
  retryDelayMs?: number;
  reconnectDelayMs?: number;
}

export interface BitbucketServiceEvents {
  connected: [BitbucketServerInfo];
  error: [BitbucketServiceError];
  disconnected: [];
  reconnected: [BitbucketServerInfo];
}

const normalizeHost = (host: string): string => {
  try {
    const url = new URL(host);
    return url.origin;
  } catch (error) {
    throw new BitbucketServiceError(`Invalid Bitbucket host: ${host}`, { cause: error });
  }
};

const isAxiosError = (error: unknown): error is AxiosError => axios.isAxiosError(error);

const shouldRetry = (error: BitbucketServiceError) => error instanceof BitbucketConnectionError;

export class BitbucketService extends EventEmitter {
  private readonly credentials: BitbucketCredentials;
  private readonly logger: Logger;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;
  private readonly reconnectDelayMs: number;
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;

  private connected = false;
  private serverInfo: BitbucketServerInfo | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(credentials: BitbucketCredentials, options: BitbucketServiceOptions = {}) {
    super();
    this.credentials = credentials;
    this.baseUrl = normalizeHost(credentials.host);
    this.logger = options.logger ?? createLogger({ defaultMeta: { scope: 'bitbucket-service' } });
    this.retryAttempts = options.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.reconnectDelayMs = options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
    this.client =
      options.client ??
      axios.create({
        baseURL: this.baseUrl,
        timeout: 15_000,
        auth: {
          username: credentials.username,
          password: credentials.password,
        },
      });

    this.client.interceptors.request.use((config) => {
      this.logger.debug('Bitbucket request', { method: config.method, url: config.url });
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (isAxiosError(error) && error.response?.status === 429) {
          this.logger.warn('Bitbucket rate limit reached', { url: error.config?.url });
        }
        return Promise.reject(error);
      },
    );
  }

  override on<T extends keyof BitbucketServiceEvents>(
    event: T,
    listener: (...args: BitbucketServiceEvents[T]) => void,
  ): this;
  override on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener as Parameters<EventEmitter['on']>[1]);
  }

  override once<T extends keyof BitbucketServiceEvents>(
    event: T,
    listener: (...args: BitbucketServiceEvents[T]) => void,
  ): this;
  override once(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.once(event, listener as Parameters<EventEmitter['once']>[1]);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getServerInfo(): BitbucketServerInfo | null {
    return this.serverInfo;
  }

  async connect(): Promise<BitbucketServerInfo> {
    this.logger.info('Attempting to connect to Bitbucket', {
      host: this.baseUrl,
    });

    const info = await this.requestWithRetries(() => this.fetchServerInfo());

    this.connected = true;
    this.serverInfo = info;
    this.emit('connected', info);
    this.logger.info('Connected to Bitbucket', info);

    return info;
  }

  scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.logger.warn('Scheduling Bitbucket reconnect', { delayMs: this.reconnectDelayMs });
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        const info = await this.connect();
        this.emit('reconnected', info);
      } catch (error) {
        const normalized = this.normalizeError(error);
        this.emit('error', normalized);
        this.scheduleReconnect();
      }
    }, this.reconnectDelayMs).unref?.();
  }

  dispose(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.removeAllListeners();
  }

  private async requestWithRetries<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: BitbucketServiceError | undefined;

    while (attempt <= this.retryAttempts) {
      try {
        return await operation();
      } catch (error) {
        const normalized = this.normalizeError(error);
        lastError = normalized;
        if (!shouldRetry(normalized) || attempt === this.retryAttempts) {
          this.connected = false;
          this.serverInfo = null;
          this.emit('disconnected');
          this.emit('error', normalized);
          throw normalized;
        }

        const delay = this.retryDelayMs * Math.pow(2, attempt);
        this.logger.warn('Bitbucket request failed, retrying', {
          attempt: attempt + 1,
          delayMs: delay,
          error: normalized.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
      }
    }

    throw lastError ?? new BitbucketConnectionError();
  }

  private async fetchServerInfo(): Promise<BitbucketServerInfo> {
    const endpoints = [
      '/rest/api/1.0/application-properties',
      '/rest/api/latest/application-properties',
      '/rest/api/1.0/server-info',
      '/rest/api/latest/server-info',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.client.get(endpoint);
        return this.parseServerInfo(response.data);
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response?.status === 404) {
            continue;
          }
          throw error;
        }
        throw error;
      }
    }

    throw new BitbucketConnectionError('Unable to detect Bitbucket server information');
  }

  private parseServerInfo(payload: unknown): BitbucketServerInfo {
    const data =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : {};

    const rawVersion = data.version ?? data.buildNumber ?? data.buildVersion ?? 'unknown';
    const version = typeof rawVersion === 'string' ? rawVersion : String(rawVersion);
    const rawType = data.deploymentType ?? data.serverType;
    const type = this.resolveServerType(typeof rawType === 'string' ? rawType : undefined);

    return {
      version,
      type,
    };
  }

  private resolveServerType(rawType?: string): string {
    if (rawType) {
      const normalized = String(rawType).toLowerCase();
      if (normalized.includes('cloud')) {
        return 'Cloud';
      }
      if (normalized.includes('data')) {
        return 'Data Center';
      }
    }

    if (this.baseUrl.includes('bitbucket.org')) {
      return 'Cloud';
    }

    return 'Server';
  }

  private normalizeError(error: unknown): BitbucketServiceError {
    if (error instanceof BitbucketServiceError) {
      return error;
    }

    const errorWithResponse = error as Partial<{ response?: { status?: unknown } }>;
    const status =
      typeof errorWithResponse.response?.status === 'number'
        ? (errorWithResponse.response.status as number)
        : undefined;
    const errorWithCode = error as Partial<{ code?: unknown }>;
    const code = typeof errorWithCode.code === 'string' ? (errorWithCode.code as string) : undefined;
    const message = error instanceof Error ? error.message : 'Unknown Bitbucket error';

    if (status === 401 || status === 403) {
      return new BitbucketAuthenticationError(undefined, error);
    }

    if (status === 429) {
      return new BitbucketRateLimitError(undefined, error);
    }

    if (status !== undefined) {
      if (status >= 500) {
        return new BitbucketConnectionError(undefined, error);
      }
      if (status >= 400) {
        return new BitbucketServiceError(message, error);
      }
    }

    if (code && ['ECONNABORTED', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code)) {
      return new BitbucketConnectionError(undefined, error);
    }

    if (isAxiosError(error)) {
      if (!error.response) {
        return new BitbucketConnectionError('No response received from Bitbucket', error);
      }

      return new BitbucketServiceError(error.message, error);
    }

    return new BitbucketServiceError(message, error);
  }
}
