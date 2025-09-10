#!/usr/bin/env node

/**
 * Ensure the built index.js file is executable
 * This is required for the bin entry in package.json to work properly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '..', 'dist', 'index.js');

try {
  // Check if the dist/index.js file exists
  if (fs.existsSync(indexPath)) {
    // Get current file stats
    const stats = fs.statSync(indexPath);

    // Check if file is already executable
    const isExecutable = !!(stats.mode & 0o111);

    if (!isExecutable) {
      // Make the file executable
      fs.chmodSync(indexPath, 0o755);
      console.log('✅ Made dist/index.js executable');
    } else {
      console.log('✅ dist/index.js is already executable');
    }
  } else {
    console.log('⚠️  dist/index.js not found. Run "npm run build" first.');
  }
} catch (error) {
  console.error('❌ Error making file executable:', error.message);
  process.exit(1);
}
