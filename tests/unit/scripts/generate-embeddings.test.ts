import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { load as loadVecExtension } from 'sqlite-vec';

const pipelineMock = jest.fn();
jest.mock('sentence-transformers', () => ({
    __esModule: true,
    pipeline: pipelineMock,
}));

import { generateEmbeddings } from '../../../src/scripts/generate-embeddings';

jest.mock('sqlite-vec', () => ({
    load: jest.fn(),
}));

jest.mock('better-sqlite3', () => {
    const factory = jest.fn(() => {
        const statementRun = jest.fn();
        return {
            pragma: jest.fn(),
            exec: jest.fn(),
            prepare: jest.fn().mockReturnValue({ run: statementRun }),
            close: jest.fn(),
            __statementRun: statementRun,
        };
    });

    return {
        __esModule: true,
        default: factory,
    };
});

import Database from 'better-sqlite3';

jest.mock('sentence-transformers', () => ({
    pipeline: jest.fn(),
}));

describe('generateEmbeddings', () => {
    let mkdirSpy: jest.SpiedFunction<typeof fs.mkdir>;

    beforeEach(() => {
        jest.clearAllMocks();
        (Database as unknown as jest.Mock).mockClear();
        mkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
        delete process.env.EMBEDDINGS_MODE;
        delete process.env.OFFLINE_EMBEDDINGS;
    });

    afterEach(() => {
        mkdirSpy.mockRestore();
    });

    it('processes provided sources using a custom embedder and reports failures', async () => {
        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const embedder = jest.fn()
            .mockResolvedValueOnce([0.1, 0.2, 0.3])
            .mockRejectedValueOnce(new Error('embedding failure'))
            .mockResolvedValueOnce([0.5, 0.6]);

        const validSource = {
            id: 'bitbucket.search',
            operationName: 'Search',
            summary: 'summary',
            endpoint: '/rest/api',
            type: 'GET' as const,
            tags: ['search'],
            description: 'description',
            compatibility: { cloud: true },
        };

        const anotherSource = {
            ...validSource,
            id: 'bitbucket.get',
            operationName: 'Get',
        };

        const mismatchSource = {
            ...validSource,
            id: 'bitbucket.diff',
            operationName: 'Diff',
        };

        const invalidSource = { id: 'invalid' } as unknown as typeof validSource;

        const databasePath = path.join(os.tmpdir(), `embeddings-${Date.now()}.db`);

        const summary = await generateEmbeddings({
            sources: [validSource, anotherSource, mismatchSource, invalidSource],
            embedder,
            embeddingDimensions: 3,
            databasePath,
            logger,
            progressInterval: 1,
        });

        expect(summary).toEqual({
            total: 4,
            successes: 1,
            failures: 3,
            databasePath: path.resolve(databasePath),
        });

        expect(embedder).toHaveBeenCalledTimes(3);

        const DatabaseMock = Database as unknown as jest.Mock;
        const dbInstanceResult = DatabaseMock.mock.results[0];

        expect(dbInstanceResult?.type).toBe('return');

        const dbInstance = (dbInstanceResult?.value ?? {}) as {
            exec?: jest.Mock;
            prepare?: jest.Mock;
            close?: jest.Mock;
            __statementRun?: jest.Mock;
        };

        expect(dbInstance.exec).toHaveBeenCalledWith('DROP TABLE IF EXISTS bitbucket_api_embeddings;');
        expect(dbInstance.prepare).toHaveBeenCalledTimes(1);
        expect(dbInstance.__statementRun).toHaveBeenCalledTimes(1);
        expect(dbInstance.close).toHaveBeenCalledTimes(1);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('embedding failure'));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Embedding dimension mismatch'));
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Validation failed for operation'));
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Embedding generation finished'));
        expect((loadVecExtension as unknown as jest.Mock)).toHaveBeenCalledTimes(1);
    });

    it('falls back to deterministic embeddings when environment requests it', async () => {
        process.env.EMBEDDINGS_MODE = 'deterministic';

        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const source = {
            id: 'bitbucket.semantic',
            operationName: 'Semantic',
            summary: 'semantic',
            endpoint: '/rest/api',
            type: 'GET' as const,
            tags: ['semantic'],
            description: 'desc',
            compatibility: { cloud: true },
        };

        const summary = await generateEmbeddings({
            sources: [source],
            logger,
            progressInterval: 1,
        });

        expect(summary.successes).toBe(1);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Deterministic fallback embedder enabled'));
    });

    it('logs a warning when the embedding model cannot be loaded and reuses the fallback embedder', async () => {
        pipelineMock.mockImplementation(async () => {
            throw new Error('pipeline failure');
        });

        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const source = {
            id: 'bitbucket.pipeline',
            operationName: 'Pipeline',
            summary: 'pipeline',
            endpoint: '/rest/api',
            type: 'GET' as const,
            tags: ['pipeline'],
            description: 'desc',
            compatibility: { cloud: true },
        };

        await generateEmbeddings({
            sources: [source],
            logger,
            progressInterval: 1,
            model: 'unit-test-model',
        });

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Unable to load embedding model "unit-test-model"'),
        );
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining('deterministic local vectors'),
        );

        logger.warn.mockClear();
        logger.info.mockClear();

        await generateEmbeddings({
            sources: [source],
            logger,
            progressInterval: 1,
            model: 'unit-test-model',
        });

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Unable to load embedding model "unit-test-model"'),
        );
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
