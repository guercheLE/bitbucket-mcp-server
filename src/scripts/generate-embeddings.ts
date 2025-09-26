import { promises as fs } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import type { Database as BetterSqlite3Database, Statement } from "better-sqlite3";
import Database from "better-sqlite3";
import { load as loadVecExtension } from "sqlite-vec";

import { ApiOperationSourceSchema } from "../models/api-operation-source";
import { createLogger, type Logger } from "../utils/logger";

/**
 * Runtime options for the embedding generation pipeline. Consumers may override defaults to support
 * custom data sources, output locations, or dependency injection for tests.
 */
export interface GenerateEmbeddingsOptions {
    sourcePath?: string;
    databasePath?: string;
    model?: string;
    embeddingDimensions?: number;
    embedder?: Embedder;
    logger?: Pick<Logger, "info" | "warn" | "error">;
}

/**
 * Summary describing the outcome of a pipeline run.
 */
export interface GenerateEmbeddingsSummary {
    total: number;
    successes: number;
    failures: number;
    databasePath: string;
}

export type Embedder = (input: string) => Promise<number[]>;

const DEFAULT_SOURCE_PATH = "data/bitbucket-api.json";
const DEFAULT_DATABASE_PATH = "dist/db/bitbucket-embeddings.db";
const DEFAULT_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";

let cachedEmbedder: Embedder | undefined;
let cachedModelId: string | undefined;

const resolvePath = (filePath: string): string => (isAbsolute(filePath) ? filePath : join(process.cwd(), filePath));

const getDefaultEmbedder = async (modelId: string): Promise<Embedder> => {
    if (cachedEmbedder && cachedModelId === modelId) {
        return cachedEmbedder;
    }

    const module = (await import("sentence-transformers")) as {
        pipeline?: (...args: unknown[]) => Promise<unknown>;
    };
    if (typeof module.pipeline !== "function") {
        throw new Error("sentence-transformers pipeline function is not available");
    }

    const embedPipeline = (await module.pipeline("feature-extraction", modelId)) as (
        text: string,
        options?: Record<string, unknown>
    ) => Promise<unknown>;

    const embed: Embedder = async (text: string) => {
        const raw = await embedPipeline(text, {
            pooling: "mean",
            normalize: true
        });

        if (Array.isArray(raw)) {
            return raw.map((value) => Number(value));
        }

        if (raw instanceof Float32Array) {
            return Array.from(raw.values());
        }

        if (raw && typeof raw === "object" && "data" in raw) {
            const data = (raw as { data?: unknown }).data;
            if (Array.isArray(data)) {
                return data.map((value) => Number(value));
            }

            if (data instanceof Float32Array) {
                return Array.from(data.values());
            }
        }

        throw new Error("Unexpected embedding tensor format returned by sentence-transformers");
    };

    cachedEmbedder = embed;
    cachedModelId = modelId;

    return embed;
};

interface PreparedInsert {
    statement: Statement;
    dimensions: number;
}

const prepareTable = (database: BetterSqlite3Database, dimensions: number): PreparedInsert => {
    if (dimensions <= 0) {
        throw new Error("Embedding dimension must be a positive integer");
    }

    database.exec("DROP TABLE IF EXISTS bitbucket_api_embeddings;");
    database.exec(
        `CREATE VIRTUAL TABLE bitbucket_api_embeddings USING vec0(
            id TEXT PRIMARY KEY,
            embedding FLOAT[${dimensions}],
            metadata TEXT
        );`
    );

    const statement = database.prepare(
        "INSERT INTO bitbucket_api_embeddings (id, embedding, metadata) VALUES (@id, vec_f32(@embedding), @metadata);"
    );

    return { statement, dimensions };
};

const ensureDirectory = async (filePath: string): Promise<void> => {
    const directory = dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
};

