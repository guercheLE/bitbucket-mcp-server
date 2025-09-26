import {
  SearchIdsParams,
  type SearchIdsParamsInput,
  SearchIdsResponse,
  type SearchIdsResponseOutput,
} from '../contracts/search-ids';
import type { Logger } from '../utils/logger';
import { createLogger } from '../utils/logger';
import type { ToolRegistration } from './types';

/**
 * Minimal contract fulfilled by consumers capable of performing semantic vector searches.
 */
export interface VectorDbClient {
  search(
    query: string,
    options?: { limit?: number },
  ): Promise<{ id: string; description: string; score: number }[]>;
}
/**
 * Dependencies required to construct the `search-ids` tool.
 */
export interface SearchIdsToolDependencies {
  vectorDb: VectorDbClient;
  logger?: Pick<Logger, 'debug' | 'info' | 'warn' | 'error'>;
  defaultLimit?: number;
}

const TOOL_NAME = 'search-ids';
const TOOL_TITLE = 'Search Bitbucket Operation IDs';
const TOOL_DESCRIPTION = 'Perform a semantic search over Bitbucket API operations.';
const DEFAULT_LIMIT = 10;

/**
 * Creates the `search-ids` MCP tool which performs semantic lookups over Bitbucket operation embeddings.
 *
 * @param dependencies - Collaborators responsible for vector search and logging.
 * @returns A tool registration compatible with the MCP server runtime.
 */
export const createSearchIdsTool = (
  dependencies: SearchIdsToolDependencies,
): ToolRegistration<typeof SearchIdsParams, SearchIdsResponseOutput> => {
  const logger =
    dependencies.logger ??
    createLogger({ level: 'info', defaultMeta: { scope: 'tool:search-ids' } });
  const vectorDb = dependencies.vectorDb;
  const defaultLimit = dependencies.defaultLimit ?? DEFAULT_LIMIT;

  const handler = async (params: SearchIdsParamsInput): Promise<SearchIdsResponseOutput> => {
    const parsed = SearchIdsParams.parse(params);
    const limit = parsed.limit ?? defaultLimit;
    const results = await vectorDb.search(parsed.query, { limit });
    logger.debug?.('Vector search completed', {
      query: parsed.query,
      resultCount: results.length,
      limit,
    });
    return SearchIdsResponse.parse(results);
  };

  return {
    name: TOOL_NAME,
    config: {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      inputSchema: SearchIdsParams,
    },
    outputSchema: SearchIdsResponse,
    handler,
  };
};
