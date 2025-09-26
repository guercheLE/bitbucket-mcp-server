import { randomUUID } from 'node:crypto';

import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

import { CallIdParams, type CallIdParamsOutput, CallIdResponse } from '../contracts/call-id';
import type { OperationContract } from '../contracts/operations';
import { SchemaNotFoundError } from '../services/SchemaService';
import type { Logger } from '../utils/logger';
import { createLogger } from '../utils/logger';
import type { ToolRegistration } from './types';

/**
 * Subset of {@link SchemaService} interactions required by the `call-id` tool.
 */
export interface SchemaOperationClient {
  getOperation(id: string): Promise<OperationContract>;
}
/**
 * Dependencies needed to construct the `call-id` tool.
 */
export interface CallIdToolDependencies {
  schemaService: SchemaOperationClient;
  httpClient?: (config: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>;
  baseUrl?: string;
  logger?: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;
}

const TOOL_NAME = 'call-id';
const TOOL_TITLE = 'Execute Bitbucket Operation';
const TOOL_DESCRIPTION = 'Validates parameters and executes the Bitbucket API operation.';
const DEFAULT_BASE_URL = process.env.BITBUCKET_HOST ?? 'https://bitbucket.example.com';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Interpolates template path parameters and separates any remaining values as query parameters.
 */
const resolvePath = (
  path: string,
  parameters: Record<string, unknown>,
): { path: string; query: Record<string, unknown> } => {
  const usedKeys = new Set<string>();
  const resolvedPath = path.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    if (!(key in parameters)) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    usedKeys.add(key);
    const value = parameters[key];
    return encodeURIComponent(String(value));
  });

  const query = Object.fromEntries(
    Object.entries(parameters).filter(([key]) => !usedKeys.has(key)),
  );

  return { path: resolvedPath, query };
};

/**
 * Attempts to extract a human-readable error message from Bitbucket error payloads.
 */
const extractErrorMessage = (payload: unknown): string | undefined => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (isRecord(payload)) {
    if (typeof payload.message === 'string') {
      return payload.message;
    }

    if (Array.isArray(payload.errors)) {
      const message = payload.errors
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry;
          }
          if (isRecord(entry) && typeof entry.message === 'string') {
            return entry.message;
          }
          return undefined;
        })
        .filter((entry): entry is string => typeof entry === 'string')
        .join('; ');
      if (message) {
        return message;
      }
    }
  }

  return undefined;
};

/**
 * Creates the `call-id` MCP tool which validates parameters and executes Bitbucket API operations.
 *
 * @param dependencies - Collaborators for schema resolution, HTTP execution, and logging.
 */
export const createCallIdTool = (
  dependencies: CallIdToolDependencies,
): ToolRegistration<typeof CallIdParams, unknown> => {
  const logger =
    dependencies.logger ?? createLogger({ level: 'info', defaultMeta: { scope: 'tool:call-id' } });
  const schemaService = dependencies.schemaService;
  const httpClient = dependencies.httpClient ?? ((config) => axios(config));
  const baseUrl = dependencies.baseUrl ?? DEFAULT_BASE_URL;

  const handler = async (params: CallIdParamsOutput): Promise<unknown> => {
    const parsed = CallIdParams.parse(params);

    let operation: OperationContract;
    try {
      operation = await schemaService.getOperation(parsed.id);
    } catch (error) {
      if (error instanceof SchemaNotFoundError) {
        logger.warn?.('Operation not found', { id: parsed.id });
        throw new Error('Not Found');
      }
      throw error;
    }

    const validation = operation.schema.safeParse(parsed.parameters ?? {});
    if (!validation.success) {
      const message = validation.error.errors
        .map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join(', ');
      logger.warn?.('Parameter validation failed', { id: parsed.id, message });
      throw new Error(message);
    }

    const resolved = resolvePath(operation.path, validation.data);

    const requestConfig: AxiosRequestConfig = {
      baseURL: baseUrl,
      method: operation.method,
      url: resolved.path,
    };

    if (operation.method === 'GET' || operation.method === 'DELETE') {
      requestConfig.params = resolved.query;
    } else {
      requestConfig.data = validation.data;
    }

    try {
      const response = await httpClient(requestConfig);
      logger.debug?.('Bitbucket API call succeeded', { id: parsed.id, status: response.status });
      return response.data;
    } catch (error) {
      const correlationId = randomUUID();
      const status =
        isRecord(error) && isRecord(error.response) && typeof error.response.status === 'number'
          ? error.response.status
          : 500;
      const message =
        isRecord(error) && isRecord(error.response)
          ? (extractErrorMessage(error.response.data) ?? 'Bitbucket API request failed')
          : (error as Error).message;

      logger.error?.('Bitbucket API request failed', {
        id: parsed.id,
        status,
        correlationId,
        error: message,
      });

      return {
        status,
        message,
        correlationId,
      };
    }
  };

  return {
    name: TOOL_NAME,
    config: {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema: CallIdParams,
    },
    outputSchema: CallIdResponse,
    handler,
  };
};