/**
 * Execute the embedding generation pipeline: read API operation sources, compute embeddings, and persist
 * them into a sqlite-vec database file. The process is resilient—validation errors, embedding failures,
 * and SQLite issues are logged while the remaining records continue to be processed.
 */
export const generateEmbeddings = async (options: GenerateEmbeddingsOptions = {}): Promise<GenerateEmbeddingsSummary> => {
    const logger = options.logger ?? createLogger({ level: "info" });
    const sourcePath = resolvePath(options.sourcePath ?? DEFAULT_SOURCE_PATH);
    const databasePath = resolvePath(options.databasePath ?? DEFAULT_DATABASE_PATH);
    const modelId = options.model ?? DEFAULT_MODEL_ID;

    logger.info(`Reading API operation data from ${sourcePath}`);

    const rawContent = await fs.readFile(sourcePath, "utf-8").catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to read source file ${sourcePath}: ${message}`);
        throw error;
    });

    let rawRecords: unknown;

    try {
        rawRecords = JSON.parse(rawContent);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Source file ${sourcePath} contained invalid JSON: ${message}`);
        throw error;
    }

    if (!Array.isArray(rawRecords)) {
        throw new Error("Source data must be an array of API operation objects");
    }

    const embedder = options.embedder ?? (await getDefaultEmbedder(modelId));

    await ensureDirectory(databasePath);

    const database = new Database(databasePath);
    database.pragma("journal_mode = WAL");
    loadVecExtension(database);

    let insert: PreparedInsert | undefined;
    let dimensions = options.embeddingDimensions ?? 0;

    if (dimensions > 0) {
        insert = prepareTable(database, dimensions);
    } else {
        database.exec("DROP TABLE IF EXISTS bitbucket_api_embeddings;");
    }

    const summary: GenerateEmbeddingsSummary = {
        total: 0,
        successes: 0,
        failures: 0,
        databasePath
    };

    try {
        for (const record of rawRecords) {
            summary.total += 1;

            const parsed = ApiOperationSourceSchema.safeParse(record);
            if (!parsed.success) {
                summary.failures += 1;
                logger.error(`Validation failed for record at index ${summary.total - 1}: ${parsed.error.message}`);
                continue;
            }

            const operation = parsed.data;
            const serialized = JSON.stringify(operation);

            let vector: number[];
            try {
                vector = await embedder(serialized);
            } catch (error) {
                summary.failures += 1;
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Embedding generation failed for operation ${operation.id}: ${message}`);
                continue;
            }

            if (!insert) {
                if (dimensions === 0) {
                    dimensions = vector.length;
                }

                if (vector.length !== dimensions) {
                    summary.failures += 1;
                    logger.error(
                        `Embedding dimension mismatch for ${operation.id}. Expected ${dimensions}, received ${vector.length}`
                    );
                    continue;
                }

                insert = prepareTable(database, dimensions);
            } else if (vector.length !== insert.dimensions) {
                summary.failures += 1;
                logger.error(
                    `Embedding dimension mismatch for ${operation.id}. Expected ${insert.dimensions}, received ${vector.length}`
                );
                continue;
            }

            try {
                insert.statement.run({
                    id: operation.id,
                    embedding: JSON.stringify(vector),
                    metadata: serialized
                });
                summary.successes += 1;
            } catch (error) {
                summary.failures += 1;
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Failed to persist embedding for operation ${operation.id}: ${message}`);
            }
        }

        logger.info(
            `Embedding generation finished with ${summary.successes} successes and ${summary.failures} failures out of ${summary.total} records.`
        );
    } finally {
        database.close();
    }

    return summary;
};

if (require.main === module) {
    generateEmbeddings()
        .then((summary) => {
            // eslint-disable-next-line no-console
            console.info(`Embedding generation completed. Database written to ${summary.databasePath}`);
        })
        .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            // eslint-disable-next-line no-console
            console.error(`Embedding generation failed: ${message}`);
            process.exitCode = 1;
        });
}
