/**
 * Context Management System Test
 * 
 * Basic test to ensure the context management system compiles and works correctly.
 */

import { WorkspaceContextProvider } from '../../src/workspace/context.js';
import { ToolIntegrationHelper, WorkspaceContextManager } from '../../src/workspace/context/index.js';
import { WorkspaceManager } from '../../src/workspace/manager.js';
import { FileWorkspaceStorage } from '../../src/workspace/storage.js';

describe('Context Management System', () => {
    let workspaceManager: WorkspaceManager;
    let contextProvider: WorkspaceContextProvider;
    let contextManager: WorkspaceContextManager;
    let integrationHelper: ToolIntegrationHelper;

    beforeEach(() => {
        const storage = new FileWorkspaceStorage({ storageDir: './test-data/workspaces' });
        workspaceManager = new WorkspaceManager(storage);
        contextProvider = new WorkspaceContextProvider(workspaceManager);
        contextManager = new WorkspaceContextManager(workspaceManager, contextProvider);
        integrationHelper = new ToolIntegrationHelper(contextManager);
    });

    describe('Context Manager', () => {
        it('should create context manager instance', () => {
            expect(contextManager).toBeInstanceOf(WorkspaceContextManager);
        });

        it('should create tool execution context', async () => {
            const context = await contextManager.createContext('test-tool');
            expect(context).toBeDefined();
            expect(context.toolName).toBe('test-tool');
            expect(context.requestId).toBeDefined();
        });
    });

    describe('Tool Integration Helper', () => {
        it('should create integration helper instance', () => {
            expect(integrationHelper).toBeInstanceOf(ToolIntegrationHelper);
        });

        it('should enhance tool schema with workspace support', () => {
            const originalSchema = {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: {
                    type: 'object' as const,
                    properties: {
                        param1: { type: 'string' },
                    },
                    required: ['param1'],
                },
            };

            const enhancedSchema = integrationHelper.enhanceToolSchema(originalSchema);
            expect(enhancedSchema.name).toBe('test-tool');
            expect(enhancedSchema.inputSchema.properties.workspaceId).toBeDefined();
            expect(enhancedSchema.workspaceIntegration).toBeDefined();
        });
    });
});