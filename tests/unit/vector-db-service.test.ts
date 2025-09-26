import type { Database as BetterSqlite3Database, Statement } from 'better-sqlite3';

import { VectorDBService } from '../../src/services/VectorDBService';

jest.mock('sqlite-vec', () => ({
  load: jest.fn(),
}));

const { load: mockLoadVecExtension } = jest.requireMock('sqlite-vec') as { load: jest.Mock };

describe('VectorDBService', () => {
  const createDatabaseFactory = (rows: { id: string; metadata: string; distance?: number }[]) => {
    const all = jest.fn().mockReturnValue(rows);
    const statement: Pick<Statement, 'all'> = {
      all: all as unknown as Statement['all'],
    };

    const prepare = jest.fn().mockReturnValue(statement);
    const close = jest.fn();

    const database = {
      prepare,
      close,
    } as unknown as BetterSqlite3Database;

    return {
      factory: (_path: string) => database,
      prepare,
      all,
      close,
    } as const;
  };

  beforeEach(() => {
    mockLoadVecExtension.mockClear();
  });

  it('returns an empty result set when the query is blank', async () => {
    const embedder = jest.fn();
    const service = new VectorDBService({
      embedder,
      databaseFactory: (_path: string) =>
        ({
          prepare: jest.fn(),
          close: jest.fn(),
        }) as unknown as BetterSqlite3Database,
    });

    await expect(service.search('   ')).resolves.toEqual([]);
    expect(embedder).not.toHaveBeenCalled();
  });

  it('performs a vector search and normalizes results', async () => {
    const rows = [
      {
        id: 'operation-1',
        metadata: JSON.stringify({ description: 'List repositories' }),
        distance: 0.5,
      },
    ];
    const database = createDatabaseFactory(rows);
    const embedder = jest.fn().mockResolvedValue([0.1, 0.2]);

    const service = new VectorDBService({
      embedder,
      databaseFactory: database.factory,
    });

    const results = await service.search('repositories', { limit: 5 });

    expect(embedder).toHaveBeenCalledWith('repositories');
    expect(database.prepare).toHaveBeenCalledTimes(1);
    expect(database.all).toHaveBeenCalledTimes(1);
    expect(database.all.mock.calls[0][1]).toBe(5);
    expect(mockLoadVecExtension).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        id: 'operation-1',
        description: 'List repositories',
      }),
    );
    expect(results[0].score).toBeCloseTo(1 / (1 + 0.5));
  });

  it('closes the database when disposed', async () => {
    const database = createDatabaseFactory([]);
    const embedder = jest.fn().mockResolvedValue([0.5]);

    const service = new VectorDBService({
      embedder,
      databaseFactory: database.factory,
    });

    await service.search('anything');
    service.dispose();

    expect(database.close).toHaveBeenCalledTimes(1);
  });
});
