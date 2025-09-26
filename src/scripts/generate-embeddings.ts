import { promises as fs } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

import type { Database as BetterSqlite3Database, Statement } from "better-sqlite3";
import Database from "better-sqlite3";
import { load as loadVecExtension } from "sqlite-vec";

import { OPERATION_CONTRACTS, type OperationContract } from "../contracts/operations";
import { ApiOperationSourceSchema, type ApiOperationSource } from "../models/api-operation-source";
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
    sources?: ApiOperationSource[];
    progressInterval?: number;
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
const DETERMINISTIC_EMBEDDING_DIMENSIONS = 384;

let cachedEmbedder: Embedder | undefined;
let cachedModelId: string | undefined;

const resolvePath = (filePath: string): string => (isAbsolute(filePath) ? filePath : join(process.cwd(), filePath));

interface OperationCandidate {
    id: string;
    record: unknown;
    isFallback: boolean;
}

const toTitleCase = (value: string): string =>
    value
        .split(/[-_.]/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");

const inferTags = (operation: OperationContract): string[] => {
    const segments = operation.id.split(".").slice(1);
    const tags = segments.filter(Boolean);
    if (tags.length > 0) {
        return Array.from(new Set(tags));
    }

    const pathSegments = operation.path
        .split("/")
        .filter((segment) => segment && !segment.startsWith("{"));
    if (pathSegments.length > 0) {
        return Array.from(new Set(pathSegments));
    }

    return ["bitbucket"];
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripTrailingPeriod = (value: string): string => value.replace(/\.$/, "");

const createDeterministicEmbedder = (dimensions: number = DETERMINISTIC_EMBEDDING_DIMENSIONS): Embedder => {
    return async (text: string): Promise<number[]> => {
        const vector = new Array<number>(dimensions).fill(0);
        for (let index = 0; index < text.length; index += 1) {
            const codePoint = text.charCodeAt(index);
            vector[index % dimensions] += codePoint;
        }

        const normalizer = text.length === 0 ? 1 : text.length;
        return vector.map((value) => value / normalizer);
    };
};

const shouldUseDeterministicEmbedder = (): boolean => {
    const mode = process.env.EMBEDDINGS_MODE?.toLowerCase();
    const offline = process.env.OFFLINE_EMBEDDINGS?.toLowerCase();

    if (!mode && !offline) {
        return false;
    }

    return (
        mode === "deterministic" ||
        mode === "hash" ||
        mode === "offline" ||
        offline === "1" ||
        offline === "true"
    );
};

const buildFallbackRecord = (operation: OperationContract): ApiOperationSource => {
    const normalizedDescription = normalizeWhitespace(operation.description ?? "");
    const cleaned = normalizedDescription.length > 0 ? stripTrailingPeriod(normalizedDescription) : toTitleCase(operation.id);

    return {
        id: operation.id,
        operationName: cleaned,
        summary: normalizedDescription.length > 0 ? cleaned : undefined,
        endpoint: operation.path,
        type: operation.method,
        tags: inferTags(operation),
        description: cleaned,
        compatibility: { cloud: true }
    };
};

const readMetadataFile = async (filePath: string): Promise<Map<string, unknown>> => {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(rawContent);

    if (!Array.isArray(parsed)) {
        throw new Error("Source data must be an array of API operation objects");
    }

    const entries = new Map<string, unknown>();
    for (const candidate of parsed) {
        if (candidate && typeof candidate === "object") {
            const id = (candidate as { id?: unknown }).id;
            if (typeof id === "string" && id.length > 0) {
                entries.set(id, candidate);
            }
        }
    }

    return entries;
};

const resolveOperationCandidates = async (
    options: GenerateEmbeddingsOptions,
    logger: Pick<Logger, "info" | "warn" | "error">
): Promise<OperationCandidate[]> => {
    if (options.sources) {
        return options.sources.map((source) => ({ id: source.id, record: source, isFallback: false }));
    }

    const operations = Array.from(OPERATION_CONTRACTS.values());
    const sourcePath = resolvePath(options.sourcePath ?? DEFAULT_SOURCE_PATH);

    let metadataById: Map<string, unknown> = new Map();
    try {
        metadataById = await readMetadataFile(sourcePath);
    } catch (error) {
        logger.warn(`Unable to load metadata file at ${sourcePath}: ${error instanceof Error ? error.message : error}`);
    }

    return operations.map((operation) => {
        const metadata = metadataById.get(operation.id);
        if (!metadata) {
            logger.warn(`No metadata found for operation ${operation.id}, using fallback values.`);
            return { id: operation.id, record: buildFallbackRecord(operation), isFallback: true };
        }

        const enriched = {
            ...metadata,
            id: operation.id,
            endpoint: operation.path,
            type: operation.method
        };

        return { id: operation.id, record: enriched, isFallback: false };
    });
};

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
    const databasePath = resolvePath(options.databasePath ?? DEFAULT_DATABASE_PATH);
    const modelId = options.model ?? DEFAULT_MODEL_ID;

    let usingDeterministicEmbedder = false;
    let embedder: Embedder;

    if (options.embedder) {
        embedder = options.embedder;
    } else if (shouldUseDeterministicEmbedder()) {
        usingDeterministicEmbedder = true;
        const dimensionsHint = options.embeddingDimensions && options.embeddingDimensions > 0
            ? options.embeddingDimensions
            : DETERMINISTIC_EMBEDDING_DIMENSIONS;
        embedder = createDeterministicEmbedder(dimensionsHint);
        logger.warn(
            "Deterministic fallback embedder enabled via environment settings; semantic embeddings will not be generated."
        );
    } else {
        try {
            embedder = await getDefaultEmbedder(modelId);
        } catch (error) {
            usingDeterministicEmbedder = true;
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(
                `Unable to load embedding model "${modelId}" (${message}). Falling back to deterministic local embedder. Set EMBEDDINGS_MODE=deterministic to suppress this warning.`
            );
            const dimensionsHint = options.embeddingDimensions && options.embeddingDimensions > 0
                ? options.embeddingDimensions
                : DETERMINISTIC_EMBEDDING_DIMENSIONS;
            embedder = createDeterministicEmbedder(dimensionsHint);
        }
    }

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

    const candidates = await resolveOperationCandidates(options, logger);

    const summary: GenerateEmbeddingsSummary = {
        total: candidates.length,
        successes: 0,
        failures: 0,
        databasePath
    };

    if (summary.total === 0) {
        logger.warn("No operations available to generate embeddings.");
    } else {
        if (usingDeterministicEmbedder) {
            logger.info(`Generating embeddings for ${summary.total} operations using deterministic local vectors.`);
        } else {
            logger.info(`Generating embeddings for ${summary.total} operations using model ${modelId}.`);
        }
    }

    const progressInterval = Math.max(
        1,
        options.progressInterval ?? Math.max(1, Math.floor(summary.total / 10))
    );

    const reportProgress = (processed: number): void => {
        if (processed === 0) {
            return;
        }

        if (processed === summary.total || processed % progressInterval === 0) {
            logger.info(
                `Processed ${processed}/${summary.total} operations (successes: ${summary.successes}, failures: ${summary.failures}).`
            );
        }
    };

    const fallbackOperationIds = new Set<string>();

    try {
        let processed = 0;

        for (const candidate of candidates) {
            const currentIndex = processed + 1;
            const parsed = ApiOperationSourceSchema.safeParse(candidate.record);
            if (!parsed.success) {
                summary.failures += 1;
                logger.error(`Validation failed for operation ${candidate.id}: ${parsed.error.message}`);
                processed = currentIndex;
                reportProgress(processed);
                continue;
            }

            const operation = parsed.data;
            const serialized = JSON.stringify(operation);

            if (candidate.isFallback) {
                fallbackOperationIds.add(operation.id);
            }

            let vector: number[];
            try {
                vector = await embedder(serialized);
            } catch (error) {
                summary.failures += 1;
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Embedding generation failed for operation ${operation.id}: ${message}`);
                processed = currentIndex;
                reportProgress(processed);
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
                    processed = currentIndex;
                    reportProgress(processed);
                    continue;
                }

                insert = prepareTable(database, dimensions);
            } else if (vector.length !== insert.dimensions) {
                summary.failures += 1;
                logger.error(
                    `Embedding dimension mismatch for ${operation.id}. Expected ${insert.dimensions}, received ${vector.length}`
                );
                processed = currentIndex;
                reportProgress(processed);
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

            processed = currentIndex;
            reportProgress(processed);
        }

        if (fallbackOperationIds.size === 0) {
            logger.info("All operations had metadata in the source; no fallbacks were required.");
        } else {
            const fallbackList = Array.from(fallbackOperationIds);
            const preview = fallbackList.slice(0, 10).join(", ");
            const suffix = fallbackOperationIds.size > 10 ? "…" : "";
            logger.warn(
                `Fallback metadata used for ${fallbackOperationIds.size} operations: ${preview}${suffix}`
            );
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
