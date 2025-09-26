import { OperationMetadata, OperationRegistry } from "../lib/operations";

export class DiscoveryService {
    constructor(private readonly registry: OperationRegistry) { }

    getOperation(id: string): OperationMetadata {
        const operation = this.registry.get(id);
        if (!operation) {
            throw new Error(`Operation ${id} not found`);
        }

        return {
            id: operation.id,
            summary: operation.summary,
            description: operation.description,
            input: operation.input,
            output: operation.output,
            tags: operation.tags ?? []
        };
    }
}
