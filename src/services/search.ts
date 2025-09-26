import { OperationRegistry, registryToSearchable } from "../lib/operations";

export interface SearchResult {
    id: string;
    summary: string;
    description: string;
    score: number;
    tags: string[];
}

const tokenize = (value: string): string[] =>
    value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

const computeScore = (queryTokens: string[], haystack: string): number => {
    if (queryTokens.length === 0) {
        return 0;
    }

    const normalized = haystack.toLowerCase();
    return queryTokens.reduce((score, token) => (normalized.includes(token) ? score + 1 : score), 0);
};

export class SearchService {
    constructor(private readonly registry: OperationRegistry) { }

    async search(query: string): Promise<SearchResult[]> {
        const operations = registryToSearchable(this.registry.list());
        const tokens = tokenize(query);

        const results = operations
            .map((operation) => ({
                ...operation,
                score: computeScore(tokens, `${operation.summary} ${operation.description} ${operation.tags.join(" ")}`)
            }))
            .filter((operation) => operation.score > 0 || tokens.length === 0)
            .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

        return results;
    }
}
