# bitbucket-mcp-server Development Guidelines for Cursor

Auto-generated from all feature plans. Last updated: 2025-01-27

## Active Technologies
- TypeScript with Node.js 18+ + @modelcontextprotocol/sdk (official), Zod, Jest (001-mcp-server-infrastructure)

## Project Structure
```
src/
├── server/          # Main MCP server
├── types/           # TypeScript type definitions
└── utils/           # Utilities

tests/
├── contract/        # MCP protocol contract tests
├── integration/     # Server integration tests
└── unit/           # Unit tests
```

## Commands
npm test && npm run lint

## Code Style
TypeScript with Node.js 18+: Follow standard conventions
- Use strict TypeScript configuration
- Implement Test-First Development (TDD)
- Follow MCP protocol compliance patterns
- Use Zod for runtime validation

## Recent Changes
- 001-mcp-server-infrastructure: Added MCP server foundation with TypeScript, official MCP SDK, Zod validation, Jest testing

## Cursor Specifics
- This file serves as context for Cursor AI in VS Code
- Use inline comments to guide code generation
- Use descriptive variable and function names
- Leverage autocomplete suggestions for boilerplate code
- Focus on MCP protocol compliance and TypeScript strict typing
- Utilize Cursor's chat features for code explanations and refactoring
- Use Cursor's codebase understanding for better context-aware suggestions

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
