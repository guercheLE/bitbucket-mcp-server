# Workspace Context Management System

## Overview

The Workspace Context Management System is a comprehensive solution for managing workspace context during MCP tool execution. It provides context switching, validation, parameter enhancement, and seamless integration with existing MCP tools while maintaining full backward compatibility.

## Architecture

### Core Components

1. **Context Management Types** (`src/workspace/context/types.ts`)
   - Defines all TypeScript types and Zod schemas for context management
   - Includes tool execution context, validation results, and configuration types
   - Provides parameter enhancement and event system types

2. **Workspace Context Manager** (`src/workspace/context/manager.ts`)
   - Core system for managing workspace context during tool execution
   - Handles context creation, switching, validation, and parameter enhancement
   - Provides tool schema registration and execution tracking

3. **Tool Integration Helper** (`src/workspace/context/integration.ts`)
   - Utilities for integrating existing MCP tools with workspace context
   - Enables backward compatibility while adding workspace features
   - Provides tool wrapping and parameter validation capabilities

## Key Features

### 1. Context Creation and Management
```typescript
// Create a new tool execution context
const context = await contextManager.createContext('tool-name', 'workspace-id');

// Switch to a different workspace context
const newContext = await contextManager.switchContext('target-workspace-id', true, 'Manual switch');
```

### 2. Parameter Enhancement
```typescript
// Enhance tool parameters with workspace context
const enhancedParams = await contextManager.enhanceParameters('tool-name', originalParams, {
    validateWorkspace: true,
    addWorkspaceContext: true,
});
```

### 3. Tool Schema Enhancement
```typescript
// Enhance existing tool schema with workspace support
const enhancedSchema = integrationHelper.enhanceToolSchema(originalSchema, {
    requiresWorkspace: false,
    supportsMultiWorkspace: true,
    authenticationRequired: true,
});
```

### 4. Tool Function Wrapping
```typescript
// Wrap existing tool function to support workspace context
const wrappedTool = integrationHelper.wrapTool('tool-name', originalFunction, {
    requireWorkspace: false,
    allowOptionalWorkspace: true,
    preserveOriginalParams: true,
});
```

### 5. Backward Compatibility
```typescript
// Create backward compatible wrapper
const compatibilityWrapper = integrationHelper.createBackwardCompatibleWrapper(
    'tool-name',
    originalFunction
);

// Use original function (unchanged)
const originalResult = await compatibilityWrapper.original(params);

// Use enhanced function (with workspace context)
const enhancedResult = await compatibilityWrapper.enhanced(params, context);
```

## Configuration Options

### Context Manager Configuration
```typescript
interface ContextManagerConfig {
    enableContextSwitching: boolean;  // Enable context switching capabilities
    maxContextStack: number;          // Maximum context stack size
    contextTimeout: number;           // Context expiration timeout (ms)
    validateParameters: boolean;      // Enable parameter validation
    trackToolExecution: boolean;      // Enable execution tracking
}
```

### Tool Wrapper Configuration
```typescript
interface ToolWrapperConfig {
    requireWorkspace: boolean;        // Whether workspace is required
    allowOptionalWorkspace: boolean;  // Allow optional workspace parameters
    preserveOriginalParams: boolean;  // Preserve original parameter structure
    validateWorkspace: boolean;       // Validate workspace existence/status
    addWorkspaceContext: boolean;     // Add workspace context to parameters
}
```

## Integration Patterns

### Pattern 1: Optional Workspace Support (Recommended)
```typescript
// Tool works with or without workspace context
const enhancedSchema = integrationHelper.enhanceToolSchema(originalSchema, {
    requiresWorkspace: false,           // Optional for backward compatibility
    supportsMultiWorkspace: true,       // Can work with multiple workspaces
});

const wrappedTool = integrationHelper.wrapTool('tool-name', originalFunction, {
    requireWorkspace: false,            // Don't require workspace
    allowOptionalWorkspace: true,       // Accept optional workspace parameters
    preserveOriginalParams: true,       // Keep original parameters intact
});
```

### Pattern 2: Required Workspace Support
```typescript
// Tool requires workspace context
const enhancedSchema = integrationHelper.enhanceToolSchema(originalSchema, {
    requiresWorkspace: true,            // Workspace is mandatory
    workspaceParameterName: 'workspace', // Custom parameter name
});

const wrappedTool = integrationHelper.wrapTool('tool-name', originalFunction, {
    requireWorkspace: true,             // Require workspace
    validateWorkspace: true,            // Validate workspace exists
});
```

### Pattern 3: Migration Support
```typescript
// Gradual migration with full backward compatibility
const compatibilityWrapper = integrationHelper.createBackwardCompatibleWrapper(
    'tool-name',
    originalFunction
);

// Register both versions during migration period
tools.register('tool-name', compatibilityWrapper.original);          // Legacy version
tools.register('tool-name-enhanced', compatibilityWrapper.enhanced); // Enhanced version
```

## Event System

The context manager emits events for monitoring and debugging:

```typescript
contextManager.on('contextEvent', (event) => {
    console.log(`Context event: ${event.type}`, event);
});

// Available event types:
// - CONTEXT_CREATED: New context created
// - CONTEXT_SWITCHED: Context switched between workspaces
// - CONTEXT_VALIDATED: Context validation completed
// - TOOL_EXECUTED: Tool execution completed
// - ERROR_OCCURRED: Error during context operations
```

## Error Handling

The system provides comprehensive error handling with workspace-specific error types:

```typescript
try {
    const context = await contextManager.createContext('tool-name', 'invalid-workspace');
} catch (error) {
    if (isWorkspaceError(error)) {
        console.log('Workspace error type:', error.type);
        console.log('Workspace ID:', error.workspaceId);
        console.log('Error message:', error.message);
    }
}
```

## Performance Considerations

1. **Context Caching**: Contexts are cached with TTL for performance
2. **Cleanup**: Expired contexts are automatically cleaned up
3. **Validation**: Parameter validation can be disabled for performance
4. **Tracking**: Execution tracking can be disabled if not needed

## Usage Example

See `examples/context-management-demo.ts` for a complete demonstration of all features and patterns.

## Migration Guide

1. **Phase 1**: Add context management system (✅ Complete)
2. **Phase 2**: Enhance existing tools one by one using optional workspace support
3. **Phase 3**: Gradually move to required workspace support for new tools
4. **Phase 4**: Remove backward compatibility wrappers once migration is complete

This system ensures zero breaking changes while providing powerful workspace context management capabilities.