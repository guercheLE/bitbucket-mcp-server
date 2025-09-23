/**
 * MCP Protocol Compliance Validator
 * 
 * This script validates that our MCP server implementation follows the
 * Model Context Protocol specification correctly by checking:
 * 
 * 1. Required MCP methods are implemented
 * 2. Message format follows JSON-RPC 2.0
 * 3. Error handling follows MCP specification
 * 4. Server capabilities are properly declared
 * 5. Tool registration follows MCP standards
 */

import { MCPServer } from '../../src/server/mcp-server.js';
import { ToolRegistry } from '../../src/server/tool-registry.js';
import { ProtocolMessageHandler } from '../../src/server/protocol-handler.js';
import { MCPErrorCode } from '../../src/types/index.js';

interface ComplianceResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class MCPComplianceValidator {
  private results: ComplianceResult[] = [];

  async validateCompliance(): Promise<ComplianceResult[]> {
    console.log('🔍 Starting MCP Protocol Compliance Validation...\n');

    // Test 1: Server Initialization
    await this.validateServerInitialization();

    // Test 2: Required MCP Methods
    await this.validateRequiredMethods();

    // Test 3: JSON-RPC 2.0 Compliance
    await this.validateJSONRPCCompliance();

    // Test 4: Error Handling
    await this.validateErrorHandling();

    // Test 5: Tool Registration
    await this.validateToolRegistration();

    // Test 6: Message Format
    await this.validateMessageFormat();

    // Test 7: Server Capabilities
    await this.validateServerCapabilities();

    return this.results;
  }

  private async validateServerInitialization(): Promise<void> {
    console.log('📋 Testing Server Initialization...');
    
    try {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
        maxClients: 10,
        clientTimeout: 30000,
        memoryLimit: 100 * 1024 * 1024, // 100MB
        logging: { level: 'info', console: true },
        transports: [{ type: 'stdio', timeout: 30000 }],
        tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
      });

      const isValid = await server.validateConfig();
      
