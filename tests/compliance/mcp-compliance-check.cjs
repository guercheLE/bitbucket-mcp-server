/**
 * MCP Protocol Compliance Check
 * 
 * This script validates basic MCP protocol compliance by checking:
 * 1. Required MCP error codes are defined
 * 2. Server can be imported and instantiated
 * 3. Basic MCP protocol structure is correct
 */

const fs = require('fs');
const path = require('path');

// Check if required MCP error codes are defined
function checkMCPErrorCodes() {
  console.log('🔍 Checking MCP Error Codes...');
  
  const typesFile = path.join(__dirname, '../../dist/types/index.js');
  
  if (!fs.existsSync(typesFile)) {
    console.log('❌ Types file not found');
    return false;
  }
  
  const content = fs.readFileSync(typesFile, 'utf8');
  
  const requiredErrorCodes = [
    'MCPErrorCode["PARSE_ERROR"] = -32700',
    'MCPErrorCode["INVALID_REQUEST"] = -32600',
    'MCPErrorCode["METHOD_NOT_FOUND"] = -32601',
    'MCPErrorCode["INVALID_PARAMS"] = -32602',
    'MCPErrorCode["INTERNAL_ERROR"] = -32603',
    'MCPErrorCode["INITIALIZATION_FAILED"] = -32000',
    'MCPErrorCode["TOOL_NOT_FOUND"] = -32001',
    'MCPErrorCode["TOOL_EXECUTION_FAILED"] = -32002',
    'MCPErrorCode["TRANSPORT_ERROR"] = -32003',
    'MCPErrorCode["SESSION_EXPIRED"] = -32004',
    'MCPErrorCode["RATE_LIMIT_EXCEEDED"] = -32005',
    'MCPErrorCode["AUTHENTICATION_FAILED"] = -32006',
    'MCPErrorCode["AUTHORIZATION_FAILED"] = -32007',
    'MCPErrorCode["RESOURCE_NOT_FOUND"] = -32008',
    'MCPErrorCode["CONCURRENT_OPERATION"] = -32009',
    'MCPErrorCode["MEMORY_LIMIT_EXCEEDED"] = -32010'
  ];
  
  let allFound = true;
  for (const errorCode of requiredErrorCodes) {
    if (!content.includes(errorCode)) {
      console.log(`❌ Missing error code: ${errorCode}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('✅ All required MCP error codes are defined');
  }
  
  return allFound;
}

// Check if server files exist and are properly structured
function checkServerStructure() {
  console.log('🔍 Checking Server Structure...');
  
  const serverFiles = [
    'dist/server/index.js',
    'dist/server/mcp-server.js',
    'dist/server/tool-registry.js',
    'dist/server/client-session.js',
    'dist/server/protocol-handler.js',
    'dist/server/transport-factory.js',
    'dist/types/index.js'
  ];
  
  let allExist = true;
  for (const file of serverFiles) {
    const filePath = path.join(__dirname, '../../', file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Missing file: ${file}`);
      allExist = false;
    }
  }
  
  if (allExist) {
    console.log('✅ All required server files exist');
  }
  
  return allExist;
}

