import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { load as loadVecExtension } from "sqlite-vec";

import { generateEmbeddings } from "../../src/scripts/generate-embeddings";
import type { Logger } from "../../src/utils/logger";

const EMBEDDING_DIMENSION = 6;

const createEmbedding = (text: string): number[] => {
    const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
    for (let index = 0; index < text.length; index += 1) {
        vector[index % EMBEDDING_DIMENSION] += text.charCodeAt(index);
    }
    const normalizer = text.length === 0 ? 1 : text.length;
    return vector.map((value) => value / normalizer);
};

describe("generateEmbeddings", () => {
    let workDir: string;
    let sourcePath: string;
    let databasePath: string;

    beforeEach(() => {
        workDir = mkdtempSync(join(tmpdir(), "bitbucket-embeddings-"));
        sourcePath = join(workDir, "bitbucket-api.json");
        databasePath = join(workDir, "bitbucket-embeddings.db");
    });

    afterEach(() => {
        rmSync(workDir, { recursive: true, force: true });
    });

    const embedder = async (text: string): Promise<number[]> => createEmbedding(text);

    const writeSampleData = (records: unknown[]): void => {
        writeFileSync(sourcePath, JSON.stringify(records, null, 2), "utf-8");
    };

    const createLogger = () => {
        const entries: Array<{ level: "info" | "error" | "warn"; message: string }> = [];
        const logger: Pick<Logger, "info" | "error" | "warn"> & {
            entries: Array<{ level: "info" | "error" | "warn"; message: string }>;
        } = {
            info: (...args: unknown[]) => {
                const message = typeof args[0] === "string" ? args[0] : JSON.stringify(args[0]);
                entries.push({ level: "info", message });
                return logger as unknown as Logger;
            },
            warn: (...args: unknown[]) => {
                const message = typeof args[0] === "string" ? args[0] : JSON.stringify(args[0]);
                entries.push({ level: "warn", message });
                return logger as unknown as Logger;
            },
            error: (...args: unknown[]) => {
                const message = typeof args[0] === "string" ? args[0] : JSON.stringify(args[0]);
                entries.push({ level: "error", message });
                return logger as unknown as Logger;
            },
            entries
        };
        return logger;
    };

    it("creates a sqlite-vec database and stores embeddings", async () => {
        const records = [
            {
                id: "get-repository",
                operationName: "Get Repository",
                endpoint: "/2.0/repositories/{workspace}/{repo_slug}",
                type: "GET",
                tags: ["repositories"],
                description: "Fetches repository metadata",
                samples: "axios.get('/2.0/repositories/my-workspace/my-repo')"
            },
            {
                id: "list-pipelines",
                operationName: "List Pipelines",
                endpoint: "/2.0/repositories/{workspace}/{repo_slug}/pipelines/",
                type: "GET",
                tags: ["pipelines"],
                description: "Lists pipelines for a repository"
            }
        ];

        writeSampleData(records);
        const logger = createLogger();

        const summary = await generateEmbeddings({
            sourcePath,
            databasePath,
            embedder,
            embeddingDimensions: EMBEDDING_DIMENSION,
            logger
        });

        expect(summary).toMatchObject({ total: 2, successes: 2, failures: 0, databasePath });
        expect(existsSync(databasePath)).toBe(true);

        const database = new Database(databasePath);
        loadVecExtension(database);

        const targetVector = createEmbedding(JSON.stringify(records[0]));
        const bestMatch = database
            .prepare<[string], { id: string; metadata: string }>(
                "SELECT id, metadata FROM bitbucket_api_embeddings WHERE embedding MATCH vec_f32(?) ORDER BY distance LIMIT 1"
            )
            .get(JSON.stringify(targetVector));

        expect(bestMatch).toBeDefined();
        expect(bestMatch?.id).toBe("get-repository");
        expect(bestMatch && JSON.parse(bestMatch.metadata)).toEqual(records[0]);

        database.close();
    });

    it("logs validation errors but continues processing other records", async () => {
        const validRecord = {
            id: "get-workspaces",
            operationName: "Get Workspaces",
            endpoint: "/2.0/workspaces",
            type: "GET",
            tags: ["workspaces"],
            description: "Returns available workspaces"
        };

        const invalidRecord = {
            ...validRecord,
            id: undefined
        };

        writeSampleData([validRecord, invalidRecord]);
        const logger = createLogger();

        const summary = await generateEmbeddings({
            sourcePath,
            databasePath,
            embedder,
            embeddingDimensions: EMBEDDING_DIMENSION,
            logger
        });

        expect(summary).toMatchObject({ total: 2, successes: 1, failures: 1 });
        expect(logger.entries.find((entry) => entry.level === "error")).toBeDefined();
        expect(existsSync(databasePath)).toBe(true);

        const database = new Database(databasePath);
        loadVecExtension(database);
        const rows = database.prepare<[], { id: string }>("SELECT id FROM bitbucket_api_embeddings").all();
        expect(rows).toHaveLength(1);
        expect(rows[0]?.id).toBe(validRecord.id);
        database.close();
    });
});
