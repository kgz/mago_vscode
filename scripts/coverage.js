#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running unit tests with coverage...\n');

try {
  // Clean previous coverage data
  if (fs.existsSync('.nyc_output')) {
    execSync('rm -rf .nyc_output', { stdio: 'inherit' });
  }
  if (fs.existsSync('coverage')) {
    execSync('rm -rf coverage', { stdio: 'inherit' });
  }

  // Run unit tests with coverage directly on TypeScript files
  console.log('📊 Running unit tests with coverage...');
  execSync('nyc --reporter=text --reporter=html --reporter=lcov mocha "src/tests/unit/**/*.test.ts" --require ts-node/register --timeout 10000', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NYC_CWD: process.cwd(),
      NODE_OPTIONS: '--loader ts-node/esm'
    }
  });

  console.log('\n✅ Coverage report generated!');
  console.log('📁 HTML report: ./coverage/index.html');
  console.log('📊 LCOV report: ./coverage/lcov.info');
  
  // Check if coverage meets thresholds
  try {
    execSync('nyc check-coverage', { stdio: 'inherit' });
    console.log('✅ Coverage thresholds met!');
  } catch (error) {
    console.log('⚠️  Coverage thresholds not met. Check the report for details.');
  }

} catch (error) {
  console.error('❌ Coverage collection failed:', error.message);
  process.exit(1);
}
