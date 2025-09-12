#!/usr/bin/env node

/**
 * Build script for Windows compatibility
 * Executes TypeScript compilation directly
 */

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Building TypeScript project...');
  
  // Use the TypeScript compiler directly from node_modules
  const tscPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
  
  // Execute TypeScript compilation
  execSync(`"${tscPath}"`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
