# Implementation Plan: The 3-Tool Implementation

**Branch**: `005-spec-1-3` | **Date**: 2025-09-25 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/Users/lucianoguerche/Documents/GitHub/bitbucket-mcp-server/specs/005-spec-1-3/spec.md`

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

This plan outlines the implementation of the core 3-tool semantic discovery pattern (`search-ids`, `get-id`, `call-id`). The approach uses a local vector database (`sqlite-vec`) for semantic search, Zod for schema validation, and Axios for Bitbucket API interaction, adhering to the project's constitution.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `axios`, `winston`, `commander.js`, `jest`, `zod`, `sqlite-vec`, `sentence-transformers`
**Storage**: `sqlite-vec` file-based database
**Testing**: `jest`
**Target Platform**: Node.js environment
**Project Type**: single
**Performance Goals**: `search-ids` < 100ms; `call-id` validation < 10ms
**Constraints**: Must follow TDD; All code peer-reviewed.
**Scale/Scope**: Initial implementation for 5-10 representative Bitbucket API endpoints.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **MCP Protocol First**: Pass. The implementation will use the official MCP SDK and expose functionality via MCP tools.
- **Multi-Transport Protocol**: Pass. This feature is transport-agnostic.
- **Selective Tool Registration**: Pass. The three tools are the public interface.
- **Complete API Coverage**: N/A. This spec is for the core pattern, not full coverage.
- **Test-First**: Pass. TDD is a core NFR for this feature.

## Project Structure

### Documentation (this feature)

```
specs/005-spec-1-3/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── search-ids.ts
│   ├── get-id.ts
│   └── call-id.ts
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

**Structure Decision**: Option 1: Single project.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**: All key technologies were identified and researched.
2. **Generate and dispatch research agents**: Research focused on selecting the right vector DB and embedding models.
3. **Consolidate findings**: `research.md` created with decisions and rationale.

**Output**: `research.md`

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec**: `data-model.md` created.
2. **Generate API contracts**: Zod schemas for each of the three tools created in `/contracts`.
3. **Generate contract tests**: To be done in the implementation phase.
4. **Extract test scenarios**: `quickstart.md` created to demonstrate the user flow.
5. **Update agent file incrementally**: `copilot-instructions.md` updated with new dependencies.

**Outputs**: `data-model.md`, `contracts/`, `quickstart.md`, updated `.github/copilot-instructions.md`

## Phase 2: Task Planning

The next step is to generate the detailed implementation tasks. The `/tasks` command will break down the implementation of each tool (`search-ids`, `get-id`, `call-id`) into smaller, testable units, following the TDD process. This will include:

- Setting up the `sqlite-vec` database.
- Creating the embedding generation script.
- Implementing the `search-ids` tool and its tests.
- Implementing the `get-id` tool and its tests.
- Implementing the `call-id` tool with parameter validation and its tests.
- Writing integration tests for the end-to-end flow.
  - Preserve manual additions between markers
  - Update recent changes (keep last 3)
  - Keep under 150 lines for token efficiency
  - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