      this.addResult('Server Initialization', isValid, 
        isValid ? 'Server initializes correctly' : 'Server initialization failed',
        { configValid: isValid }
      );
    } catch (error) {
      this.addResult('Server Initialization', false, 
        `Server initialization error: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateRequiredMethods(): Promise<void> {
    console.log('📋 Testing Required MCP Methods...');
    
    const requiredMethods = [
      'initialize',
      'tools/list',
      'tools/call',
      'ping'
    ];

    try {
      const messageHandler = new ProtocolMessageHandler({
        maxQueueSize: 1000,
        processingTimeout: 30000,
        enableBatchProcessing: true,
        enableNotifications: true
      });

      // Check if message handler can process required methods
      const supportedMethods = messageHandler.getSupportedMethods();
      
      const missingMethods = requiredMethods.filter(method => 
        !supportedMethods.includes(method)
      );

      this.addResult('Required MCP Methods', missingMethods.length === 0,
        missingMethods.length === 0 
          ? 'All required MCP methods are supported'
          : `Missing required methods: ${missingMethods.join(', ')}`,
        { 
          required: requiredMethods,
          supported: supportedMethods,
          missing: missingMethods
        }
      );
    } catch (error) {
      this.addResult('Required MCP Methods', false,
        `Error checking required methods: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateJSONRPCCompliance(): Promise<void> {
    console.log('📋 Testing JSON-RPC 2.0 Compliance...');
    
    try {
      const messageHandler = new ProtocolMessageHandler({
        maxQueueSize: 1000,
        processingTimeout: 30000,
        enableBatchProcessing: true,
        enableNotifications: true
      });

      // Test valid JSON-RPC 2.0 message
      const validMessage = {
        jsonrpc: '2.0',
        id: '1',
        method: 'ping',
        params: {}
      };

      const isValid = messageHandler.validateMessage(validMessage);
      
      this.addResult('JSON-RPC 2.0 Compliance', isValid,
        isValid ? 'Valid JSON-RPC 2.0 message format' : 'Invalid JSON-RPC 2.0 message format',
        { message: validMessage, valid: isValid }
      );
    } catch (error) {
      this.addResult('JSON-RPC 2.0 Compliance', false,
        `Error validating JSON-RPC compliance: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateErrorHandling(): Promise<void> {
    console.log('📋 Testing Error Handling...');
    
    try {
      // Test MCP error codes are properly defined
      const errorCodes = Object.values(MCPErrorCode).filter(value => 
        typeof value === 'number'
      );

      const requiredErrorCodes = [
        -32700, // PARSE_ERROR
        -32600, // INVALID_REQUEST
        -32601, // METHOD_NOT_FOUND
        -32602, // INVALID_PARAMS
        -32603, // INTERNAL_ERROR
        -32000, // INITIALIZATION_FAILED
        -32001, // TOOL_NOT_FOUND
        -32002, // TOOL_EXECUTION_FAILED
        -32003, // TRANSPORT_ERROR
        -32004, // SESSION_EXPIRED
        -32005, // RATE_LIMIT_EXCEEDED
        -32006, // AUTHENTICATION_FAILED
        -32007, // AUTHORIZATION_FAILED
        -32008, // RESOURCE_NOT_FOUND
        -32009, // CONCURRENT_OPERATION
        -32010  // MEMORY_LIMIT_EXCEEDED
      ];

      const missingErrorCodes = requiredErrorCodes.filter(code => 
        !errorCodes.includes(code)
      );

      this.addResult('Error Handling', missingErrorCodes.length === 0,
        missingErrorCodes.length === 0 
          ? 'All required MCP error codes are defined'
          : `Missing error codes: ${missingErrorCodes.join(', ')}`,
        { 
          required: requiredErrorCodes,
          defined: errorCodes,
          missing: missingErrorCodes
        }
      );
    } catch (error) {
      this.addResult('Error Handling', false,
        `Error validating error handling: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateToolRegistration(): Promise<void> {
    console.log('📋 Testing Tool Registration...');
    
    try {
      const toolRegistry = new ToolRegistry({
        validateParameters: true,
        trackStatistics: true,
        allowOverwrite: false,
        maxTools: 1000
      });

      // Test tool registration with valid tool
      const testTool = {
        name: 'test_tool',
        description: 'A test tool for validation',
        parameters: [
          {
            name: 'message',
            type: 'string' as const,
            description: 'Test message',
            required: true
          }
        ],
        enabled: true,
        async execute(params: any, context: any) {
          return {
            success: true,
            data: { message: params.message }
          };
        }
      };

      await toolRegistry.registerTool(testTool);
      const availableTools = toolRegistry.getAvailableTools();
      const isRegistered = availableTools.some(tool => tool.name === 'test_tool');

      this.addResult('Tool Registration', isRegistered,
        isRegistered ? 'Tool registration works correctly' : 'Tool registration failed',
        { 
          registeredTool: testTool.name,
          availableTools: availableTools.length,
          isRegistered
        }
      );
    } catch (error) {
      this.addResult('Tool Registration', false,
        `Error validating tool registration: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateMessageFormat(): Promise<void> {
    console.log('📋 Testing Message Format...');
    
    try {
      const messageHandler = new ProtocolMessageHandler({
        maxQueueSize: 1000,
        processingTimeout: 30000,
        enableBatchProcessing: true,
        enableNotifications: true
      });

      // Test various message formats
      const testMessages = [
        {
          name: 'Valid Request',
          message: {
            jsonrpc: '2.0',
            id: '1',
            method: 'ping',
            params: {}
          },
          shouldPass: true
        },
        {
          name: 'Valid Notification',
          message: {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {}
          },
          shouldPass: true
        },
        {
          name: 'Invalid JSON-RPC Version',
          message: {
            jsonrpc: '1.0',
            id: '1',
            method: 'ping',
            params: {}
          },
          shouldPass: false
        },
        {
          name: 'Missing Method',
          message: {
            jsonrpc: '2.0',
            id: '1',
            params: {}
          },
          shouldPass: false
        }
      ];

      let passedTests = 0;
      const results: any[] = [];

      for (const test of testMessages) {
        const isValid = messageHandler.validateMessage(test.message);
        const testPassed = isValid === test.shouldPass;
        
        if (testPassed) passedTests++;
        
        results.push({
          name: test.name,
          passed: testPassed,
          expected: test.shouldPass,
          actual: isValid
        });
      }

      this.addResult('Message Format', passedTests === testMessages.length,
        `${passedTests}/${testMessages.length} message format tests passed`,
        { testResults: results }
      );
    } catch (error) {
      this.addResult('Message Format', false,
        `Error validating message format: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateServerCapabilities(): Promise<void> {
    console.log('📋 Testing Server Capabilities...');
    
    try {
      const server = new MCPServer({
        name: 'test-server',
        version: '1.0.0',
        maxClients: 10,
        clientTimeout: 30000,
        memoryLimit: 100 * 1024 * 1024,
        logging: { level: 'info', console: true },
        transports: [{ type: 'stdio', timeout: 30000 }],
        tools: { autoRegister: true, selectiveLoading: true, validationEnabled: true }
      });

      const healthStatus = server.getHealthStatus();
      
      // Check if server has required capabilities
      const hasRequiredCapabilities = 
        healthStatus.components.server &&
        healthStatus.components.tools &&
        healthStatus.components.memory;

      this.addResult('Server Capabilities', hasRequiredCapabilities,
        hasRequiredCapabilities 
          ? 'Server has all required capabilities'
          : 'Server missing required capabilities',
        { 
          healthStatus,
          hasRequiredCapabilities
        }
      );
    } catch (error) {
      this.addResult('Server Capabilities', false,
        `Error validating server capabilities: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private addResult(test: string, passed: boolean, message: string, details?: any): void {
    this.results.push({
      test,
      passed,
      message,
      details
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
  }

  printSummary(): void {
    console.log('\n📊 MCP Protocol Compliance Summary:');
    console.log('=====================================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`\nOverall Compliance: ${passed}/${total} (${percentage}%)`);
    
    if (passed === total) {
      console.log('🎉 All compliance tests passed! Server is MCP compliant.');
    } else {
      console.log('⚠️  Some compliance tests failed. Review the details above.');
    }

    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
      if (result.details && !result.passed) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
  }
}

// Run the compliance validator
async function main() {
  const validator = new MCPComplianceValidator();
  const results = await validator.validateCompliance();
  validator.printSummary();
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Compliance validation failed:', error);
    process.exit(1);
  });
}

export { MCPComplianceValidator };
