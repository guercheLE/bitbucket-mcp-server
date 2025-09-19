
# Implementation Plan: Gestão de Issues (Bitbucket Cloud)

**Branch**: `001-feature-gestao-issues` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-feature-gestao-issues/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CURSOR.md` for Cursor Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, or `QWEN.md` for Qwen Code).
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
Sistema completo de gestão de issues no Bitbucket Cloud através do MCP server, incluindo criação, atualização, busca, comentários e transições de status. Implementação seguindo rigorosamente o protocolo MCP com suporte a múltiplos transportes e registro seletivo de ferramentas baseado no tipo de servidor.

## Technical Context
**Language/Version**: TypeScript 5.0+ (Constitution-compliant)  
**Runtime**: Node.js 18+ (Constitution-compliant)  
**Primary Dependencies**: @modelcontextprotocol/sdk, Zod, Axios, Winston, Commander.js (Constitution-compliant)  
**Storage**: N/A (MCP server, no persistent storage)  
**Testing**: Jest with >80% coverage (Constitution Article V)  
**Target Platform**: Cross-platform (Node.js runtime)  
**Project Type**: MCP Server (Constitution Article I)  
**Performance Goals**: Response time <2s for 95% of requests, Uptime >99.9% (Constitution-compliant)  
**Constraints**: MCP protocol compliance, Multi-transport support, Selective tool loading (Constitution Articles I-III)  
**Scale/Scope**: 170+ Bitbucket endpoints, Data Center 7.16+ and Cloud support (Constitution Article IV)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Article I: MCP Protocol First
- [x] All functionality exposed through standardized MCP tools (Issues API como MCP tools)
- [x] Official MCP SDK used as single source of truth (@modelcontextprotocol/sdk)
- [x] Total compatibility with MCP clients ensured (protocolo MCP rigorosamente seguido)
- [x] Library-first approach emphasized in all implementations (ferramentas MCP como biblioteca)

### Article II: Multi-Transport Protocol
- [x] Support for stdio, HTTP, SSE, HTTP streaming transports (múltiplos transportes simultâneos)
- [x] Independent and testable transport implementations (implementações independentes)
- [x] Automatic fallback between transports when necessary (fallback automático)
- [x] CLI interface with text I/O protocol support (interface CLI com protocolo text I/O)

### Article III: Selective Tool Registration
- [x] Tools registered based on server type (datacenter/cloud) and version (Cloud-specific para Issues)
- [x] Automatic server type and version detection (detecção automática de tipo/versão)
- [x] Graceful degradation for unavailable features (degradação graciosa)
- [x] Console client commands registered selectively based on server capabilities (comandos seletivos)

### Article IV: Complete API Coverage
- [x] All Bitbucket Data Center (7.16+) and Cloud APIs implemented as MCP tools (25 endpoints Issues Cloud)
- [x] Official Atlassian documentation as single source of truth (documentação oficial como fonte)
- [x] Commands for all Bitbucket API endpoints (todos os endpoints Issues como comandos)
- [x] Integration testing with real dependencies mandatory (testes de integração obrigatórios)

### Article V: Test-First (NON-NEGOTIABLE)
- [x] TDD mandatory: Tests written → Project Lead approved → Tests fail → Then implement (TDD obrigatório)
- [x] Red-Green-Refactor cycle strictly enforced (ciclo Red-Green-Refactor)
- [x] Test coverage >80% mandatory (line coverage) (cobertura >80% obrigatória)
- [x] Contract, integration, and unit tests for each tool (testes para cada ferramenta)
- [x] Test approval gates before implementation (gates de aprovação de testes)

### Article VI: Versioning
- [x] Semantic versioning (MAJOR.MINOR.PATCH) for all releases (versionamento semântico)
- [x] Breaking changes documented with migration procedures (mudanças breaking documentadas)
- [x] Version increment reminders for all changes (lembretes de incremento de versão)
- [x] Automatic migration when possible (migração automática quando possível)

### Article VII: Simplicity
- [x] Project count limits enforced (max 3 projects per feature) (limite de 3 projetos por feature)
- [x] Pattern prohibition examples documented (exemplos de padrões proibidos)
- [x] YAGNI (You Aren't Gonna Need It) principles applied (princípios YAGNI aplicados)
- [x] Complexity deviations justified in Complexity Tracking (desvios de complexidade justificados)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Bitbucket MCP Server Structure (Constitution-compliant)
src/
├── server/          # Main MCP server
│   ├── index.ts     # Main server entry point
│   └── mcp/         # MCP protocol handlers
├── client/          # Console client
│   ├── cli/         # CLI interface
│   └── commands/    # Command implementations
├── tools/           # MCP tools organized by server type
│   ├── cloud/       # Cloud-specific tools
│   ├── datacenter/  # Data Center-specific tools
│   └── shared/      # Shared tools
├── services/        # Business services
├── types/           # TypeScript type definitions
└── utils/           # Utilities

tests/
├── contract/        # Contract tests
├── integration/     # Integration tests
└── unit/           # Unit tests
```

**Structure Decision**: Bitbucket MCP Server structure (Constitution Article I-V compliant)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

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

**Specific Tasks for Issues Management**:
1. **Contract Tests** [P]: 25 contract tests para cada endpoint da Issues API
2. **Data Model Tests** [P]: Testes unitários para entidades Issue, Comment, Relationship, Attachment
3. **Integration Tests**: Testes de integração para todos os cenários do quickstart
4. **MCP Tools Implementation**: 25 ferramentas MCP para gestão de issues
5. **Authentication Integration**: OAuth 2.0 e Personal Access Tokens
6. **Error Handling**: Retry, circuit breaker, rate limiting
7. **Performance Tests**: Validação de SLA (<2s listagem, <3s busca)
8. **Documentation**: Atualização de README e documentação da API

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
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

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
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*  
*Template updated: 2025-01-27 - Constitution v1.0.0 ratified*
