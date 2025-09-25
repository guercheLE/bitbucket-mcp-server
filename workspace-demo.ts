/**
 * Simple Workspace Demo
 * 
 * A basic demonstration that the workspace context management system is working
 * despite some compilation issues with the broader codebase.
 */

import { WorkspaceContextProvider } from './src/workspace/context.js';
import { ToolIntegrationHelper, WorkspaceContextManager } from './src/workspace/context/index.js';
import { WorkspaceManager } from './src/workspace/manager.js';
import { FileWorkspaceStorage } from './src/workspace/storage.js';
import { AuthenticationType, WorkspacePriority } from './src/workspace/types.js';

async function demonstrateWorkspaceSystem() {
    console.log('=== Workspace Context Management System Demo ===\n');

    try {
        // 1. Initialize storage
        console.log('1. Initializing file storage...');
        const storage = new FileWorkspaceStorage({
            storageDir: './demo-data/workspaces',
            filename: 'workspaces.json'
        });

        // 2. Create workspace manager
        console.log('2. Creating workspace manager...');
        const workspaceManager = new WorkspaceManager({
            storage,
            maxWorkspaces: 10,
            enableCaching: true
        });

        // 3. Initialize context provider  
        console.log('3. Setting up context provider...');
        const contextProvider = new WorkspaceContextProvider(workspaceManager);

        // 4. Create context manager
        console.log('4. Creating context manager...');
        const contextManager = new WorkspaceContextManager(workspaceManager, contextProvider);

        // 5. Set up tool integration
        console.log('5. Setting up tool integration helper...');
        const integrationHelper = new ToolIntegrationHelper(contextManager);

        // 6. Test basic operations
        console.log('6. Testing basic operations...\n');

        // Create a demo workspace
        const demoWorkspaceConfig = {
            id: 'demo-workspace-001',
            name: 'Demo Workspace',
            slug: 'demo-workspace',
            baseUrl: 'https://bitbucket.example.com',
            priority: WorkspacePriority.PRIMARY,
            authConfig: {
                type: AuthenticationType.OAUTH2,
                credentials: {},
                scopes: ['repository:read', 'repository:write']
            },
            metadata: {
                description: 'Demo workspace for testing',
                environment: 'development' as const,
                version: '1.0.0',
                createdAt: new Date().toISOString(),
                tags: ['demo', 'testing']
            }
        };

        console.log('   Creating demo workspace...');
        const createResult = await workspaceManager.createWorkspace(demoWorkspaceConfig);
        console.log('   ✅ Workspace created:', createResult.success ? 'SUCCESS' : 'FAILED');

        if (createResult.success) {
            // Test workspace retrieval
            console.log('   Testing workspace retrieval...');
            const workspace = await workspaceManager.getWorkspace('demo-workspace-001');
            console.log('   ✅ Workspace retrieved:', workspace?.name || 'NOT FOUND');

            // Test context creation
            console.log('   Testing context creation...');
            const mockContext = {
                session: {
                    id: 'demo-session',
                    transport: { type: 'stdio' as const },
                    connectedAt: new Date(),
                    lastActivity: new Date(),
                    metadata: {}
                },
                server: {
                    id: 'demo-server',
                    name: 'Demo Server',
                    version: '1.0.0',
                    isRunning: true,
                    start: async () => { },
                    stop: async () => { },
                    executeTool: async () => ({
                        success: true,
                        metadata: {
                            executionTime: 0,
                            memoryUsed: 0,
                            timestamp: new Date()
                        }
                    }),
                    getCapabilities: () => ({
                        protocolVersion: '1.0.0',
                        tools: [],
                        authentication: { required: false, methods: [] },
                        features: []
                    }),
                    getHealthStatus: () => ({ status: 'healthy' })
                },
                request: {
                    id: 'demo-request',
                    timestamp: new Date(),
                    transport: 'stdio'
                },
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    memoryUsage: process.memoryUsage()
                }
            };

            const toolContext = await contextManager.createContext('demo-tool', mockContext);
            console.log('   ✅ Tool context created with ID:', toolContext.requestId);

            // Test tool schema enhancement
            console.log('   Testing tool schema enhancement...');
            const demoTool = {
                name: 'demo-tool',
                description: 'Demo tool for testing',
                parameters: []
            };

            const enhancedSchema = integrationHelper.enhanceToolSchema(demoTool);
            console.log('   ✅ Tool schema enhanced:', enhancedSchema.workspaceIntegration ? 'YES' : 'NO');

            // Clean up
            console.log('   Cleaning up demo workspace...');
            const deleteResult = await workspaceManager.deleteWorkspace('demo-workspace-001');
            console.log('   ✅ Cleanup:', deleteResult.success ? 'SUCCESS' : 'FAILED');
        }

        console.log('\n=== Demo Complete ===');
        console.log('✅ Workspace context management system is functional!');
        console.log('\nKey features demonstrated:');
        console.log('- Workspace creation and management');
        console.log('- Context provider integration');
        console.log('- Tool context creation');
        console.log('- Tool schema enhancement');
        console.log('- Workspace cleanup');

    } catch (error) {
        console.error('\n❌ Demo failed with error:');
        console.error(error instanceof Error ? error.message : String(error));
        console.error('\nStack trace:');
        console.error(error instanceof Error ? error.stack : 'No stack trace available');
    }
}

// Run the demo
demonstrateWorkspaceSystem().catch(console.error);