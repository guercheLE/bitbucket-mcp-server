#!/usr/bin/env node

/**
 * Constitution Compliance Validation Script
 * Validates that the project follows all constitutional requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
};

function validateArticle(article, description, validator) {
  logInfo(`Validating ${article}: ${description}`);
  results.total++;
  
  try {
    const result = validator();
    if (result.passed) {
      logSuccess(`${article}: ${result.message}`);
      results.passed++;
    } else {
      logError(`${article}: ${result.message}`);
      results.failed++;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        logWarning(`${article}: ${warning}`);
        results.warnings++;
      });
    }
  } catch (error) {
    logError(`${article}: Validation failed - ${error.message}`);
    results.failed++;
  }
  
  console.log('');
}

// Article I: MCP Protocol First
function validateArticleI() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const mcpSdkVersion = packageJson.dependencies['@modelcontextprotocol/sdk'];
  
  if (!mcpSdkVersion) {
    return {
      passed: false,
      message: 'MCP SDK not found in dependencies',
    };
  }
  
  // Check if using official SDK
  if (!mcpSdkVersion.startsWith('^')) {
    return {
      passed: false,
      message: 'MCP SDK version should use caret (^) for official releases',
    };
  }
  
  // Check for unofficial MCP packages
  const unofficialPackages = Object.keys(packageJson.dependencies).filter(dep => 
    dep.includes('mcp') && dep !== '@modelcontextprotocol/sdk'
  );
  
  if (unofficialPackages.length > 0) {
    return {
      passed: false,
      message: `Unofficial MCP packages found: ${unofficialPackages.join(', ')}`,
    };
  }
  
  return {
    passed: true,
    message: `MCP SDK ${mcpSdkVersion} is properly configured`,
  };
}

// Article II: Multi-Transport Protocol
function validateArticleII() {
  const transportFiles = [
    'src/server/transports/stdio.ts',
    'src/server/transports/http.ts',
    'src/server/transports/sse.ts',
    'src/server/transports/streaming.ts',
    'src/server/transports/manager.ts',
  ];
  
  const missingFiles = transportFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    return {
      passed: false,
      message: `Missing transport files: ${missingFiles.join(', ')}`,
    };
  }
  
  // Check if transport manager exists
  if (!fs.existsSync('src/server/transports/manager.ts')) {
    return {
      passed: false,
      message: 'Transport manager not found',
    };
  }
  
  return {
    passed: true,
    message: 'Multi-transport protocol support is implemented',
  };
}

// Article III: Selective Tool Registration
function validateArticleIII() {
  // Check for server detection
  if (!fs.existsSync('src/services/server-detection.ts')) {
    return {
      passed: false,
      message: 'Server detection service not found',
    };
  }
  
  // Check for tool directories
  const toolDirs = [
    'src/tools/cloud',
    'src/tools/datacenter',
    'src/tools/shared',
  ];
  
  const missingDirs = toolDirs.filter(dir => !fs.existsSync(dir));
  
  if (missingDirs.length > 0) {
    return {
      passed: false,
      message: `Missing tool directories: ${missingDirs.join(', ')}`,
    };
  }
  
  return {
    passed: true,
    message: 'Selective tool registration structure is in place',
  };
}

// Article IV: Complete API Coverage
function validateArticleIV() {
  // Check for comprehensive type definitions
  if (!fs.existsSync('src/types/index.ts')) {
    return {
      passed: false,
      message: 'Type definitions not found',
    };
  }
  
  const typesContent = fs.readFileSync('src/types/index.ts', 'utf8');
  
  // Check for key Bitbucket API types
  const requiredTypes = [
    'BitbucketRepository',
    'BitbucketPullRequest',
    'BitbucketIssue',
    'Project',
  ];
  
  const missingTypes = requiredTypes.filter(type => !typesContent.includes(type));
  
  if (missingTypes.length > 0) {
    return {
      passed: false,
      message: `Missing API types: ${missingTypes.join(', ')}`,
    };
  }
  
  return {
    passed: true,
    message: 'API coverage types are defined',
  };
}

// Article V: Test-First Development
function validateArticleV() {
  // Check for test configuration
  if (!fs.existsSync('jest.config.js')) {
    return {
      passed: false,
      message: 'Jest configuration not found',
    };
  }
  
  // Check for test directories
  const testDirs = [
    'tests/unit',
    'tests/integration',
    'tests/contract',
  ];
  
  const missingDirs = testDirs.filter(dir => !fs.existsSync(dir));
  
  if (missingDirs.length > 0) {
    return {
      passed: false,
      message: `Missing test directories: ${missingDirs.join(', ')}`,
    };
  }
  
  // Check for test files
  const testFiles = [
    'tests/unit/server.test.ts',
    'tests/unit/authentication.test.ts',
    'tests/unit/server-detection.test.ts',
    'tests/integration/cli.test.ts',
    'tests/contract/project-initialization.test.ts',
  ];
  
  const missingFiles = testFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    return {
      passed: false,
      message: `Missing test files: ${missingFiles.join(', ')}`,
    };
  }
  
  // Check Jest configuration for coverage threshold
  const jestConfig = require('../jest.config.js');
  if (!jestConfig.coverageThreshold || !jestConfig.coverageThreshold.global) {
    return {
      passed: false,
      message: 'Coverage threshold not configured in Jest',
    };
  }
  
  const coverageThreshold = jestConfig.coverageThreshold.global;
  if (coverageThreshold.lines < 80 || coverageThreshold.functions < 80 || 
      coverageThreshold.branches < 80 || coverageThreshold.statements < 80) {
    return {
      passed: false,
      message: 'Coverage threshold must be at least 80% for all criteria',
    };
  }
  
  return {
    passed: true,
    message: 'TDD configuration is compliant with Article V',
  };
}

// Article VI: Versioning
function validateArticleVI() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check version format
  if (!packageJson.version || !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
    return {
      passed: false,
      message: 'Version must follow semantic versioning (x.y.z)',
    };
  }
  
  // Check for version scripts
  const scripts = packageJson.scripts || {};
  if (!scripts.version) {
    return {
      passed: false,
      message: 'Version script not found in package.json',
    };
  }
  
  return {
    passed: true,
    message: `Versioning is properly configured (v${packageJson.version})`,
  };
}

// Article VII: Simplicity
function validateArticleVII() {
  // Check for configuration files
  const configFiles = [
    'tsconfig.json',
    '.eslintrc.js',
    '.prettierrc',
    'env.example',
  ];
  
  const missingFiles = configFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    return {
      passed: false,
      message: `Missing configuration files: ${missingFiles.join(', ')}`,
    };
  }
  
  // Check TypeScript configuration for strict mode
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (!tsConfig.compilerOptions.strict) {
    return {
      passed: false,
      message: 'TypeScript strict mode is not enabled',
    };
  }
  
  // Check for logging and performance utilities
  const utilityFiles = [
    'src/utils/logger.ts',
    'src/utils/performance.ts',
    'src/services/cache.ts',
  ];
  
  const missingUtils = utilityFiles.filter(file => !fs.existsSync(file));
  
  if (missingUtils.length > 0) {
    return {
      passed: false,
      message: `Missing utility files: ${missingUtils.join(', ')}`,
    };
  }
  
  return {
    passed: true,
    message: 'Simplicity and organization are maintained',
  };
}

// Main validation function
function main() {
  log('📜 Bitbucket MCP Server Constitution Compliance Validation', colors.bright);
  log('=' .repeat(60), colors.cyan);
  console.log('');
  
  // Validate all articles
  validateArticle('Article I', 'MCP Protocol First', validateArticleI);
  validateArticle('Article II', 'Multi-Transport Protocol', validateArticleII);
  validateArticle('Article III', 'Selective Tool Registration', validateArticleIII);
  validateArticle('Article IV', 'Complete API Coverage', validateArticleIV);
  validateArticle('Article V', 'Test-First Development', validateArticleV);
  validateArticle('Article VI', 'Versioning', validateArticleVI);
  validateArticle('Article VII', 'Simplicity', validateArticleVII);
  
  // Summary
  log('📊 Validation Summary', colors.bright);
  log('=' .repeat(30), colors.cyan);
  logSuccess(`Passed: ${results.passed}/${results.total}`);
  
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}/${results.total}`);
  }
  
  if (results.warnings > 0) {
    logWarning(`Warnings: ${results.warnings}`);
  }
  
  console.log('');
  
  if (results.failed === 0) {
    log('🎉 All constitutional requirements are met!', colors.green);
    process.exit(0);
  } else {
    log('💥 Constitution compliance validation failed!', colors.red);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = {
  validateArticleI,
  validateArticleII,
  validateArticleIII,
  validateArticleIV,
  validateArticleV,
  validateArticleVI,
  validateArticleVII,
};
