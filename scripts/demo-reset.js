#!/usr/bin/env node

/**
 * Demo script showing test data reset functionality
 * This script demonstrates how test data is managed and reset
 */

const { TestDataManager } = require('../out/test/fixtures/test-data');

async function demonstrateReset() {
    console.log('🧪 Demonstrating Test Data Reset Functionality\n');
    
    const testDataManager = TestDataManager.getInstance();
    
    try {
        // Initialize test data
        console.log('1️⃣ Initializing test data...');
        await testDataManager.initializeTestData();
        const workspacePath = testDataManager.getTestWorkspacePath();
        console.log(`   ✅ Test workspace created: ${workspacePath}`);
        
        // Show initial files
        console.log('\n2️⃣ Initial test files:');
        const initialFiles = ['HelloWorld.php', 'SyntaxErrorTest.php', 'UnusedCodeTest.php', 'TypeIssueTest.php'];
        for (const fileName of initialFiles) {
            const content = testDataManager.getTestFileContent(fileName);
            console.log(`   📄 ${fileName} (${content ? 'exists' : 'missing'})`);
        }
        
        // Create custom file
        console.log('\n3️⃣ Creating custom test file...');
        const customFileName = 'CustomDemo.php';
        const customContent = `<?php
namespace MagoVscode\\Tests;

class CustomDemo
{
    public function demoMethod()
    {
        return "This is a custom test file";
    }
}`;
        
        await testDataManager.createTestFile(customFileName, customContent);
        console.log(`   ✅ Created ${customFileName}`);
        
        // Show files after creation
        console.log('\n4️⃣ Files after custom creation:');
        const allFiles = [...initialFiles, customFileName];
        for (const fileName of allFiles) {
            const content = testDataManager.getTestFileContent(fileName);
            console.log(`   📄 ${fileName} (${content ? 'exists' : 'missing'})`);
        }
        
        // Reset test data
        console.log('\n5️⃣ Resetting test data...');
        await testDataManager.resetTestData();
        console.log('   ✅ Test data reset completed');
        
        // Show files after reset
        console.log('\n6️⃣ Files after reset:');
        for (const fileName of allFiles) {
            const content = testDataManager.getTestFileContent(fileName);
            console.log(`   📄 ${fileName} (${content ? 'exists' : 'missing'})`);
        }
        
        // Show expected analysis results
        console.log('\n7️⃣ Expected analysis results:');
        const expectedResults = testDataManager.getExpectedAnalysisResults();
        for (const [fileName, results] of Object.entries(expectedResults)) {
            console.log(`   📊 ${fileName}: ${results.issues.length} expected issues`);
            for (const issue of results.issues) {
                console.log(`      - Line ${issue.line}: ${issue.message}`);
            }
        }
        
        console.log('\n✅ Demo completed successfully!');
        console.log('\n📝 Key points:');
        console.log('   • Test data is automatically reset between test runs');
        console.log('   • Custom files are cleaned up automatically');
        console.log('   • Standard test files are recreated consistently');
        console.log('   • Expected analysis results are predefined');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await testDataManager.cleanupTestData();
        console.log('   ✅ Cleanup completed');
    }
}

// Run the demo
demonstrateReset();
