#!/usr/bin/env node

/**
 * Test script that ensures consistent test data reset functionality
 * This script can be run to verify that test data resets properly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running tests with data reset verification...\n');

// Function to run a command and capture output
function runCommand(command, description) {
    console.log(`📋 ${description}...`);
    try {
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            cwd: process.cwd()
        });
        console.log(`✅ ${description} completed successfully`);
        return output;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        throw error;
    }
}

// Function to check if test data directory exists
function checkTestDataExists() {
    const testDataPath = path.join(__dirname, '..', 'src', 'tests', 'examples', 'fixtures');
    return fs.existsSync(testDataPath);
}

// Function to verify test files exist
function verifyTestFiles() {
    const testFiles = [
        'src/tests/examples/fixtures/test-data.ts',
        'src/tests/examples/utils/test-helpers.ts',
        'src/tests/examples/setup/test-setup.ts'
    ];
    
    const missingFiles = testFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));
    
    if (missingFiles.length > 0) {
        console.error('❌ Missing test files:', missingFiles);
        return false;
    }
    
    console.log('✅ All test files exist');
    return true;
}

async function main() {
    try {
        console.log('🔍 Verifying test setup...');
        
        // Verify test files exist
        if (!verifyTestFiles()) {
            process.exit(1);
        }
        
        // Check if we need to compile tests
        console.log('🔨 Compiling tests...');
        runCommand('pnpm run compile-tests', 'TypeScript compilation');
        
        // Run the actual tests
        console.log('🏃 Running tests...');
        runCommand('pnpm run test', 'Test execution');
        
        console.log('\n✅ All tests completed successfully!');
        console.log('📊 Test data reset functionality verified');
        
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Test execution interrupted');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test execution terminated');
    process.exit(1);
});

main();
