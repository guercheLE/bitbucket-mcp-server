import { SearchIdsResponse } from "../../src/contracts/search-ids";
import { createSearchIdsTool } from "../../src/tools/search-ids";

describe("search-ids tool contract", () => {
    const buildVectorDb = (results: Array<{ id: string; description: string; score: number }>) => ({
        search: jest.fn().mockResolvedValue(results)
    });

    it("returns vector matches that satisfy the SearchIdsResponse schema", async () => {
        const matches = [
            { id: "GET /projects", description: "List projects", score: 0.92 },
            { id: "GET /repos", description: "List repositories", score: 0.89 }
        ];
        const vectorDb = buildVectorDb(matches);

        const tool = createSearchIdsTool({ vectorDb });
        const result = await tool.handler({ query: "list projects" });

        expect(SearchIdsResponse.parse(result)).toEqual(matches);
        expect(vectorDb.search).toHaveBeenCalledWith("list projects", { limit: 10 });
    });

    it("returns an empty array when the vector database has no matches", async () => {
        const vectorDb = buildVectorDb([]);

        const tool = createSearchIdsTool({ vectorDb });
        const result = await tool.handler({ query: "no results" });

        expect(result).toEqual([]);
        expect(vectorDb.search).toHaveBeenCalledWith("no results", { limit: 10 });
    });
});
