import { isAbsolute, join } from "node:path";

import type { Database as BetterSqlite3Database, Statement } from "better-sqlite3";
import Database from "better-sqlite3";
import { load as loadVecExtension } from "sqlite-vec";

import type { Logger } from "../utils/logger";
import { createLogger } from "../utils/logger";

type Embedder = (input: string) => Promise<number[]>;

/**
 * Optional parameters that influence how the vector search behaves.
 */
export interface VectorSearchOptions {
    limit?: number;
}
/**
 * Normalized representation of a vector search hit.
 */
export interface VectorSearchResult {
    id: string;
    description: string;
    score: number;
}
/**
 * Configuration options for {@link VectorDBService}.
 */
export interface VectorDBServiceOptions {
    databasePath?: string;
    embedder?: Embedder;
    logger?: Pick<Logger, "debug" | "info" | "warn" | "error">;
    databaseFactory?: (path: string) => BetterSqlite3Database;
}

interface VectorRow {
    id: string;
    metadata: string;
    distance?: number;
}

const DEFAULT_DATABASE_PATH = "vector-db.sqlite";
const DEFAULT_LIMIT = 10;

const resolvePath = (filePath: string): string => (isAbsolute(filePath) ? filePath : join(process.cwd(), filePath));

/**
 * Converts a vector distance metric into a bounded similarity score where higher is better.
 */
const normalizeScore = (distance: number | undefined): number => {
    if (distance == null || Number.isNaN(distance)) {
        return 0;
    }

    // Convert distance (lower is better) into a bounded similarity score (higher is better)
    return 1 / (1 + Math.max(distance, 0));
};

/**
 * Parses optional metadata JSON stored alongside embedding rows.
 */
const parseMetadata = (raw: string): { description?: string } => {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "description" in parsed && typeof parsed.description === "string") {
            return { description: parsed.description };
        }
    } catch {
        // ignore malformed metadata payloads
    }
    return {};
};

/**
 * Dynamically loads the sentence transformer pipeline used to generate embeddings.
 */
const loadEmbedder = async (): Promise<Embedder> => {
    const module = (await import("sentence-transformers")) as {
        pipeline?: (...args: unknown[]) => Promise<unknown>;
    };

    if (typeof module.pipeline !== "function") {
        throw new Error("sentence-transformers pipeline function is not available");
    }

    const embed = (await module.pipeline("feature-extraction", "sentence-transformers/all-MiniLM-L6-v2")) as (
        text: string,
        options?: Record<string, unknown>
    ) => Promise<unknown>;

    return async (text: string) => {
        const raw = await embed(text, { pooling: "mean", normalize: true });

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
};

/**
 * Provides semantic search capabilities over the generated Bitbucket API embedding database.
 *
 * The service lazily loads both the sqlite-vec extension and the sentence transformer model to
 * minimise startup overhead for consumers that may only require schema or metadata lookups.
 */
export class VectorDBService {
    private readonly databasePath: string;
    private readonly logger: Pick<Logger, "debug" | "info" | "warn" | "error">;
    private readonly databaseFactory: (path: string) => BetterSqlite3Database;
    private embedder?: Embedder;
    private database?: BetterSqlite3Database;
    private searchStatement?: Statement<[string, number]>;

    constructor(options: VectorDBServiceOptions = {}) {
        this.databasePath = resolvePath(options.databasePath ?? DEFAULT_DATABASE_PATH);
        this.logger = options.logger ?? createLogger({ level: "info", defaultMeta: { scope: "vector-db-service" } });
        this.databaseFactory = options.databaseFactory ?? ((path: string) => new Database(path, { readonly: true }));
        this.embedder = options.embedder;
    }

    /**
     * Performs a semantic vector search against the embeddings database.
     *
     * @param query - Natural language query describing the target operation.
     * @param options - Optional tuning parameters such as the result limit.
     * @returns Ranked matches ordered by similarity score.
     */
    async search(query: string, options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
        const trimmed = query.trim();
        if (!trimmed) {
            return [];
        }

        const embedder = await this.resolveEmbedder();
        const vector = await embedder(trimmed);

        if (!Array.isArray(vector) || vector.length === 0) {
            this.logger.warn("Embedder returned an empty vector", { queryLength: trimmed.length });
            return [];
        }

        const database = this.getDatabase();
        const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT);

        const rows = this.getSearchStatement(database).all(JSON.stringify(vector), limit) as VectorRow[];

        return rows.map(({ id, metadata, distance }) => {
            const { description } = parseMetadata(metadata);
            return {
                id,
                description: description ?? "",
                score: Number(normalizeScore(distance))
            } satisfies VectorSearchResult;
        });
    }

    /**
     * Disposes of the underlying sqlite connection and prepared statements.
     *
     * Safe to call multiple times.
     */
    dispose(): void {
        if (this.database) {
            try {
                this.database.close();
            } catch (error) {
                this.logger.warn("Failed to close vector database", { error: (error as Error).message });
            }
        }
        this.database = undefined;
        this.searchStatement = undefined;
    }

    /**
     * Lazily loads the sentence transformer pipeline, caching the embedder for repeated use.
     */
    private async resolveEmbedder(): Promise<Embedder> {
        if (!this.embedder) {
            this.embedder = await loadEmbedder();
        }
        return this.embedder;
    }

    /**
     * Lazily opens the sqlite database and loads the sqlite-vec extension.
     */
    private getDatabase(): BetterSqlite3Database {
        if (!this.database) {
            const database = this.databaseFactory(this.databasePath);
            loadVecExtension(database);
            this.database = database;
        }
        return this.database;
    }

    /**
     * Prepares (and memoizes) the parameterized sqlite-vec search statement.
     */
    private getSearchStatement(database: BetterSqlite3Database): Statement<[string, number]> {
        if (!this.searchStatement) {
            this.searchStatement = database.prepare<
                [string, number],
                VectorRow
            >(
                "SELECT id, metadata, distance FROM bitbucket_api_embeddings WHERE embedding MATCH vec_f32(?) ORDER BY distance LIMIT ?"
            );
        }
        return this.searchStatement;
    }
}
