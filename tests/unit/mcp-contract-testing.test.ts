/**
 * Test file for MCP Contract Testing Framework
 * Validates that our contract testing utilities work correctly
 */

import { describe, expect, test } from '@jest/globals';
import {
    ContractTestSuite,
    ContractTestUtils,
    MCPContractValidator
} from '../utils/mcp-contract-testing';

describe('MCP Contract Testing Framework', () => {

    describe('ContractTestUtils', () => {
        test('should create standard contract test configuration', () => {
            const config = ContractTestUtils.createStandardConfig();

            expect(config.serverName).toBe('bitbucket-mcp-server');
            expect(config.serverVersion).toBe('1.0.0');
            expect(config.protocolVersion).toBe('2024-11-05');
            expect(config.capabilities.tools).toBe(true);
            expect(config.timeout).toBe(5000);
        });

        test('should create configuration with overrides', () => {
            const config = ContractTestUtils.createStandardConfig({
                serverName: 'custom-server',
                timeout: 10000,
                capabilities: {
                    tools: false,
                    resources: true
                }
            });

            expect(config.serverName).toBe('custom-server');
            expect(config.timeout).toBe(10000);
            expect(config.capabilities.tools).toBe(false);
            expect(config.capabilities.resources).toBe(true);
        });

        test('should create test expectations based on capabilities', () => {
            const config = {
                serverName: 'test-server',
                serverVersion: '1.0.0',
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: true,
                    resources: true,
                    prompts: false
                }
            };

            const expectations = ContractTestUtils.createTestExpectations(config);

            expect(expectations).toContain('initialization_contract');
            expect(expectations).toContain('capabilities_contract');
            expect(expectations).toContain('tools_contract');
            expect(expectations).toContain('resources_contract');
            expect(expectations).toContain('error_handling_contract');
            expect(expectations).toContain('shutdown_contract');
            expect(expectations).not.toContain('prompts_contract');
        });
    });

    describe('MCPContractValidator', () => {
        test('should create validator with configuration', () => {
            const config = ContractTestUtils.createStandardConfig();
            const validator = new MCPContractValidator(config);

            expect(validator).toBeDefined();
        });
    });

    describe('ContractTestSuite', () => {
        test('should create test suite with configuration', () => {
            const config = ContractTestUtils.createStandardConfig();
            const suite = new ContractTestSuite(config);

            expect(suite).toBeDefined();
        });

        test('should generate readable test report', () => {
            const config = ContractTestUtils.createStandardConfig();
            const suite = new ContractTestSuite(config);

            const mockResults = [
                {
                    testName: 'initialization_contract',
                    passed: true,
                    duration: 50
                },
                {
                    testName: 'tools_contract',
                    passed: false,
                    error: 'Tool validation failed',
                    duration: 75
                }
            ];

            const report = suite.generateReport(mockResults);

            expect(report).toContain('MCP Contract Test Report');
            expect(report).toContain('Total Tests: 2');
            expect(report).toContain('Passed: 1');
            expect(report).toContain('Failed: 1');
            expect(report).toContain('Success Rate: 50.00%');
            expect(report).toContain('initialization_contract: PASS');
            expect(report).toContain('tools_contract: FAIL');
            expect(report).toContain('Tool validation failed');
        });
    });

    describe('Integration Tests', () => {
        test('should handle different capability configurations', () => {
            const toolsOnlyConfig = ContractTestUtils.createStandardConfig({
                capabilities: {
                    tools: true,
                    resources: false,
                    prompts: false
                }
            });

            const allCapabilitiesConfig = ContractTestUtils.createStandardConfig({
                capabilities: {
                    tools: true,
                    resources: true,
                    prompts: true,
                    logging: true
                }
            });

            expect(toolsOnlyConfig.capabilities.tools).toBe(true);
            expect(toolsOnlyConfig.capabilities.resources).toBe(false);

            expect(allCapabilitiesConfig.capabilities.tools).toBe(true);
            expect(allCapabilitiesConfig.capabilities.resources).toBe(true);
            expect(allCapabilitiesConfig.capabilities.prompts).toBe(true);
            expect(allCapabilitiesConfig.capabilities.logging).toBe(true);
        });
    });
});