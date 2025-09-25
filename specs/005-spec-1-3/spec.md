# Feature Specification: The 3-Tool Implementation

**Feature Branch**: `005-spec-1-3`
**Created**: 2025-09-25
**Status**: Draft
**Input**: User description: "### Spec 1.3: The 3-Tool Implementation
*   **FRs:**
    *   Implement the `search-ids` tool to query the vector database.
    *   Implement the `get-id` tool to retrieve Zod schemas.
    *   Implement the `call-id` tool to dynamically validate parameters and execute a Bitbucket API call.
*   **NFRs:**
    *   **TDD:** Strictly follow the Red-Green-Refactor cycle for each tool, ensuring all pre-approved contract, unit, and integration tests pass.
    *   **Performance:** Validate that `search-ids` responds in <100ms and `call-id` validation overhead is <10ms.
    *   **Code Review:** All code must be peer-reviewed before merging."

---

## Clarifications

### Session 2025-09-25
- Q: When `search-ids` finds no matching operations for a query, how should it respond? → A: Return an empty array [].
- Q: When `get-id` is called with an ID that does not exist, what should be the response? → A: Throw a "Not Found" error.
- Q: For the `call-id` tool, how should it handle an API call that fails on the Bitbucket server side (e.g., due to a 4xx or 5xx error)? → A: Return a standardized JSON error response with status and message, log the original error, and correlate them.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer using the MCP server, I want to be able to find a Bitbucket API operation semantically, get its schema, and call it with validation, so that I can interact with the Bitbucket API easily and correctly.

### Acceptance Scenarios
1.  **Given** a natural language query for a Bitbucket operation, **When** I use the `search-ids` tool, **Then** I receive a list of relevant operation IDs.
2.  **Given** an operation ID, **When** I use the `get-id` tool, **Then** I receive the Zod schema for that operation's parameters.
3.  **Given** a non-existent operation ID, **When** I use the `get-id` tool, **Then** the system throws a "Not Found" error.
4.  **Given** an operation ID and valid parameters, **When** I use the `call-id` tool, **Then** the corresponding Bitbucket API is called and I receive the result.
5.  **Given** an operation ID and invalid parameters, **When** I use the `call-id` tool, **Then** I receive a validation error.
6.  **Given** a `call-id` execution that results in a Bitbucket API error, **When** the error occurs, **Then** I receive a standardized JSON error response with a correlation ID.

### Edge Cases
- What happens when `search-ids` finds no matching operations? The tool MUST return an empty array `[]`.
- What happens when `get-id` is called with an invalid or non-existent ID? The tool MUST throw a "Not Found" error.
- What happens when `call-id` is called for an operation that fails on the Bitbucket side (e.g., authentication error, resource not found)? The tool MUST return a standardized JSON error response and log the original error with a correlation ID.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST provide a `search-ids` tool that accepts a string query and returns a list of matching operation IDs from the vector database. If no matches are found, it MUST return an empty array.
- **FR-002**: The system MUST provide a `get-id` tool that accepts an operation ID and returns the corresponding Zod schema for its parameters.
- **FR-003**: If the `get-id` tool is called with an ID that does not exist, it MUST throw a "Not Found" error.
- **FR-004**: The system MUST provide a `call-id` tool that accepts an operation ID and a set of parameters.
- **FR-005**: The `call-id` tool MUST validate the provided parameters against the operation's Zod schema before execution.
- **FR-006**: If validation passes, the `call-id` tool MUST execute the corresponding Bitbucket API call.
- **FR-007**: If validation fails, the `call-id` tool MUST return a descriptive error.
- **FR-008**: If the underlying Bitbucket API call fails, the `call-id` tool MUST return a standardized JSON error response containing a status, a message, and a correlation ID.

### Non-Functional Requirements
- **NFR-001**: The `search-ids` tool MUST respond in under 100ms.
- **NFR-002**: The parameter validation overhead for the `call-id` tool MUST be less than 10ms.
- **NFR-003**: All implementation MUST follow a strict Test-Driven Development (TDD) approach.
- **NFR-004**: All code MUST be peer-reviewed before merging.
- **NFR-005**: When a Bitbucket API call fails, the system MUST log the original, detailed error from the API client, and the log entry MUST include the correlation ID that is returned to the user.

### Key Entities *(include if feature involves data)*
- **Operation ID**: A unique identifier for a specific Bitbucket API endpoint and method (e.g., `GET /rest/api/1.0/projects`).
- **Zod Schema**: A schema object that defines the expected structure and types of parameters for an Operation.
- **Vector Database**: A data store containing embeddings of API documentation used for semantic search.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
