/**
 * Repository Tools Integration Example
 * 
 * Demonstrates how to use the enhanced repository tools with workspace context
 * and how they maintain backward compatibility.
 */

import { WorkspaceContextProvider } from '../src/workspace/context.js';
import { ToolIntegrationHelper, WorkspaceContextManager } from '../src/workspace/context/index.js';
import { WorkspaceManager } from '../src/workspace/manager.js';
import { FileWorkspaceStorage } from '../src/workspace/storage.js';
import { WorkspaceRepositoryTools } from '../src/workspace/tools/repository-tools.js';

// ============================================================================
// Setup Repository Tools with Workspace Context
// ============================================================================

async function setupRepositoryTools() {
    // Initialize workspace system
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

    // Initialize repository tools
    const repositoryTools = new WorkspaceRepositoryTools(contextManager, integrationHelper);

    // Register all repository tool schemas
    repositoryTools.registerAllSchemas();

    return { repositoryTools, contextManager, workspaceManager };
}

// ============================================================================
// Example Usage Scenarios
// ============================================================================

async function demonstrateRepositoryTools() {
    console.log('🛠️  Demonstrating Workspace-Aware Repository Tools\n');

    const { repositoryTools, contextManager } = await setupRepositoryTools();

    // ========================================================================
    // Scenario 1: Repository List (backward compatible)
    // ========================================================================
    console.log('📋 Scenario 1: Repository List (Backward Compatible)');

    try {
        const result1 = await repositoryTools.repositoryList({
            projectKey: 'DEMO',
            limit: 5,
        });
        console.log('✅ Repository list (default workspace):', result1.repositories.length, 'repositories');
        console.log('   First repository:', result1.repositories[0]?.name);
    } catch (error) {
        console.log('❌ Repository list error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 2: Repository List with Workspace Context
    // ========================================================================
    console.log('🏢 Scenario 2: Repository List with Workspace Context');

    try {
        const result2 = await repositoryTools.repositoryList({
            projectKey: 'DEMO',
            limit: 5,
            workspaceSlug: 'development', // Workspace-specific
        });
        console.log('✅ Repository list (development workspace):', result2.repositories.length, 'repositories');
        console.log('   First repository:', result2.repositories[0]?.name);
    } catch (error) {
        console.log('❌ Repository list with workspace error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 3: Repository Get with Context Switching
    // ========================================================================
    console.log('🔄 Scenario 3: Repository Get with Context Switching');

    try {
        // Create context for default workspace
        const defaultContext = await contextManager.createContext('repository_get');
        const result3a = await repositoryTools.repositoryGet({
            projectKey: 'DEMO',
            repositorySlug: 'demo-repo',
        }, defaultContext);
        console.log('✅ Repository get (default context):', result3a.name);

        // Switch context to different workspace (would switch if workspace exists)
        try {
            const stagingContext = await contextManager.switchContext('staging', true, 'Demo switch');
            const result3b = await repositoryTools.repositoryGet({
                projectKey: 'DEMO',
                repositorySlug: 'demo-repo',
            }, stagingContext);
            console.log('✅ Repository get (staging context):', result3b.name);
        } catch (switchError) {
            console.log('⚠️  Context switch failed (expected - no staging workspace):', switchError instanceof Error ? switchError.message : switchError);
        }
    } catch (error) {
        console.log('❌ Repository get error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 4: Repository Create with Validation
    // ========================================================================
    console.log('🆕 Scenario 4: Repository Create with Validation');

    try {
        const result4 = await repositoryTools.repositoryCreate({
            projectKey: 'DEMO',
            name: 'New Demo Repository',
            description: 'Created via workspace-aware repository tools',
            isPrivate: false,
        });
        console.log('✅ Repository created:', result4.name);
        console.log('   Clone URL:', result4.links.self[0]?.href);
    } catch (error) {
        console.log('❌ Repository create error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 5: Repository Update with Parameter Enhancement
    // ========================================================================
    console.log('✏️  Scenario 5: Repository Update with Parameter Enhancement');

    try {
        const result5 = await repositoryTools.repositoryUpdate({
            projectKey: 'DEMO',
            repositorySlug: 'demo-repo',
            description: 'Updated via enhanced repository tools',
            workspaceId: 'default', // Explicit workspace ID
        });
        console.log('✅ Repository updated:', result5.name);
        console.log('   New description:', result5.description);
    } catch (error) {
        console.log('❌ Repository update error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 6: Repository Delete (demonstration only)
    // ========================================================================
    console.log('🗑️  Scenario 6: Repository Delete (Mock Response)');

    try {
        const result6 = await repositoryTools.repositoryDelete({
            projectKey: 'DEMO',
            repositorySlug: 'old-demo-repo',
        });
        console.log('✅ Repository deletion response:', result6.message);
        console.log('   Success:', result6.success);
    } catch (error) {
        console.log('❌ Repository delete error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 7: Schema Registration and Validation
    // ========================================================================
    console.log('📝 Scenario 7: Schema Registration and Validation');

    // Check if schemas are registered
    const schemas = ['repository_list', 'repository_get', 'repository_create', 'repository_update', 'repository_delete'];

    schemas.forEach(toolName => {
        const schema = contextManager.getToolSchema(toolName);
        const supportsWorkspace = contextManager.supportsWorkspaceContext(toolName);
        console.log(`   ${toolName}: ${schema ? '✅' : '❌'} registered, workspace support: ${supportsWorkspace}`);
    });
    console.log();

    // ========================================================================
    // Scenario 8: Backward Compatibility Wrappers
    // ========================================================================
    console.log('🔒 Scenario 8: Backward Compatibility Wrappers');

    try {
        const wrappers = repositoryTools.createBackwardCompatibleWrappers();

        // Use original interface (no context needed)
        const originalResult = await wrappers.repository_list.original({
            projectKey: 'DEMO',
            limit: 3,
        });
        console.log('✅ Original wrapper result:', originalResult.repositories.length, 'repositories');

        // Use enhanced interface (with context)
        const enhancedContext = await contextManager.createContext('repository_list');
        const enhancedResult = await wrappers.repository_list.enhanced({
            projectKey: 'DEMO',
            limit: 3,
        }, enhancedContext);
        console.log('✅ Enhanced wrapper result:', enhancedResult.repositories.length, 'repositories');
    } catch (error) {
        console.log('❌ Wrapper demonstration error:', error instanceof Error ? error.message : error);
    }
    console.log();

    // ========================================================================
    // Scenario 9: Execution History and Context Tracking
    // ========================================================================
    console.log('📊 Scenario 9: Execution History and Context Tracking');

    const executionHistory = contextManager.getExecutionHistory(5);
    console.log(`   Execution history: ${executionHistory.length} entries`);

    const contextStack = contextManager.getContextStack();
    console.log(`   Context stack: ${contextStack.length} active contexts`);

    const activeContext = contextManager.getActiveContext();
    console.log(`   Active context: ${activeContext ? activeContext.toolName : 'none'}`);
    console.log();

    console.log('✅ Repository Tools demonstration complete!');
}

// ============================================================================
// Error Handling Example
// ============================================================================

async function demonstrateErrorHandling() {
    console.log('🚨 Demonstrating Error Handling\n');

    const { repositoryTools } = await setupRepositoryTools();

    // Test parameter validation
    console.log('📋 Testing Parameter Validation');
    try {
        await repositoryTools.repositoryGet({
            // Missing required projectKey and repositorySlug
        } as any);
    } catch (error) {
        console.log('✅ Expected validation error:', error instanceof Error ? error.message : error);
    }

    // Test workspace validation (if workspace validation was enabled)
    console.log('\n🏢 Testing Workspace Validation');
    try {
        await repositoryTools.repositoryList({
            projectKey: 'DEMO',
            workspaceId: 'non-existent-workspace',
        });
    } catch (error) {
        console.log('✅ Expected workspace error:', error instanceof Error ? error.message : error);
    }

    console.log('\n✅ Error handling demonstration complete!');
}

// ============================================================================
// Run Examples (commented out to prevent execution during imports)
// ============================================================================

/*
// Uncomment to run the demonstrations
Promise.all([
    demonstrateRepositoryTools(),
    demonstrateErrorHandling(),
]).catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
});
*/

export {
    demonstrateErrorHandling, demonstrateRepositoryTools, setupRepositoryTools
};
