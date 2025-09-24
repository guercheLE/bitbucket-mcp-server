/**
 * MCP Test Fixtures
 * 
 * Common test fixtures for MCP protocol testing
 */

/**
 * Standard MCP tool definitions for testing
 */
export const MCPToolFixtures = {
    /**
     * Basic repository management tools
     */
    repositoryTools: [
        {
            name: 'bitbucket_list_repositories',
            description: 'List repositories accessible to the authenticated user',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug to filter repositories'
                    },
                    role: {
                        type: 'string',
                        enum: ['admin', 'contributor', 'member'],
                        description: 'Filter by user role'
                    }
                }
            }
        },
        {
            name: 'bitbucket_get_repository',
            description: 'Get detailed information about a specific repository',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository slug'
                    }
                },
                required: ['workspace', 'repository']
            }
        },
        {
            name: 'bitbucket_create_repository',
            description: 'Create a new repository',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug'
                    },
                    name: {
                        type: 'string',
                        description: 'Repository name'
                    },
                    description: {
                        type: 'string',
                        description: 'Repository description'
                    },
                    is_private: {
                        type: 'boolean',
                        description: 'Whether the repository is private'
                    }
                },
                required: ['workspace', 'name']
            }
        }
    ],

    /**
     * Pull request management tools
     */
    pullRequestTools: [
        {
            name: 'bitbucket_list_pull_requests',
            description: 'List pull requests for a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository slug'
                    },
                    state: {
                        type: 'string',
                        enum: ['OPEN', 'MERGED', 'DECLINED'],
                        description: 'Filter by pull request state'
                    }
                },
                required: ['workspace', 'repository']
            }
        },
        {
            name: 'bitbucket_create_pull_request',
            description: 'Create a new pull request',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository slug'
                    },
                    title: {
                        type: 'string',
                        description: 'Pull request title'
                    },
                    description: {
                        type: 'string',
                        description: 'Pull request description'
                    },
                    source_branch: {
                        type: 'string',
                        description: 'Source branch name'
                    },
                    destination_branch: {
                        type: 'string',
                        description: 'Destination branch name'
                    }
                },
                required: ['workspace', 'repository', 'title', 'source_branch', 'destination_branch']
            }
        }
    ],

    /**
     * Issue tracking tools
     */
    issueTools: [
        {
            name: 'bitbucket_list_issues',
            description: 'List issues for a repository',
            inputSchema: {
                type: 'object',
                properties: {
                    workspace: {
                        type: 'string',
                        description: 'Workspace slug'
                    },
                    repository: {
                        type: 'string',
                        description: 'Repository slug'
                    },
                    state: {
                        type: 'string',
                        enum: ['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'],
                        description: 'Filter by issue state'
                    }
                },
                required: ['workspace', 'repository']
            }
        }
    ]
};

/**
 * MCP Server Capability Fixtures
 */
export const MCPCapabilityFixtures = {
    /**
     * Basic server capabilities
     */
    basicCapabilities: {
        tools: {
            listChanged: true
        },
        resources: {
            subscribe: false,
            listChanged: false
        },
        prompts: {
            listChanged: false
        }
    },

    /**
     * Advanced server capabilities
     */
    advancedCapabilities: {
        tools: {
            listChanged: true
        },
        resources: {
            subscribe: true,
            listChanged: true
        },
        prompts: {
            listChanged: true
        },
        logging: {}
    }
};

/**
 * MCP Client Info Fixtures
 */
export const MCPClientFixtures = {
    vscode: {
        name: 'Visual Studio Code',
        version: '1.85.0'
    },

    cursor: {
        name: 'Cursor',
        version: '0.42.0'
    },

    testClient: {
        name: 'Test Client',
        version: '1.0.0'
    }
};

/**
 * MCP Server Info Fixtures
 */
export const MCPServerFixtures = {
    bitbucket: {
        name: 'bitbucket-mcp-server',
        version: '1.0.0'
    }
};

/**
 * Common MCP Protocol Scenarios
 */
export class MCPScenarioFixtures {
    /**
     * Complete initialization handshake
     */
    static getInitializationScenario() {
        const requestId = 'init_001';

        return {
            request: {
                jsonrpc: '2.0',
                id: requestId,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    clientInfo: MCPClientFixtures.vscode,
                    capabilities: {
                        roots: {
                            listChanged: true
                        },
                        sampling: {}
                    }
                }
            },
            response: {
                jsonrpc: '2.0',
                id: requestId,
                result: {
                    protocolVersion: '2024-11-05',
                    serverInfo: MCPServerFixtures.bitbucket,
                    capabilities: MCPCapabilityFixtures.basicCapabilities
                }
            },
            notification: {
                jsonrpc: '2.0',
                method: 'notifications/initialized'
            }
        };
    }

    /**
     * Tool listing scenario
     */
    static getToolListingScenario() {
        const requestId = 'tools_001';

        return {
            request: {
                jsonrpc: '2.0',
                id: requestId,
                method: 'tools/list'
            },
            response: {
                jsonrpc: '2.0',
                id: requestId,
                result: {
                    tools: [
                        ...MCPToolFixtures.repositoryTools,
                        ...MCPToolFixtures.pullRequestTools,
                        ...MCPToolFixtures.issueTools
                    ]
                }
            }
        };
    }

    /**
     * Tool execution scenario
     */
    static getToolExecutionScenario(toolName: string = 'bitbucket_list_repositories') {
        const requestId = 'tool_001';

        return {
            request: {
                jsonrpc: '2.0',
                id: requestId,
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: {
                        workspace: 'test-workspace'
                    }
                }
            },
            response: {
                jsonrpc: '2.0',
                id: requestId,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: 'Found 3 repositories in workspace test-workspace'
                        }
                    ],
                    isError: false
                }
            }
        };
    }

    /**
     * Error scenario
     */
    static getErrorScenario(code: number = -32602, message: string = 'Invalid params') {
        const requestId = 'error_001';

        return {
            request: {
                jsonrpc: '2.0',
                id: requestId,
                method: 'tools/call',
                params: {
                    name: 'invalid_tool'
                }
            },
            response: {
                jsonrpc: '2.0',
                id: requestId,
                error: {
                    code,
                    message,
                    data: {
                        toolName: 'invalid_tool'
                    }
                }
            }
        };
    }

    /**
     * Authentication required scenario
     */
    static getAuthRequiredScenario() {
        const requestId = 'auth_001';

        return {
            request: {
                jsonrpc: '2.0',
                id: requestId,
                method: 'tools/call',
                params: {
                    name: 'bitbucket_list_repositories',
                    arguments: {}
                }
            },
            response: {
                jsonrpc: '2.0',
                id: requestId,
                error: {
                    code: -32001,
                    message: 'Authentication required',
                    data: {
                        authUrl: 'https://bitbucket.org/oauth/authorize',
                        requiresAuth: true
                    }
                }
            }
        };
    }
}

export default {
    MCPToolFixtures,
    MCPCapabilityFixtures,
    MCPClientFixtures,
    MCPServerFixtures,
    MCPScenarioFixtures
};