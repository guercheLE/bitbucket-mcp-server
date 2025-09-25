/**
 * Workspace Context Management Usage Example
 * 
 * Demonstrates how to use the workspace context management system
 * to enhance existing MCP tools with workspace awareness.
 */

import { WorkspaceContextProvider } from '../src/workspace/context.js';
import {
    ToolIntegrationHelper,
    WorkspaceContextManager,
    type ToolExecutionContext
} from '../src/workspace/context/index.js';
import { WorkspaceManager } from '../src/workspace/manager.js';
import { FileWorkspaceStorage } from '../src/workspace/storage.js';

// ============================================================================
// Example: Enhancing an Existing Repository Tool
// ============================================================================

/**
 * Original repository tool (before workspace enhancement)
 */
async function originalGetRepositories(params: {
    projectKey: string;
    limit?: number;
}): Promise<{ repositories: Array<{ name: string; slug: string }> }> {
    // Original implementation that works with default workspace
    console.log('Getting repositories for project:', params.projectKey);
    return {
        repositories: [
            { name: 'Example Repo 1', slug: 'repo-1' },
            { name: 'Example Repo 2', slug: 'repo-2' },
        ],
    };
}

/**
 * Enhanced repository tool (with workspace support)
 */
async function enhancedGetRepositories(
    params: {
        projectKey: string;
        limit?: number;
        workspaceId?: string;
        workspaceSlug?: string;
    },
    context: ToolExecutionContext,
    workspace?: any
): Promise<{ repositories: Array<{ name: string; slug: string }> }> {
    // Enhanced implementation that can work with any workspace
    console.log('Getting repositories for project:', params.projectKey);
    console.log('Using workspace:', workspace?.name || 'default');
    console.log('Request ID:', context.requestId);

    return {
        repositories: [
            { name: `${workspace?.name || 'Default'} Repo 1`, slug: 'repo-1' },
            { name: `${workspace?.name || 'Default'} Repo 2`, slug: 'repo-2' },
        ],
    };
}

// ============================================================================
// Setup Context Management System
// ============================================================================

async function setupContextSystem() {
    // Initialize workspace management components
    const storage = new FileWorkspaceStorage({
        storageDir: './data/workspaces',
        filename: 'workspaces.json'
    });

    const workspaceManager = new WorkspaceManager({
        maxWorkspaces: 10,
    }, storage);

    const contextProvider = new WorkspaceContextProvider(workspaceManager);
    const contextManager = new WorkspaceContextManager(workspaceManager, contextProvider, {
        enableContextSwitching: true,
        validateParameters: true,
        trackToolExecution: true,
    });
    const integrationHelper = new ToolIntegrationHelper(contextManager);

    return { workspaceManager, contextManager, integrationHelper };
}

// ============================================================================
// Example Usage Scenarios
// ============================================================================

async function demonstrateContextManagement() {
    console.log('🚀 Demonstrating Workspace Context Management System\n');

    const { contextManager, integrationHelper } = await setupContextSystem();

    // ========================================================================
    // Scenario 1: Enhance existing tool schema
    // ========================================================================
    console.log('📋 Scenario 1: Enhancing Tool Schema');

    const originalSchema = {
        name: 'get_repositories',
        description: 'Get repositories in a project',
        inputSchema: {
            type: 'object' as const,
            properties: {
                projectKey: { type: 'string', description: 'Project key' },
                limit: { type: 'number', description: 'Maximum number of repositories' },
            },
            required: ['projectKey'],
        },
    };

    const enhancedSchema = integrationHelper.enhanceToolSchema(originalSchema, {
        requiresWorkspace: false, // Backward compatible
        supportsMultiWorkspace: true,
        authenticationRequired: true,
    });

    console.log('Original schema properties:', Object.keys(originalSchema.inputSchema.properties));
    console.log('Enhanced schema properties:', Object.keys(enhancedSchema.inputSchema.properties));
    console.log('Workspace integration config:', enhancedSchema.workspaceIntegration);
    console.log();

    // ========================================================================
    // Scenario 2: Create tool execution context
    // ========================================================================
    console.log('🔧 Scenario 2: Creating Tool Execution Context');

    const context1 = await contextManager.createContext('get_repositories');
    console.log('Created context:', context1.requestId);
    console.log('Tool name:', context1.toolName);
    console.log('Timestamp:', context1.timestamp);
    console.log();

    // ========================================================================
    // Scenario 3: Enhance parameters with workspace context
    // ========================================================================
    console.log('⚡ Scenario 3: Enhancing Parameters');

    const originalParams = {
        projectKey: 'PROJ',
        limit: 10,
        workspaceSlug: 'development', // Optional workspace context
    };

    const enhancedParams = await contextManager.enhanceParameters(
        'get_repositories',
        originalParams,
        {
            validateWorkspace: false, // Skip validation for demo
            addWorkspaceContext: true,
        }
    );

    console.log('Original parameters:', originalParams);
    console.log('Enhanced parameters valid:', enhancedParams.validation.valid);
    console.log('Validation errors:', enhancedParams.validation.errors);
    console.log();

    // ========================================================================
    // Scenario 4: Wrap existing tool function
    // ========================================================================
    console.log('🔄 Scenario 4: Wrapping Tool Function');

    const wrappedTool = integrationHelper.wrapTool(
        'get_repositories',
        originalGetRepositories,
        {
            requireWorkspace: false,
            allowOptionalWorkspace: true,
            validateWorkspace: false, // Skip validation for demo
        }
    );

    try {
        const toolContext = await contextManager.createContext('get_repositories');
        const result = await wrappedTool(originalParams, toolContext);
        console.log('Wrapped tool result:', result);
    } catch (error) {
        console.log('Wrapped tool error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 5: Backward compatibility wrapper
    // ========================================================================
    console.log('🔒 Scenario 5: Backward Compatibility');

    const compatibilityWrapper = integrationHelper.createBackwardCompatibleWrapper(
        'get_repositories',
        originalGetRepositories
    );

    // Use original function (no changes needed)
    const originalResult = await compatibilityWrapper.original({ projectKey: 'PROJ' });
    console.log('Original function result:', originalResult);

    // Use enhanced function with context
    try {
        const enhancedContext = await contextManager.createContext('get_repositories');
        const enhancedResult = await compatibilityWrapper.enhanced(
            { projectKey: 'PROJ', limit: 5 },
            enhancedContext
        );
        console.log('Enhanced function result:', enhancedResult);
    } catch (error) {
        console.log('Enhanced function error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 6: Register and validate tool schema
    // ========================================================================
    console.log('📝 Scenario 6: Schema Registration and Validation');

    // Register the enhanced schema
    contextManager.registerToolSchema(enhancedSchema);

    // Check if tool supports workspace context
    const supportsWorkspace = contextManager.supportsWorkspaceContext('get_repositories');
    console.log('Tool supports workspace context:', supportsWorkspace);

    // Get registered schema
    const registeredSchema = contextManager.getToolSchema('get_repositories');
    console.log('Retrieved schema name:', registeredSchema?.name);
    console.log();

    console.log('✅ Context Management System demonstration complete!');
}

// ============================================================================
// Run Example (commented out to prevent execution during imports)
// ============================================================================

/*
// Uncomment to run the demonstration
demonstrateContextManagement().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
});
*/

export {
    demonstrateContextManagement, enhancedGetRepositories, originalGetRepositories, setupContextSystem
};
