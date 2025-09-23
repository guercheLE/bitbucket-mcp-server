# Tasks: 001-mcp-server-infrastructure

**Input**: Design documents from `/specs/001-mcp-server-infrastructure/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Dependencies**: None (foundation feature)
**Parallel Status**: Foundation tasks - some [P] available

## Execution Flow (main)
```
1. Handle branch dependencies and rebasing
   → No dependencies for foundation feature
2. Load plan.md from feature directory
   → Tech stack: TypeScript, Node.js 18+, @modelcontextprotocol/sdk, Zod, Jest
   → Structure: Single project with src/server/, src/types/, src/utils/
3. Load optional design documents:
   → data-model.md: MCPServer, ClientSession, Tool, Transport, ProtocolMessage
   → contracts/: MCP protocol contracts for initialize, tools/list, tools/call
   → research.md: Official MCP SDK, multi-transport support, event-driven architecture
4. Generate tasks by category:
   → Setup: Node.js project, TypeScript, dependencies, linting
   → Tests: MCP protocol contract tests, integration scenarios
   → Core: Server, session management, tool registration, transports
   → Integration: Protocol compliance, error handling, logging
   → Polish: Performance validation, memory checks, quickstart verification
5. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
6. Number tasks sequentially (T001, T002...)
7. Generate dependency graph
8. Create tasks.md with infrastructure foundation tasks
```

## Phase 0: Branch Management and Dependencies

### Dependency Verification
- [x] T000 **Check current branch**: Verify on `feature/001-mcp-server-infrastructure` branch
- [x] T001 **No dependencies**: Foundation feature has no dependent branches
- [x] T002 **Clean state**: Working directory is clean

**✅ No rebasing required - this is the foundation feature**

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **Dependencies**: None - foundation feature
- Include exact file paths in descriptions

## Phase 1: Project Setup

- [x] T010 **Initialize Node.js project**: Create `package.json` with TypeScript, Node.js 18+ config at repository root
- [x] T011 **[P] Install MCP dependencies**: Add @modelcontextprotocol/sdk, zod to package.json dependencies 
- [x] T012 **[P] Install dev dependencies**: Add @types/node, typescript, ts-node, jest, @types/jest to devDependencies
- [x] T013 **[P] Configure TypeScript**: Create `tsconfig.json` with strict mode and constitutional requirements
- [x] T014 **[P] Configure Jest**: Create `jest.config.js` for TypeScript testing with >80% coverage requirement
- [x] T015 **Create project structure**: Initialize `src/server/`, `src/types/`, `src/utils/`, `tests/contract/`, `tests/integration/`, `tests/unit/` directories

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T020 **[P] MCP initialize contract test**: Create `tests/contract/mcp-initialize.test.ts` testing MCP protocol initialization handshake
- [x] T021 **[P] MCP tools/list contract test**: Create `tests/contract/mcp-tools-list.test.ts` testing tool discovery protocol  
- [x] T022 **[P] MCP tools/call contract test**: Create `tests/contract/mcp-tools-call.test.ts` testing tool execution protocol
- [x] T023 **[P] Server lifecycle integration test**: Create `tests/integration/server-lifecycle.test.ts` testing startup/shutdown
- [x] T024 **[P] Multi-client integration test**: Create `tests/integration/multi-client.test.ts` testing concurrent client connections
- [x] T025 **[P] Transport layer integration test**: Create `tests/integration/transport-layer.test.ts` testing stdio/HTTP/SSE transports

## Phase 3: Core Implementation (ONLY after tests are failing)

- [x] T030 **[P] Core type definitions**: Create `src/types/index.ts` with MCPServer, ClientSession, Tool, Transport, ProtocolMessage interfaces  
- [x] T031 **[P] MCP server class**: Create `src/server/mcp-server.ts` implementing MCPServer entity with protocol compliance
- [x] T032 **[P] Client session manager**: Create `src/server/client-session.ts` implementing ClientSession lifecycle management
- [x] T033 **[P] Tool registry**: Create `src/server/tool-registry.ts` implementing Tool registration and discovery system with snake_case naming validation (no bitbucket_, mcp_, bb_ prefixes)
- [ ] T034 **Transport factory**: Create `src/server/transport-factory.ts` implementing multi-transport support (stdio, HTTP, SSE)
- [ ] T035 **Protocol message handler**: Create `src/server/protocol-handler.ts` implementing MCP JSON-RPC 2.0 message processing
- [ ] T036 **Server entry point**: Create `src/server/index.ts` implementing server initialization and startup logic

## Phase 4: Integration & Protocol Compliance

- [ ] T040 **MCP protocol compliance**: Integrate official @modelcontextprotocol/sdk with server implementation
- [ ] T041 **Error handling**: Implement MCP-compliant error responses and JSON-RPC 2.0 error codes
- [ ] T042 **Logging system**: Integrate Winston logging with winston-daily-rotate-file for 30-day retention, constitutional sanitization requirements, and optional Loki+Grafana remote aggregation support
- [ ] T043 **Connection management**: Implement graceful client connection/disconnection handling
- [ ] T044 **Tool registration API**: Connect tool registry with MCP protocol tool discovery methods

## Phase 5: Polish & Validation

- [ ] T050 **[P] Server unit tests**: Create `tests/unit/mcp-server.test.ts` testing server class methods
- [ ] T051 **[P] Tool registry unit tests**: Create `tests/unit/tool-registry.test.ts` testing tool registration logic and snake_case naming convention validation  
- [ ] T052 **Performance validation**: Verify <2s response times and <1GB memory usage per constitutional requirements
- [ ] T053 **Quickstart verification**: Execute `quickstart.md` scenarios to validate infrastructure functionality
- [ ] T054 **Protocol compliance audit**: Run MCP protocol validation against official test suite if available

## Dependencies Summary
**This feature depends on**: None (foundation feature)
**Features that depend on this**: 002-authentication-system, 003-repository-management, 004-basic-testing-framework

### Implementation Notes
- All MCP protocol methods must follow JSON-RPC 2.0 specification exactly
- Tool registration must support selective loading for future Bitbucket server type detection
- Transport layer must be extensible for additional transports in future features  
- Server must maintain constitutional <1GB memory limit through efficient session management
- Error handling must provide detailed debugging information while maintaining security
- Foundation must support future integration of 200+ Bitbucket API endpoints as tools

### Branch Merge Order
1. Complete this foundation feature implementation (Phases 1-5)
2. Merge to main branch 
3. Foundation becomes available for dependent features:
   - 002-authentication-system (requires MCP server infrastructure)
   - 004-basic-testing-framework (runs in parallel, requires server for testing)
   - All subsequent features build upon this foundation