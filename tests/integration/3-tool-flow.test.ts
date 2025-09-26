import { z } from 'zod';

import { createCallIdTool } from '../../src/tools/call-id';
import { createGetIdTool } from '../../src/tools/get-id';
import { createSearchIdsTool } from '../../src/tools/search-ids';

const OPERATION_ID = 'GET /rest/api/1.0/projects';

const buildSearchResult = () => ({
  id: OPERATION_ID,
  description: 'Get a list of projects.',
  score: 0.95,
});

describe('3-tool quickstart flow', () => {
  it('searches, retrieves schema, and calls the Bitbucket API', async () => {
    const schema = z.object({});

    const vectorDb = {
      search: jest.fn().mockResolvedValue([buildSearchResult()]),
    };
    const schemaService = {
      getSchema: jest.fn().mockResolvedValue(schema),
      getOperation: jest.fn().mockResolvedValue({
        id: OPERATION_ID,
        method: 'GET' as const,
        path: '/rest/api/1.0/projects',
        description: 'Get a list of projects.',
        schema,
      }),
    };
    const httpClient = jest.fn().mockResolvedValue({
      data: {
        size: 1,
        values: [
          {
            key: 'PROJ',
            id: 1,
            name: 'My Project',
          },
        ],
      },
    });

    const searchTool = createSearchIdsTool({ vectorDb });
    const getTool = createGetIdTool({ schemaService });
    const callTool = createCallIdTool({
      schemaService,
      httpClient,
      baseUrl: 'https://bitbucket.example.com',
    });

    const searchResults = await searchTool.handler({ query: 'get list of projects' });
    expect(searchResults).toHaveLength(1);
    const targetOperation = searchResults[0]?.id;
    expect(targetOperation).toBe(OPERATION_ID);

    const retrievedSchema = await getTool.handler({ id: targetOperation! });
    expect(retrievedSchema).toBe(schema);
    expect(schemaService.getSchema).toHaveBeenCalledWith(OPERATION_ID);

    const callResult = await callTool.handler({ id: targetOperation!, parameters: {} });
    expect(callResult).toMatchObject({
      size: 1,
      values: [expect.objectContaining({ key: 'PROJ', name: 'My Project' })],
    });

    expect(vectorDb.search).toHaveBeenCalledWith('get list of projects', { limit: 10 });
    expect(schemaService.getOperation).toHaveBeenCalledWith(OPERATION_ID);
    expect(httpClient).toHaveBeenCalledWith({
      baseURL: 'https://bitbucket.example.com',
      method: 'GET',
      url: '/rest/api/1.0/projects',
      data: undefined,
      params: {},
    });
  });
});
