import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";

import { createCallIdTool } from "../../src/tools/call-id";

const OPERATION_ID = "GET /rest/api/1.0/projects";

const successOperation = {
    id: OPERATION_ID,
    method: "GET" as const,
    path: "/rest/api/1.0/projects",
    description: "List projects",
    schema: z.object({})
};

describe("call-id tool contract", () => {
    const buildSchemaService = (operation = successOperation) => ({
        getOperation: jest.fn().mockResolvedValue(operation)
    });

    const buildHttpClient = <T = unknown>(response: AxiosResponse<T> | Promise<AxiosResponse<T>>) =>
        jest.fn().mockImplementation((config: AxiosRequestConfig) => Promise.resolve(response)) as jest.MockedFunction<
            (config: AxiosRequestConfig) => Promise<AxiosResponse<T>>
        >;

    it("validates parameters and returns the Bitbucket API response", async () => {
        const schemaService = buildSchemaService();
        const httpClient = jest.fn().mockResolvedValue({ data: { values: [] } }) as jest.MockedFunction<
            (config: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>
        >;

        const tool = createCallIdTool({
            schemaService,
            httpClient,
            baseUrl: "https://bitbucket.example.com"
        });

        const result = await tool.handler({ id: OPERATION_ID, parameters: {} });

        expect(result).toEqual({ values: [] });
        expect(schemaService.getOperation).toHaveBeenCalledWith(OPERATION_ID);
        expect(httpClient).toHaveBeenCalledWith({
            baseURL: "https://bitbucket.example.com",
            method: "GET",
            url: "/rest/api/1.0/projects",
            data: undefined,
            params: {}
        });
    });

    it("rejects when parameters fail schema validation", async () => {
        const operation = {
            ...successOperation,
            schema: z.object({ projectKey: z.string() })
        };
        const schemaService = buildSchemaService(operation);
        const httpClient = jest.fn();

        const tool = createCallIdTool({
            schemaService,
            httpClient,
            baseUrl: "https://bitbucket.example.com"
        });

        await expect(tool.handler({ id: OPERATION_ID, parameters: {} })).rejects.toThrow(/projectKey/);
        expect(httpClient).not.toHaveBeenCalled();
    });

    it("returns a standardized error payload when the Bitbucket API call fails", async () => {
        const schemaService = buildSchemaService();
        const error = Object.assign(new Error("Not Found"), {
            response: {
                status: 404,
                data: { errors: [{ message: "Project not found" }] }
            }
        });
        const httpClient = jest.fn().mockRejectedValue(error);
        const logger = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn()
        };

        const tool = createCallIdTool({
            schemaService,
            httpClient,
            baseUrl: "https://bitbucket.example.com",
            logger
        });

        const result = await tool.handler({ id: OPERATION_ID, parameters: {} });

        expect(result).toMatchObject({
            status: 404,
            message: expect.stringContaining("Project not found"),
            correlationId: expect.any(String)
        });
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("Bitbucket API request failed"),
            expect.objectContaining({ correlationId: expect.any(String), error: expect.any(String) })
        );
    });
});
