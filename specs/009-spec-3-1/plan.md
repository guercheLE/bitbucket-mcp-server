
# Implementation Plan: Maintenance & Updates

**Branch**: `009-spec-3-1` | **Date**: 2025-09-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/Users/lucianoguerche/Documents/GitHub/bitbucket-mcp-server/specs/009-spec-3-1/spec.md`

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
This feature implements a robust maintenance and update process for the Bitbucket MCP Server. The technical approach involves creating automated scripts and CI/CD jobs to handle dependency updates, re-generation of vector embeddings from the latest Bitbucket API documentation, and continuous security monitoring. The goal is to ensure the server remains secure, reliable, and up-to-date with minimal manual intervention.

## Technical Context
**Language/Version**: Node.js 18+, TypeScript
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `axios`, `winston`, `jest`, `zod`, `npm-check-updates`, `winston`
**Storage**: `sqlite-vec` for vector embeddings
**Testing**: `jest` for unit and integration tests of maintenance scripts
**Target Platform**: Node.js environment (CI/CD pipeline and local maintenance)
**Project Type**: single
**Performance Goals**: Uptime >99.9%, vulnerability scan completion within CI/CD time limits.
**Constraints**: Dependency updates must exclude major versions. Embedding regeneration must halt on backward-incompatible API changes.
**Scale/Scope**: Processes must handle all existing third-party dependencies and support re-embedding for 200+ API endpoints.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **MCP Protocol First**: PASS. This feature focuses on maintenance, not new MCP tools.
- **Multi-Transport Protocol**: PASS. No changes to transport layers.
- **Selective Tool Registration**: PASS. No changes to tool registration.
- **Complete API Coverage**: PASS. This feature ensures API coverage remains current.
- **Test-First**: PASS. The plan includes creating tests for the new maintenance scripts.

## Project Structure

### Documentation (this feature)
```
specs/009-spec-3-1/
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

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1: Single project

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**: None. All items are defined.
2. **Generate and dispatch research agents**:
   - Task: "Research best practices for automating dependency updates in a Node.js project using `npm-check-updates` and `npm audit`."
   - Task: "Find best practices for creating a resilient embedding generation pipeline that can detect and handle upstream API changes."
   - Task: "Investigate tools and patterns for exposing and monitoring application health and uptime metrics in a Node.js application for consumption by Prometheus/Grafana."
3. **Consolidate findings** in `research.md`.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - No new persistent data models. The feature focuses on processes. The data model will document the transient data structures, such as the output of `npm audit` or the structure of API documentation to be parsed.
2. **Generate API contracts** from functional requirements:
   - These are not web APIs, but "contracts" for the maintenance scripts.
   - Create shell script definitions in `/contracts/` for:
     - `update-dependencies.sh`: A script to check, update, and install non-major dependency updates.
     - `regenerate-embeddings.sh`: A script to fetch API docs, detect changes, and trigger the embedding pipeline.
     - `monitor-vulnerabilities.sh`: A script to run `npm audit` and fail the build on critical vulnerabilities.
3. **Generate contract tests** from contracts:
   - Create Jest tests for each script to verify its logic and side effects in a controlled environment.
4. **Extract test scenarios** from user stories:
   - The `quickstart.md` will serve as the integration test, documenting the steps to run each maintenance script and verify its outcome.
5. **Update agent file incrementally**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` to add new dependencies (`npm-check-updates`) and concepts to the Copilot instructions.

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, .github/copilot-instructions.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base.
- Generate tasks from the design artifacts:
  - For each script in `/contracts`, create a task to implement the script.
  - For each script, create a task to write unit/integration tests.
  - Create a task to configure the CI/CD pipeline (e.g., GitHub Actions) to run these scripts on schedule or on trigger.
  - Create a task to implement the health/metrics endpoint.

**Ordering Strategy**:
- TDD order: Tests for scripts before implementation.
- Dependency order: Implement scripts first, then configure CI/CD jobs.

**Estimated Output**: 10-15 numbered, ordered tasks in tasks.md.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [X] Phase 0: Research complete (/plan command)
- [X] Phase 1: Design complete (/plan command)
- [X] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [X] Initial Constitution Check: PASS
- [X] Post-Design Constitution Check: PASS
- [X] All NEEDS CLARIFICATION resolved
- [X] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
