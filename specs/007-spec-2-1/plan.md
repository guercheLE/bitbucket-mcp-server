# Implementation Plan: Complete API Operation Implementation

**Branch**: `007-spec-2-1` | **Date**: 2025-09-25 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/Users/lucianoguerche/Documents/GitHub/bitbucket-mcp-server/specs/007-spec-2-1/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This plan outlines the implementation of full Bitbucket API coverage, enabling the server to support all 200+ endpoints through the existing 3-tool semantic discovery pattern (`search-ids`, `get-id`, `call-id`). The approach involves systematically writing a contract test for each endpoint, implementing the internal operation to make the test pass, and finally generating embeddings for all new operations. This adheres strictly to the Test-Driven Development (TDD) process and architectural principles mandated by the project constitution.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `axios`, `zod`, `jest`, `winston`, `sqlite-vec`, `sentence-transformers`
**Storage**: `sqlite-vec` file-based database
**Testing**: `jest`
**Target Platform**: Node.js 18+
**Project Type**: single
**Performance Goals**: `<100ms` for `search-ids`, `<10ms` validation overhead for `call-id`.
**Constraints**: Must follow the 3-tool semantic discovery pattern.
**Scale/Scope**: 200+ Bitbucket API endpoints.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **MCP Protocol First**: PASS. The implementation uses the official SDK and exposes functionality via the 3-tool pattern.
- **Multi-Transport Protocol**: PASS. No changes to transport layers.
- **Selective Tool Registration**: PASS. No new public tools are being registered.
- **Complete API Coverage**: PASS. This feature directly addresses this principle.
- **Test-First (NON-NEGOTIABLE)**: PASS. The plan strictly follows the "test-first" workflow for every endpoint.
- **Vector DB Requirements**: PASS. The plan uses the existing `sqlite-vec` implementation.
- **Pagination Requirements**: PASS. The plan explicitly includes implementing pagination for all list-based operations.

## Project Structure

### Documentation (this feature)

```
specs/007-spec-2-1/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Option 1: Single project. The feature expands existing functionality within the established project structure.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**: All technical context items are resolved and aligned with the project constitution and existing specs. No new research is required.
2. **Generate and dispatch research agents**: Not applicable.
3. **Consolidate findings** in `research.md`: The `research.md` file has been created to document the confirmation of existing technical decisions.

**Output**: `research.md`

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`: The key entities (`API Operation`, `Contract Test`, `Embedding`) have been defined in `data-model.md`.
2. **Generate API contracts**: No new public-facing API contracts will be created. The feature uses the existing `call-id` tool. The "contracts" for the internal operations are the Zod schemas defined within the operation implementation files themselves. The `contracts/` directory will remain empty for this feature.
3. **Generate contract tests**: The core of this feature is generating contract tests for each of the 200+ Bitbucket APIs. These will be added incrementally in the `tests/contract/` directory.
4. **Extract test scenarios** from user stories → `quickstart.md`: A `quickstart.md` has been created to demonstrate the end-to-end flow of discovering and executing an operation.
5. **Update agent file incrementally**: The `.github/copilot-instructions.md` file has been updated with the technical context of this feature.

**Output**: `data-model.md`, `quickstart.md`, updated `.github/copilot-instructions.md`.

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- The `/tasks` command will generate a comprehensive list of tasks based on the requirement to implement 200+ API endpoints.
- For each endpoint, the following tasks will be created:
  1.  `Create contract test for [Endpoint Name] API`.
  2.  `Implement internal operation for [Endpoint Name] API`.
- A final task will be created for the embedding generation: `Generate and package embeddings for all implemented endpoints`.

**Ordering Strategy**:

- Tasks will be grouped by API resource (e.g., Repositories, Pull Requests) for logical organization.
- Within each group, the TDD order will be respected: contract test task first, then implementation task.
- The embedding generation task will be the final task.

**Estimated Output**: A `tasks.md` file with approximately 400+ tasks.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
