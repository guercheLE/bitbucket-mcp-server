import {
  format,
  transports,
  createLogger as winstonCreateLogger,
  type Logger,
  type transport,
} from 'winston';

const SENSITIVE_KEYS = [
  'password',
  'passphrase',
  'token',
  'secret',
  'authorization',
  'apiKey',
  'apikey',
  'accessToken',
  'refreshToken',
];

const REDACTED_VALUE = '[REDACTED]';
const SPLAT = Symbol.for('splat');

const sanitizeValue = (value: unknown): unknown => {
  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
          return [key, REDACTED_VALUE];
        }

        return [key, sanitizeValue(val)];
      }),
    );
  }

  if (typeof value === 'string') {
    return value.replace(/bearer\s+[a-z0-9._-]+/gi, `Bearer ${REDACTED_VALUE}`);
  }

  return value;
};

const sanitizeInfo = format((info) => {
  const additionalKeys = Object.keys(info).filter(
    (key) => !['level', 'message', 'timestamp', 'service'].includes(key),
  );

  for (const key of additionalKeys) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      info[key] = REDACTED_VALUE;
      continue;
    }

    info[key] = sanitizeValue(info[key]);
  }

  const splatValues = info[SPLAT];
  if (Array.isArray(splatValues)) {
    info[SPLAT] = splatValues.map((entry) => sanitizeValue(entry));
  }

  if (typeof info.message === 'string') {
    info.message = sanitizeValue(info.message);
  }

  return info;
});

export interface LoggerOptions {
  level?: string;
  transports?: transport[];
  defaultMeta?: Record<string, unknown>;
}

const resolveLevel = (level?: string): string => level ?? process.env.LOG_LEVEL ?? 'info';

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const loggerTransports =
    options.transports && options.transports.length > 0
      ? options.transports
      : [new transports.Console()];

  return winstonCreateLogger({
    level: resolveLevel(options.level),
    defaultMeta: { service: 'bitbucket-mcp-server', ...options.defaultMeta },
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      sanitizeInfo(),
      format.json(),
    ),
    transports: loggerTransports,
  });
};

export type { Logger };
