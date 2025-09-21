# bitbucket-mcp-server Development Guidelines for GitHub Copilot

Auto-generated from all feature plans. Last updated: 2025-09-21

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

## GitHub Copilot Specifics
- This file serves as context for GitHub Copilot in VS Code
- Use inline comments to guide code generation
- Use descriptive variable and function names
- Leverage autocomplete suggestions for boilerplate code
- Focus on MCP protocol compliance and TypeScript strict typing

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