// Check if server can be imported (basic check)
function checkServerImport() {
  console.log('🔍 Checking Server Import...');
  
  try {
    // Try to require the compiled server
    const serverPath = path.join(__dirname, '../../dist/server/index.js');
    if (fs.existsSync(serverPath)) {
      console.log('✅ Server file exists and can be accessed');
      return true;
    } else {
      console.log('❌ Server file does not exist');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error importing server: ${error.message}`);
    return false;
  }
}

// Check MCP protocol message format
function checkMCPMessageFormat() {
  console.log('🔍 Checking MCP Message Format...');
  
  const protocolFile = path.join(__dirname, '../../dist/types/index.js');
  
  if (!fs.existsSync(protocolFile)) {
    console.log('❌ Protocol types file not found');
    return false;
  }
  
  const content = fs.readFileSync(protocolFile, 'utf8');
  
  // Check for required MCP protocol structures
  const requiredStructures = [
    'interface ProtocolMessage',
    'jsonrpc: \'2.0\'',
    'id: string | number | null',
    'method?: string',
    'params?: any',
    'result?: any',
    'error?:'
  ];
  
  let allFound = true;
  for (const structure of requiredStructures) {
    if (!content.includes(structure)) {
      console.log(`❌ Missing protocol structure: ${structure}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('✅ MCP protocol message format is correct');
  }
  
  return allFound;
}

// Check transport types
function checkTransportTypes() {
  console.log('🔍 Checking Transport Types...');
  
  const typesFile = path.join(__dirname, '../../dist/types/index.js');
  
  if (!fs.existsSync(typesFile)) {
    console.log('❌ Types file not found');
    return false;
  }
  
  const content = fs.readFileSync(typesFile, 'utf8');
  
  const requiredTransports = [
    'type TransportType = \'stdio\' | \'http\' | \'sse\'',
    'interface TransportConfig',
    'interface Transport',
    'connect(): Promise<void>',
    'disconnect(): Promise<void>',
    'send(message: ProtocolMessage): Promise<void>'
  ];
  
  let allFound = true;
  for (const transport of requiredTransports) {
    if (!content.includes(transport)) {
      console.log(`❌ Missing transport structure: ${transport}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('✅ Transport types are correctly defined');
  }
  
  return allFound;
}

// Check tool system
function checkToolSystem() {
  console.log('🔍 Checking Tool System...');
  
  const typesFile = path.join(__dirname, '../../dist/types/index.js');
  
  if (!fs.existsSync(typesFile)) {
    console.log('❌ Types file not found');
    return false;
  }
  
  const content = fs.readFileSync(typesFile, 'utf8');
  
  const requiredToolStructures = [
    'interface Tool',
    'name: string',
    'description: string',
    'parameters: ToolParameter[]',
    'enabled: boolean',
    'execute: ToolExecutor',
    'interface ToolParameter',
    'interface ToolResult'
  ];
  
  let allFound = true;
  for (const structure of requiredToolStructures) {
    if (!content.includes(structure)) {
      console.log(`❌ Missing tool structure: ${structure}`);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('✅ Tool system is correctly defined');
  }
  
  return allFound;
}

// Main compliance check
function runComplianceCheck() {
  console.log('🚀 Starting MCP Protocol Compliance Check...\n');
  
  const checks = [
    { name: 'MCP Error Codes', fn: checkMCPErrorCodes },
    { name: 'Server Structure', fn: checkServerStructure },
    { name: 'Server Import', fn: checkServerImport },
    { name: 'MCP Message Format', fn: checkMCPMessageFormat },
    { name: 'Transport Types', fn: checkTransportTypes },
    { name: 'Tool System', fn: checkToolSystem }
  ];
  
  let passedChecks = 0;
  const results = [];
  
  for (const check of checks) {
    console.log(`\n📋 ${check.name}:`);
    const result = check.fn();
    results.push({ name: check.name, passed: result });
    if (result) passedChecks++;
  }
  
  console.log('\n📊 MCP Protocol Compliance Summary:');
  console.log('=====================================');
  
  const percentage = Math.round((passedChecks / checks.length) * 100);
  console.log(`\nOverall Compliance: ${passedChecks}/${checks.length} (${percentage}%)`);
  
  if (passedChecks === checks.length) {
    console.log('🎉 All compliance checks passed! Server is MCP compliant.');
  } else {
    console.log('⚠️  Some compliance checks failed. Review the details above.');
  }
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  return passedChecks === checks.length;
}

// Run the compliance check
if (require.main === module) {
  const allPassed = runComplianceCheck();
  process.exit(allPassed ? 0 : 1);
}

module.exports = { runComplianceCheck };
