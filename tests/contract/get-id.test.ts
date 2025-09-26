import { z } from "zod";

import { createGetIdTool } from "../../src/tools/get-id";

const KNOWN_OPERATION = "GET /rest/api/1.0/projects";

describe("get-id tool contract", () => {
    it("returns the Zod schema for a known operation ID", async () => {
        const schema = z.object({});
        const schemaService = {
            getSchema: jest.fn().mockResolvedValue(schema)
        };

        const tool = createGetIdTool({ schemaService });
        const result = await tool.handler({ id: KNOWN_OPERATION });

        expect(result).toBe(schema);
        expect(schemaService.getSchema).toHaveBeenCalledWith(KNOWN_OPERATION);
    });

    it("throws a Not Found error when the schema service does not have the operation", async () => {
        const schemaService = {
            getSchema: jest.fn().mockRejectedValue(new Error("Not Found"))
        };

        const tool = createGetIdTool({ schemaService });

        await expect(tool.handler({ id: "unknown" })).rejects.toThrow("Not Found");
        expect(schemaService.getSchema).toHaveBeenCalledWith("unknown");
    });
});
