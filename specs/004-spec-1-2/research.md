# Research: Vector DB & Embedding Pipeline

## Decisions

### 1. Vector Database Library
- **Decision**: Use `sqlite-vec`.
- **Rationale**: The feature specification explicitly requires `sqlite-vec`. It's a lightweight, serverless vector database that can be embedded directly into the application, fulfilling the portability requirement. It has a simple API and is well-suited for Node.js environments.
- **Alternatives considered**: 
    - `ChromaDB`: More complex to set up and might require a separate server instance, violating the "no external dependencies" constraint.
    - `LanceDB`: Another strong contender for embedded vector search, but `sqlite-vec` is simpler for this use case.

### 2. Embedding Model
- **Decision**: Use a pre-trained model from the `sentence-transformers` library.
- **Rationale**: The clarification session confirmed this choice. `sentence-transformers` provides a wide range of high-quality, open-source models that can run locally. This avoids reliance on external APIs and associated costs or rate limits. The `all-MiniLM-L6-v2` model is a good starting point due to its balance of performance and size.
- **Alternatives considered**:
    - `OpenAI API`: Rejected to avoid external dependencies and to ensure the embedding process can run offline.

### 3. API Documentation Source
- **Decision**: Assume a structured JSON file containing all Bitbucket API operations will be available as input to the embedding script.
- **Rationale**: The clarification session specified that the source for embeddings will be a structured JSON object for each endpoint. This research assumes that another process will be responsible for generating this consolidated JSON file from the raw Bitbucket OpenAPI specifications. The embedding script will consume this file, not parse the raw documentation itself.
- **Alternatives considered**:
    - Parsing raw OpenAPI specs directly in the script: This would tightly couple the embedding script to the format of the Bitbucket documentation, making it more brittle. Decoupling this concern is a better design.

## Open Questions
- **Question**: What is the exact schema of the input JSON file containing the API operations?
  - **Resolution**: This will be defined in the `data-model.md` artifact.
- **Question**: Where will the input JSON file be located?
  - **Resolution**: For now, we will assume it's located in a `data/` directory at the project root. This can be configured later.
