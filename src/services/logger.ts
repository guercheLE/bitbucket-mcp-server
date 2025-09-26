import fs from 'node:fs';
import path from 'node:path';

import { transports as winstonTransports, type transport } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import type { LogRotationConfig } from '../models/config';
import { LogRotationConfigSchema } from '../models/config';
import { createLogger, type Logger, type LoggerOptions } from '../utils/logger';

export interface LoggerServiceOptions {
  level?: string;
  directory?: string;
  rotation?: Partial<LogRotationConfig>;
  console?: boolean;
  defaultMeta?: Record<string, unknown>;
}

const ensureDirectory = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

export const createRotatingLogger = (options: LoggerServiceOptions = {}): Logger => {
  const rotationConfig = LogRotationConfigSchema.parse(options.rotation ?? {});
  const directory = options.directory ?? path.resolve(process.cwd(), 'logs');
  ensureDirectory(directory);

  const loggerTransports: transport[] = [
    new DailyRotateFile({
      filename: path.join(directory, rotationConfig.filename),
      datePattern: rotationConfig.datePattern,
      zippedArchive: rotationConfig.zippedArchive,
      maxSize: rotationConfig.maxSize,
      maxFiles: rotationConfig.maxFiles,
    }),
  ];

  if (options.console !== false) {
    loggerTransports.push(new winstonTransports.Console());
  }

  const loggerOptions: LoggerOptions = {
    level: options.level,
    transports: loggerTransports,
    defaultMeta: options.defaultMeta,
  };

  return createLogger(loggerOptions);
};
