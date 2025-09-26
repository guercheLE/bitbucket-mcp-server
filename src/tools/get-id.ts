import type { z } from "zod";

import { GetIdParams, type GetIdParamsInput, GetIdResponse } from "../contracts/get-id";
import { SchemaNotFoundError } from "../services/SchemaService";
import type { Logger } from "../utils/logger";
import { createLogger } from "../utils/logger";
import type { ToolRegistration } from "./types";

/**
 * Minimal subset of the schema service needed by the `get-id` tool.
 */
export interface SchemaClient {
    getSchema(id: string): Promise<z.ZodTypeAny>;
}
/**
 * Collaborators required to instantiate the `get-id` tool.
 */
export interface GetIdToolDependencies {
    schemaService: SchemaClient;
    logger?: Pick<Logger, "debug" | "info" | "warn" | "error">;
}

const TOOL_NAME = "get-id";
const TOOL_TITLE = "Retrieve Bitbucket Operation Schema";
const TOOL_DESCRIPTION = "Fetches the parameter schema for a Bitbucket API operation.";

/**
 * Creates the `get-id` MCP tool which resolves Zod schemas for Bitbucket operations.
 *
 * @param dependencies - Schema service wrapper and optional logger configuration.
 */
export const createGetIdTool = (
    dependencies: GetIdToolDependencies
): ToolRegistration<typeof GetIdParams, z.ZodTypeAny> => {
    const logger = dependencies.logger ?? createLogger({ level: "info", defaultMeta: { scope: "tool:get-id" } });
    const schemaService = dependencies.schemaService;

    const handler = async (params: GetIdParamsInput): Promise<z.ZodTypeAny> => {
        const parsed = GetIdParams.parse(params);
        try {
            const schema = await schemaService.getSchema(parsed.id);
            logger.debug?.("Schema resolved", { id: parsed.id });
            return schema;
        } catch (error) {
            if (error instanceof SchemaNotFoundError) {
                logger.warn?.("Schema not found", { id: parsed.id });
                throw new Error("Not Found");
            }
            throw error;
        }
    };

    return {
        name: TOOL_NAME,
        config: {
            title: TOOL_TITLE,
            description: TOOL_DESCRIPTION,
            inputSchema: GetIdParams
        },
        outputSchema: GetIdResponse,
        handler
    };
};
