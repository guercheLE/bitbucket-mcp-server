# Implementation Plan: Node.js Bitbucket MCP Server with Integrated Console Client

**Branch**: `002-comprehensive-bitbucket-api` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Especificação de funcionalidade de `/specs/002-comprehensive-bitbucket-api/spec.md` (atualizada com estrutura CLI completa e 160+ endpoints)

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Desenvolver um servidor MCP (Model Context Protocol) do Bitbucket em Node.js com detecção automática do tipo de servidor (Cloud/Data Center), carregamento seletivo de ferramentas baseado na compatibilidade, e cliente console integrado que expõe todas as operações disponíveis via CLI. O sistema inclui suporte abrangente para 160+ endpoints das APIs do Bitbucket Cloud e Data Center, com operações CRUD completas, gerenciamento de autenticação, logging de chamadas HTTP brutas com sanitização de dados sensíveis, e suporte a 20 idiomas para descrições de comandos CLI.

## Technical Context
**Language/Version**: Node.js >= 18.0.0, TypeScript 5.x  
**Primary Dependencies**: @modelcontextprotocol/sdk, Zod, Axios, Commander.js, Jest  
**Storage**: N/A (API-based)  
**Testing**: Jest with coverage > 80%  
**Target Platform**: Node.js runtime (cross-platform)  
**Project Type**: single (MCP server with integrated CLI)  
**Performance Goals**: < 2s read operations, < 5s write operations  
**Constraints**: Bitbucket API rate limiting, token security, Node.js 18+, sensitive data sanitization  
**Scale/Scope**: 1 MCP server, ~160+ tools (cobrindo todos os endpoints), ~50+ comandos CLI com estrutura aninhada, suporte completo para Cloud e Data Center, 20 idiomas para CLI, logging HTTP com sanitização

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (mcp-server, cli-client, tests)
- Using framework directly? Yes (MCP SDK, Commander.js, Axios)
- Single data model? Yes (Bitbucket API types)
- Avoiding patterns? Yes (no Repository/UoW, direct API calls)

**Architecture**:
- EVERY feature as library? Yes
- Libraries listed: 
  - mcp-server: MCP server with selective tool loading and 160+ tools
  - cli-client: Console client with nested commands organized by category and 20-language support
  - bitbucket-api: Bitbucket API client with Cloud/Data Center support and HTTP logging
  - http-logger: HTTP call logging with sensitive data sanitization
  - localization: Multi-language support for CLI command descriptions
- CLI per library: mcp-server (--help/--version), cli-client (--help/--format json|table --language <lang>)
- Library docs: llms.txt format planned? Yes

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (test MUST fail first)
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (real Bitbucket API, no mocks)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase? Enforced

**Observability**:
- Structured logging included? Yes (winston/pino)
- Frontend logs → backend? N/A (CLI only)
- Error context sufficient? Yes (stack traces, API errors)

**Versioning**:
- Version number assigned? 1.0.0 (MAJOR.MINOR.BUILD)
- BUILD increments on every change? Yes
- Breaking changes handled? Yes (parallel tests, migration plan)

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

**Structure Decision**: Option 1 (Single project) - MCP server with integrated CLI

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
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 80+ tarefas numeradas e ordenadas em tasks.md (cobrindo 160+ endpoints, CLI abrangente com estrutura aninhada completa, suporte a 20 idiomas, e logging HTTP com sanitização)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Major Updates from Input Content

O conteúdo de entrada foi significativamente expandido e atualizado com:

1. **Estrutura CLI Completa**: Definição detalhada de todos os comandos CLI organizados por categoria (auth, repository, pull-request, project, issue, etc.) com estrutura aninhada usando Commander.js

2. **160+ Endpoints Cobertos**: Especificação completa de todos os endpoints das APIs do Bitbucket Cloud e Data Center, incluindo schemas de entrada e saída detalhados

3. **Comandos por Tipo de Servidor**: Organização clara dos comandos específicos para Cloud vs Data Center, com separação adequada de funcionalidades

