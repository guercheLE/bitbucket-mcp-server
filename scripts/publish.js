#!/usr/bin/env node

/**
 * Publication script for Bitbucket MCP Server.
 * 
 * This script handles the publication process to NPM, including
 * test publication and production publication.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  log(`🔧 ${description}...`, 'cyan');
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    log(`   Command: ${command}`, 'yellow');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironment() {
  log('🔍 Checking environment...', 'cyan');
  
  const requiredTools = ['node', 'npm'];
  const missingTools = [];
  
  for (const tool of requiredTools) {
    try {
      execSync(`${tool} --version`, { stdio: 'pipe' });
    } catch (error) {
      missingTools.push(tool);
    }
  }
  
  if (missingTools.length > 0) {
    log(`❌ Missing required tools: ${missingTools.join(', ')}`, 'red');
    log('Please install Node.js and npm', 'yellow');
    return false;
  }
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found in current directory', 'red');
    return false;
  }
  
  log('✅ Environment check passed', 'green');
  return true;
}

function cleanBuild() {
  log('🧹 Cleaning previous builds...', 'cyan');
  
  const dirsToClean = ['dist', 'node_modules/.cache'];
  
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        log(`   Cleaned ${dir}`, 'yellow');
      } catch (error) {
        log(`   Warning: Could not clean ${dir}: ${error.message}`, 'yellow');
      }
    }
  }
  
  log('✅ Clean completed', 'green');
  return true;
}

function installDependencies() {
  log('📦 Installing dependencies...', 'cyan');
  
  if (!runCommand('npm ci', 'Dependency installation')) {
    log('   Trying npm install as fallback...', 'yellow');
    if (!runCommand('npm install', 'Dependency installation (fallback)')) {
      return false;
    }
  }
  
  return true;
}

function runTests() {
  log('🧪 Running tests...', 'cyan');
  
  if (!runCommand('npm test', 'Test execution')) {
    log('❌ Tests failed. Aborting publication.', 'red');
    return false;
  }
  
  return true;
}

function buildPackage() {
  log('🔨 Building package...', 'cyan');
  
  if (!runCommand('npm run build', 'Package build')) {
    return false;
  }
  
  // Check if dist directory was created
  if (!fs.existsSync('dist')) {
    log('❌ Build failed: dist directory not found', 'red');
    return false;
  }
  
  log('✅ Package built successfully', 'green');
  return true;
}

function verifyPackage() {
  log('🔍 Verifying package...', 'cyan');
  
  // Check package with npm pack
  if (!runCommand('npm pack --dry-run', 'Package verification')) {
    return false;
  }
  
  // Check if package.json has required fields
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredFields = ['name', 'version', 'description', 'main'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    log(`❌ Missing required fields in package.json: ${missingFields.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ Package verification passed', 'green');
  return true;
}

function publishToNPM(tag = 'latest') {
  log(`🚀 Publishing to NPM with tag: ${tag}...`, 'cyan');
  
  // Check if NPM_TOKEN is set
  if (!process.env.NPM_TOKEN) {
    log('❌ NPM_TOKEN environment variable not set', 'red');
    log('Set it with: export NPM_TOKEN=your-token', 'yellow');
    log('Or login with: npm login', 'yellow');
    return false;
  }
  
  // Publish to NPM
  const publishCommand = tag === 'latest' ? 'npm publish' : `npm publish --tag ${tag}`;
  
  if (!runCommand(publishCommand, `NPM publication (${tag})`)) {
    return false;
  }
  
  log(`✅ Published to NPM successfully with tag: ${tag}`, 'green');
  
  if (tag === 'beta') {
    log('🔗 Test installation: npm install bitbucket-mcp-server@beta', 'blue');
  } else {
    log('🔗 Installation: npm install bitbucket-mcp-server', 'blue');
  }
  
  return true;
}

function showHelp() {
  log('📚 Bitbucket MCP Server - NPM Publication Script', 'bright');
  log('=' .repeat(60), 'cyan');
  log('');
  log('Usage: node scripts/publish.js [options]', 'yellow');
  log('');
  log('Options:', 'bright');
  log('  --test        Publish to NPM with beta tag', 'green');
  log('  --production  Publish to NPM with latest tag', 'green');
  log('  --skip-build  Skip build step', 'yellow');
  log('  --skip-test   Skip test execution', 'yellow');
  log('  --skip-clean  Skip clean step', 'yellow');
  log('  --help        Show this help message', 'yellow');
  log('');
  log('Examples:', 'bright');
  log('  node scripts/publish.js --test', 'green');
  log('  node scripts/publish.js --production', 'green');
  log('  node scripts/publish.js --production --skip-test', 'green');
  log('');
  log('Environment Variables:', 'bright');
  log('  NPM_TOKEN     NPM authentication token', 'yellow');
  log('');
}

function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const options = {
    test: args.includes('--test'),
    production: args.includes('--production'),
    skipBuild: args.includes('--skip-build'),
    skipTest: args.includes('--skip-test'),
    skipClean: args.includes('--skip-clean'),
    help: args.includes('--help')
  };
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!options.test && !options.production) {
    log('❌ Please specify --test or --production', 'red');
    log('Use --help for more information', 'yellow');
    process.exit(1);
  }
  
  log('🚀 Starting Bitbucket MCP Server publication process...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  // Change to project root
  const projectRoot = path.dirname(__dirname);
  process.chdir(projectRoot);
  
  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Clean build
  if (!options.skipClean) {
    if (!cleanBuild()) {
      process.exit(1);
    }
  }
  
  // Install dependencies
  if (!installDependencies()) {
    process.exit(1);
  }
  
  // Run tests
  if (!options.skipTest) {
    if (!runTests()) {
      process.exit(1);
    }
  }
  
  // Build package
  if (!options.skipBuild) {
    if (!buildPackage()) {
      process.exit(1);
    }
  }
  
  // Verify package
  if (!verifyPackage()) {
    process.exit(1);
  }
  
  // Publish
  const tag = options.test ? 'beta' : 'latest';
  if (!publishToNPM(tag)) {
    process.exit(1);
  }
  
  log('');
  log('=' .repeat(60), 'cyan');
  log('🎉 Publication completed successfully!', 'bright');
  
  if (options.test) {
    log('🧪 Package published to NPM with beta tag', 'green');
    log('🔗 Test installation: npm install bitbucket-mcp-server@beta', 'blue');
  } else {
    log('🚀 Package published to NPM', 'green');
    log('🔗 Installation: npm install bitbucket-mcp-server', 'blue');
  }
  
  log('📦 NPM Package: https://www.npmjs.com/package/bitbucket-mcp-server', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  checkEnvironment,
  cleanBuild,
  installDependencies,
  runTests,
  buildPackage,
  verifyPackage,
  publishToNPM
};
