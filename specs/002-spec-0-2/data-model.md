# Data Model: Core Component Design & Test Definition

## 1. Pull Request Entity

This is the primary entity for the MVP. The data model will be based on the response from the Bitbucket Cloud and Data Center APIs for pull requests.

### Key Attributes (common across Cloud and DC)
- `id`: number (unique identifier)
- `title`: string
- `description`: string
- `state`: string (e.g., 'OPEN', 'MERGED', 'DECLINED')
- `author`: User object
- `fromRef`: Branch object
- `toRef`: Branch object
- `createdDate`: number (timestamp)
- `updatedDate`: number (timestamp)
- `links`: object (for HATEOAS)

## 2. User Entity
- `name`: string
- `emailAddress`: string
- `displayName`: string

## 3. Branch Entity
- `id`: string
- `displayId`: string
- `latestCommit`: string
- `repository`: Repository object

## 4. Repository Entity
- `slug`: string
- `name`: string
- `project`: Project object

## 5. Project Entity
- `key`: string
- `name`: string

## Zod Schemas (Contracts)

Zod schemas will be defined in the `specs/002-spec-0-2/contracts/` directory to represent these entities and the inputs/outputs of the core tools. These schemas will serve as the contracts for the MCP tools.
