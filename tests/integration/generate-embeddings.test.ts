import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { load as loadVecExtension } from 'sqlite-vec';

import { OPERATION_CONTRACTS } from '../../src/contracts/operations';
import { ApiOperationSourceSchema } from '../../src/models/api-operation-source';
import { generateEmbeddings } from '../../src/scripts/generate-embeddings';
import type { Logger } from '../../src/utils/logger';

const EMBEDDING_DIMENSION = 6;

const createEmbedding = (text: string): number[] => {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  for (let index = 0; index < text.length; index += 1) {
    vector[index % EMBEDDING_DIMENSION] += text.charCodeAt(index);
  }
  const normalizer = text.length === 0 ? 1 : text.length;
  return vector.map((value) => value / normalizer);
};

describe('generateEmbeddings', () => {
  let workDir: string;
  let sourcePath: string;
  let databasePath: string;
  const totalOperations = OPERATION_CONTRACTS.size;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'bitbucket-embeddings-'));
    sourcePath = join(workDir, 'bitbucket-api.json');
    databasePath = join(workDir, 'bitbucket-embeddings.db');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  const embedder = async (text: string): Promise<number[]> => createEmbedding(text);

  const writeSampleData = (records: unknown[]): void => {
    writeFileSync(sourcePath, JSON.stringify(records, null, 2), 'utf-8');
  };

  const createLogger = () => {
    const entries: { level: 'info' | 'error' | 'warn'; message: string }[] = [];
    const logger: Pick<Logger, 'info' | 'error' | 'warn'> & {
      entries: { level: 'info' | 'error' | 'warn'; message: string }[];
    } = {
      info: (...args: unknown[]) => {
        const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
        entries.push({ level: 'info', message });
        return logger as unknown as Logger;
      },
      warn: (...args: unknown[]) => {
        const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
        entries.push({ level: 'warn', message });
        return logger as unknown as Logger;
      },
      error: (...args: unknown[]) => {
        const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
        entries.push({ level: 'error', message });
        return logger as unknown as Logger;
      },
      entries,
    };
    return logger;
  };

  it('creates a sqlite-vec database and stores embeddings', async () => {
    const records = [
      {
        id: 'bitbucket.repositories.get',
        operationName: 'Get Repository',
        endpoint: '/2.0/repositories/{workspace}/{repo_slug}',
        type: 'GET',
        tags: ['repositories'],
        description: 'Fetches repository metadata',
        samples: "axios.get('/2.0/repositories/my-workspace/my-repo')",
      },
      {
        id: 'bitbucket.repositories.list',
        operationName: 'List Repositories',
        endpoint: '/2.0/repositories/{workspace}',
        type: 'GET',
        tags: ['repositories'],
        description: 'Lists repositories for a workspace',
      },
    ];

    writeSampleData(records);
    const logger = createLogger();

    const summary = await generateEmbeddings({
      sourcePath,
      databasePath,
      embedder,
      embeddingDimensions: EMBEDDING_DIMENSION,
      logger,
    });

    expect(summary).toMatchObject({
      total: totalOperations,
      successes: totalOperations,
      failures: 0,
      databasePath,
    });
    expect(existsSync(databasePath)).toBe(true);
    expect(
      logger.entries.find((entry) => entry.message.includes('Generating embeddings for')),
    ).toBeDefined();
    expect(logger.entries.find((entry) => entry.message.includes('Processed'))).toBeDefined();
    expect(
      logger.entries.find(
        (entry) => entry.level === 'warn' && entry.message.includes('Fallback metadata used'),
      ),
    ).toBeDefined();

    const database = new Database(databasePath);
    loadVecExtension(database);

    const recordRow = database
      .prepare<
        [string],
        { id: string; metadata: string }
      >('SELECT id, metadata FROM bitbucket_api_embeddings WHERE id = ?')
      .get('bitbucket.repositories.get');

    expect(recordRow).toBeDefined();
    const parsedRecord = ApiOperationSourceSchema.parse(records[0]);
    expect(recordRow && JSON.parse(recordRow.metadata)).toEqual(parsedRecord);

    database.close();
  });

  it('logs validation errors but continues processing other records', async () => {
    const validRecord = {
      id: 'bitbucket.repositories.get',
      operationName: 'Get Repository',
      endpoint: '/2.0/repositories/{workspace}/{repo_slug}',
      type: 'GET',
      tags: ['repositories'],
      description: 'Fetches repository metadata',
    };

    const invalidRecord = {
      id: 'bitbucket.repositories.list',
      endpoint: '/2.0/repositories/{workspace}',
      type: 'GET',
      tags: ['repositories'],
      description: 'Lists repositories for a workspace',
    };

    writeSampleData([validRecord, invalidRecord]);
    const logger = createLogger();

    const summary = await generateEmbeddings({
      sourcePath,
      databasePath,
      embedder,
      embeddingDimensions: EMBEDDING_DIMENSION,
      logger,
    });

    expect(summary.total).toBe(totalOperations);
    expect(summary.failures).toBe(1);
    expect(summary.successes).toBe(totalOperations - 1);
    expect(logger.entries.find((entry) => entry.level === 'error')).toBeDefined();
    expect(
      logger.entries.find(
        (entry) => entry.level === 'warn' && entry.message.includes('Fallback metadata used'),
      ),
    ).toBeDefined();
    expect(existsSync(databasePath)).toBe(true);

    const database = new Database(databasePath);
    loadVecExtension(database);
    const rows = database
      .prepare<[], { id: string }>('SELECT id FROM bitbucket_api_embeddings')
      .all();
    expect(rows.find((row) => row.id === validRecord.id)).toBeDefined();
    expect(rows.find((row) => row.id === invalidRecord.id)).toBeUndefined();
    database.close();
  });
});