4. **Padrões de Código Atualizados**: Exemplos de implementação baseados no repositório de referência [guercheLE/bitbucket-mcp-server](https://github.com/guercheLE/bitbucket-mcp-server)

5. **Logging HTTP com Sanitização**: Implementação completa de logging de chamadas HTTP com mascaramento de dados sensíveis

6. **Contratos API Completos**: Especificações OpenAPI para MCP Server e CLI Commands com schemas detalhados

7. **Suporte a Múltiplos Idiomas**: Sistema de localização para 20 idiomas mais falados com descrições de comandos CLI

8. **Logging HTTP Avançado**: Sistema completo de logging de chamadas HTTP via stderr com sanitização de dados sensíveis para geração de scripts

**Code Patterns Based on Reference Repository**:

Based on the [guercheLE/bitbucket-mcp-server](https://github.com/guercheLE/bitbucket-mcp-server) repository patterns:

**Tool Implementation Pattern**:
```typescript
// tools/datacenter/authentication.tool.ts
import { z } from 'zod';
import { MCPTool } from '@modelcontextprotocol/sdk';

const AuthSchema = z.object({
  username: z.string().min(1),
  token: z.string().min(1),
  serverUrl: z.string().url()
});

export const authenticateTool: MCPTool = {
  name: "mcp_bitbucket_auth_authenticate",
  description: "Authenticate with Bitbucket Data Center",
  inputSchema: AuthSchema.shape,
  handler: async (params) => {
    const validated = AuthSchema.parse(params);
    // Implementation
  }
};
```

**Command Implementation Pattern**:
```typescript
// commands/cloud/authentication.command.ts
import { Command } from 'commander';
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
  server: z.string().url()
});

export const authCommand = new Command('auth')
  .description('Authenticate with Bitbucket')
  .action(async (options) => {
    const validated = LoginSchema.parse(options);
    // Implementation
  });
```

**Specific Task Categories**:

1. **Setup & Configuration (Tasks 1-5)**:
   - [1] Setup project structure and package.json
   - [2] Configure TypeScript, ESLint, Prettier
   - [3] Setup Jest testing framework
   - [4] Create environment configuration files
   - [5] Setup HTTP logging and sanitization utilities

2. **Contract Tests (Tasks 6-13)** [P]:
   - [6] Create MCP server API contract tests
   - [7] Create CLI commands API contract tests
   - [8] Create Bitbucket API integration contract tests
   - [9] Create authentication contract tests
   - [10] Create HTTP logging contract tests
   - [11] Create server type detection contract tests
   - [12] Create tool loading contract tests
   - [13] Create CLI client integration tests

3. **Core Types & Models (Tasks 14-22)** [P]:
   - [14] Create BitbucketConfig and AuthConfig types with Zod schemas
   - [15] Create Repository, PullRequest, User types with Zod schemas
   - [16] Create Project and Issue types (server-specific) with Zod schemas
   - [17] Create MCPTool and CLICommand types with Zod validation
   - [18] Create error handling and validation types with Zod schemas
   - [19] Create HTTP logging and sanitization types
   - [20] Create Cloud-specific types (Webhook, Pipeline, Snippet, etc.)
   - [21] Create Data Center-specific types (OAuthToken, Permission, Group, etc.)
   - [22] Create localization types and language support schemas

4. **Core Services (Tasks 23-29)**:
   - [23] Implement BitbucketAPIService with Cloud/DC detection
   - [24] Implement AuthService with multiple auth methods
   - [25] Implement ConfigService for environment management
   - [26] Implement LoggerService with structured logging
   - [27] Implement ErrorHandlerService with proper error mapping
   - [28] Implement HTTPLoggerService with sensitive data sanitization
   - [29] Implement LocalizationService with 20-language support

5. **MCP Tools - Cloud (Tasks 30-37)** [P]:
   - [30] Implement Cloud authentication tools (OAuth, App Password, API Token)
   - [31] Implement Cloud repository tools (CRUD operations, branches, tags)
   - [32] Implement Cloud pull request tools (create, merge, decline, comments)
   - [33] Implement Cloud issue tools (create, update, list, comments)
   - [34] Implement Cloud pipeline tools (trigger, monitor, steps)
   - [35] Implement Cloud webhook tools (create, update, delete, list)
   - [36] Implement Cloud snippet tools (create, update, delete, list)
   - [37] Implement Cloud SSH/GPG key tools (create, delete, list)

6. **MCP Tools - Data Center (Tasks 38-44)** [P]:
   - [38] Implement DC authentication tools (OAuth Token, API Token, Basic)
   - [39] Implement DC repository tools (CRUD operations, branches, tags)
   - [40] Implement DC pull request tools (create, merge, decline, comments)
   - [41] Implement DC project tools (create, update, delete, list, permissions)
   - [42] Implement DC security tools (permissions, access control)
   - [43] Implement DC OAuth token management tools
   - [44] Implement DC user and group management tools

7. **MCP Server (Tasks 45-48)**:
   - [45] Implement MCPServer with selective tool loading
   - [46] Implement tool loader with server type detection
   - [47] Implement server startup and configuration
   - [48] Implement server health checks and monitoring

8. **CLI Client (Tasks 49-58)**:
   - [49] Implement CLI framework with Commander.js and nested commands
   - [50] Implement authentication commands (login, logout, status, OAuth)
   - [51] Implement repository commands (list, create, get, update, delete, branches, tags)
   - [52] Implement pull request commands (list, create, merge, decline, comments)
   - [53] Implement project commands (Data Center: list, create, update, delete, permissions)
   - [54] Implement issue commands (Cloud: list, create, update, delete, comments)
   - [55] Implement search commands (commits, code, repositories, users)
   - [56] Implement Cloud-specific commands (webhook, pipeline, snippet, SSH/GPG keys)
   - [57] Implement Data Center-specific commands (permissions, OAuth, admin)
   - [58] Implement output formatters (JSON, table, human-readable) and language support

9. **Integration & Polish (Tasks 59-72)**:
   - [59] Connect services to Bitbucket API with proper error handling
   - [60] Implement rate limiting and retry logic
   - [61] Add request/response logging middleware with sanitization
   - [62] Implement configuration validation and environment setup
   - [63] Add server type detection and tool loading logic
   - [64] Implement CLI command registration and help system with language support
   - [65] Create comprehensive unit tests for all components
   - [66] Performance testing (<2s read, <5s write operations)
   - [67] Create comprehensive README with examples
   - [68] Create API documentation with OpenAPI specs
   - [69] Create troubleshooting guide
   - [70] Create deployment and configuration guide
   - [71] Final testing and validation
   - [72] Code optimization and cleanup

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

### 6. HTTP Call Logging with Sanitization
```typescript
// utils/http-logger.ts
export class HTTPLogger {
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'x-auth-token', 'cookie'];
    const sanitized = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***MASKED***';
      }
    }
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }
    
    return sanitized;
  }

  logHTTPCall(request: any, response: any): any {
    return {
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: this.sanitizeBody(request.body)
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: this.sanitizeHeaders(response.headers),
        body: this.sanitizeBody(response.data)
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

### 7. Localization Support Pattern
```typescript
// services/localization.service.ts
export class LocalizationService {
  private supportedLanguages = [
    'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ja',
    'de', 'ko', 'vi', 'tr', 'it', 'th', 'pl', 'uk', 'nl', 'sv'
  ];

  getCommandDescription(command: string, language: string = 'en'): string {
    const translations = this.getTranslations(language);
    return translations[command] || this.getDefaultDescription(command);
  }

  private getTranslations(language: string): Record<string, string> {
    // Load translations from JSON files or database
    return require(`./locales/${language}.json`);
  }
}
```

### 8. HTTP Logging with Stderr Pattern
```typescript
// utils/stderr-logger.ts
export class StderrLogger {
  logHTTPRequest(request: any, response: any): void {
    const sanitized = this.sanitizeData({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      response: {
        status: response.status,
        headers: response.headers,
        data: response.data
      }
    });

    // Log to stderr for script generation
    process.stderr.write(JSON.stringify(sanitized) + '\n');
  }

  private sanitizeData(data: any): any {
    // Implementation of sensitive data sanitization
    return data;
  }
}
```

### 9. Comprehensive CLI Command Structure
```typescript
// client/console-client.ts - Complete command structure
import { Command } from 'commander';

const program = new Command();

program
  .name('bitbucket-mcp')
  .description('Bitbucket MCP Server CLI Client')
  .version('1.0.0');

// Data Center Commands
program
  .command('auth')
  .description('Authentication commands')
  .command('oauth-token-create', 'Create OAuth token')
  .command('oauth-token-list', 'List OAuth tokens')
  .command('oauth-token-revoke', 'Revoke OAuth token')
  .command('user-get', 'Get current user')
  .command('session-create', 'Create user session');

program
  .command('project')
  .description('Project management commands')
  .command('list', 'List projects')
  .command('create', 'Create project')
  .command('get', 'Get project details')
  .command('update', 'Update project')
  .command('delete', 'Delete project')
  .command('permissions-get', 'Get project permissions')
  .command('permissions-user-update', 'Update user permissions')
  .command('permissions-group-update', 'Update group permissions');

// Cloud Commands
program
  .command('workspace')
  .description('Workspace management commands')
  .command('list', 'List workspaces')
  .command('get', 'Get workspace details')
  .command('update', 'Update workspace')
  .command('permissions-get', 'Get workspace permissions')
  .command('permissions-update', 'Update member permissions');

program
  .command('issue')
  .description('Issue management commands (Cloud only)')
  .command('list', 'List issues')
  .command('create', 'Create issue')
  .command('get', 'Get issue')
  .command('update', 'Update issue')
  .command('delete', 'Delete issue')
  .command('comments-list', 'List issue comments')
  .command('comments-create', 'Create issue comment');

// Usage examples:
// bitbucket-mcp repository list --project ND
// bitbucket-mcp pull-request create --source feature-branch --destination main
// bitbucket-mcp project list
// bitbucket-mcp auth oauth-token-create --grant-type authorization_code
// bitbucket-mcp workspace list
// bitbucket-mcp issue list --workspace myworkspace --repo myrepo
// bitbucket-mcp pipeline list --workspace myworkspace --repo myrepo
```

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
- [x] Input content updated with comprehensive CLI structure, 160+ endpoints, 20-language support, and HTTP logging requirements

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*