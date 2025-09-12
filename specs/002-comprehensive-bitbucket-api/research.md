# Research: Node.js Bitbucket MCP Server

## MCP SDK and Implementation

### Decision: @modelcontextprotocol/sdk
**Rationale**: Official Model Context Protocol SDK for Node.js, maintained by the MCP community. Latest version provides TypeScript types, server/client abstractions, established patterns, and support for Zod schemas in tool definitions.

**Alternatives considered**: 
- Custom implementation: Rejected due to complexity and maintenance
- Other SDKs: No mature alternatives for Node.js
- Older SDK versions: Rejected to ensure latest features and security updates

### Decision: Modular Structure with Server/Client Separation
**Rationale**: Based on the example repository [guercheLE/bitbucket-mcp-server](https://github.com/guercheLE/bitbucket-mcp-server), proven structure with:
- `src/server/`: MCP server logic
- `src/client/`: Integrated console client  
- `src/commands/`: Commands organized by server type
- `src/tools/`: Tools organized by server type
- `src/services/`: Bitbucket API abstraction

**Alternatives considered**:
- Monolithic structure: Rejected due to maintenance difficulty
- Repository separation: Rejected due to unnecessary complexity

## Bitbucket API and Authentication

### Decision: Automatic Detection by URL
**Rationale**: 
- URLs containing `bitbucket.org` → Bitbucket Cloud
- Custom URLs → Bitbucket Data Center
- Selective tool loading based on detection

**Alternatives considered**:
- Manual configuration: Rejected due to inferior UX
- API auto-detection: Rejected due to unnecessary overhead

### Decision: Multiple Authentication Methods
**Rationale**: Flexible support based on server type:

**Cloud**:
- OAuth 2.0 (preferred)
- App Passwords
- API Tokens

**Data Center**:
- API Tokens
- Personal Access Tokens
- Basic Auth (fallback)

**Alternatives considered**:
- Single method: Rejected due to compatibility limitations
- Automatic authentication: Rejected due to security concerns

## CLI Framework and Patterns

### Decision: Commander.js
**Rationale**: Mature and well-established CLI framework for Node.js with:
- Native TypeScript support
- Hierarchical command system
- Automatic help
- Argument validation
- Subcommand support

**Alternatives considered**:
- Yargs: Rejected due to less intuitive syntax
- Inquirer.js: Rejected due to focus on interactive prompts
- Custom CLI: Rejected due to complexity

### Decision: Commands by Category Pattern
**Rationale**: Organization based on reference example:
```
src/commands/
├── auth.ts          # Authentication commands
├── repository.ts    # Repository commands
├── pull-request.ts  # Pull request commands
├── project.ts       # Project commands (Data Center)
└── issue.ts         # Issue commands (Cloud)
```

**Alternatives considered**:
- Monolithic commands: Rejected due to maintainability
- Commands by operation: Rejected due to excessive fragmentation

## Commands Structure

### Decision: Server-Type Specific Command Organization
**Rationale**: Commands organized by server type to match tool structure and provide clear separation:

```
src/commands/
├── cloud/
│   ├── authentication.command.ts    # Cloud auth commands (OAuth, App Password, API Token)
│   ├── repository.command.ts        # Cloud repository commands
│   ├── pull-request.command.ts      # Cloud pull request commands
│   ├── issue.command.ts             # Cloud issue commands
│   └── pipeline.command.ts          # Cloud pipeline commands
└── datacenter/
    ├── authentication.command.ts    # DC auth commands (API Token, PAT, Basic)
    ├── repository.command.ts        # DC repository commands
    ├── pull-request.command.ts      # DC pull request commands
    ├── project.command.ts           # DC project commands
    └── security.command.ts          # DC security commands
```

### Decision: Command Implementation Pattern
**Rationale**: Standardized command structure using Commander.js with Zod validation:

```typescript
// commands/cloud/authentication.command.ts
import { Command } from 'commander';
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  server: z.string().url("Valid server URL is required")
});

export const authCommand = new Command('auth')
  .description('Authenticate with Bitbucket Cloud')
  .option('-u, --username <username>', 'Bitbucket username')
  .option('-p, --password <password>', 'App password or API token')
  .option('-s, --server <url>', 'Bitbucket server URL')
  .action(async (options) => {
    try {
      const validated = LoginSchema.parse(options);
      // Authentication implementation
    } catch (error) {
      console.error('Validation error:', error.message);
    }
  });
```

### Decision: Command Registration Pattern
**Rationale**: Centralized command registration with server type detection:

```typescript
// commands/index.ts
import { authCommand as cloudAuth } from './cloud/authentication.command';
import { authCommand as dcAuth } from './datacenter/authentication.command';

export function registerCommands(program: Command, serverType: 'cloud' | 'datacenter') {
  if (serverType === 'cloud') {
    program.addCommand(cloudAuth);
    // Register other cloud commands
  } else {
    program.addCommand(dcAuth);
    // Register other datacenter commands
  }
}
```

**Alternatives considered**:
- Single command file: Rejected due to complexity and maintainability
- Commands by operation: Rejected due to lack of server type separation
- Dynamic command loading: Rejected due to complexity and type safety issues

## Tool Structure

### Decision: Organization by Server Type
**Rationale**: Clear separation between Cloud and Data Center tools:
```
src/tools/
├── cloud/
│   ├── auth/
│   ├── repository/
│   ├── pull-request/
│   ├── issue/
│   └── pipeline/
└── datacenter/
    ├── auth/
    ├── repository/
    ├── pull-request/
    ├── project/
    └── security/
```

**Alternatives considered**:
- Unified tools: Rejected due to compatibility complexity
- Tools by functionality: Rejected due to duplication

### Decision: MCP Tool Pattern with Zod Schemas
**Rationale**: Standardized structure using Zod schemas for type-safe validation:
```typescript
import { z } from 'zod';

const CreateRepositorySchema = z.object({
  workspace: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  isPrivate: z.boolean().default(true)
});

export const createRepositoryTool: MCPTool = {
  name: "mcp_bitbucket_repository_create",
  description: "Creates a new repository in Bitbucket",
  inputSchema: CreateRepositorySchema.shape,
  handler: async (params) => {
    const validatedParams = CreateRepositorySchema.parse(params);
    // Implementation using validated parameters
  }
};
```

**Alternatives considered**:
- JSON Schema only: Rejected due to lack of runtime validation
- Dynamic schemas: Rejected due to complexity
- Simplified schemas: Rejected due to lack of validation

## Logging and Observability

### Decision: Winston for Structured Logging
**Rationale**: Mature library with:
- Multiple transport support
- Structured formatting (JSON)
- Configurable log levels
- TypeScript integration

**Alternatives considered**:
- Pino: Rejected due to unnecessary performance overhead
- Console.log: Rejected due to lack of structure
- Log4js: Rejected due to complexity

### Decision: JSON Structured Logs
**Rationale**: Facilitates analysis and integration with monitoring systems.

**Alternatives considered**:
- Text logs: Rejected due to parsing difficulty
- Custom logs: Rejected due to complexity

## Testing and Quality

### Decision: Jest with Coverage > 80%
**Rationale**: Mature testing framework with:
- Native TypeScript support
- Integrated mocking
- Code coverage
- Snapshot testing
- Async/await support

**Alternatives considered**:
- Mocha + Chai: Rejected due to more complex configuration
- Vitest: Rejected due to lower maturity
- No tests: Rejected due to constitutional requirement

### Decision: Integration Tests with Real API
**Rationale**: Real validation of Bitbucket integration, following constitutional principles.

**Alternatives considered**:
- Complete mocks: Rejected due to not validating real integration
- Unit tests only: Rejected due to insufficient coverage

## Performance and Constraints

### Decision: Respectful Rate Limiting
**Rationale**: Implement delays and retry logic to respect Bitbucket API limits.

**Alternatives considered**:
- No rate limiting: Rejected due to blocking risk
- Aggressive rate limiting: Rejected due to inferior performance

### Decision: Configurable Timeouts
**Rationale**: 2s timeouts for reading, 5s for writing, configurable via environment.

**Alternatives considered**:
- Fixed timeouts: Rejected due to inflexibility
- No timeouts: Rejected due to hanging risk

## Main Dependencies

### Decision: Minimalist Technology Stack
**Rationale**: Essential dependencies only:
- `@modelcontextprotocol/sdk`: Official MCP SDK with Zod support
- `zod`: Runtime type validation and schema definition
- `axios`: HTTP client for Bitbucket API
- `commander`: CLI framework
- `winston`: Structured logging
- `dotenv`: Environment variable management

**Alternatives considered**:
- Heavier stack: Rejected due to unnecessary complexity
- Custom dependencies: Rejected due to maintenance
- JSON Schema without Zod: Rejected due to lack of runtime validation

## Conclusions

All technical decisions were based on:
1. **Maturity**: Choice of established and well-documented technologies
2. **Simplicity**: Avoid over-engineering and unnecessary complexity
3. **Maintainability**: Modular structure and clear patterns
4. **Compatibility**: Robust support for both Bitbucket server types
5. **Constitutional Compliance**: Following library-first, CLI interface, and test-first principles
