# Test Data Management

This directory contains the test data management system for the Mago VS Code extension. The system ensures consistent test data that resets every time tests are run.

## Overview

The test data management system provides:

- **Consistent test data** - Standardized test files and configurations
- **Automatic reset** - Clean state before each test run
- **Isolated test environment** - Temporary workspace for each test session
- **Helper utilities** - Easy-to-use functions for test data management

## Architecture

### Core Components

1. **TestDataManager** (`fixtures/test-data.ts`)
   - Manages test workspace creation and cleanup
   - Provides consistent test file generation
   - Handles test data reset functionality

2. **TestHelpers** (`utils/test-helpers.ts`)
   - Utility functions for test assertions
   - File content verification helpers
   - Test environment setup utilities

3. **TestSetup** (`setup/test-setup.ts`)
   - Global test setup and teardown
   - Mocha hooks integration
   - Test environment lifecycle management

## Usage

### Running Tests with Data Reset

```bash
# Run tests with automatic data reset
pnpm run test:reset

# Or use the clean alias
pnpm run test:clean

# Standard test run (also includes reset)
pnpm run test
```

### Using Test Data in Your Tests

```typescript
import { TestHelpers } from './utils/test-helpers';
import { TestSetup } from './setup/test-setup';

suite('My Test Suite', () => {
    test('example test', async () => {
        // Test data is automatically reset before each test
        
        // Create custom test files
        await TestSetup.createTestFile('MyTest.php', '<?php class MyTest {}');
        
        // Verify file exists
        TestHelpers.assertTestFileExists('MyTest.php');
        
        // Check file content
        TestHelpers.assertTestFileContains('MyTest.php', 'class MyTest');
        
        // Get file content
        const content = TestSetup.getTestFileContent('MyTest.php');
        assert.ok(content);
    });
});
```

### Standard Test Files

The system automatically creates these test files:

- **HelloWorld.php** - Basic test class with intentional issues
- **SyntaxErrorTest.php** - File with syntax errors for testing error handling
- **UnusedCodeTest.php** - File with unused code for testing analysis
- **TypeIssueTest.php** - File with type issues for testing type checking

### Configuration Files

- **mago.toml** - Mago analyzer configuration
- **composer.json** - PHP dependencies configuration

## Test Data Reset Process

1. **Before each test**:
   - Clean up previous test data
   - Create fresh test workspace
   - Generate standard test files
   - Set up configuration files

2. **After each test**:
   - Clean up temporary files
   - Reset test environment state

3. **After all tests**:
   - Remove test workspace
   - Clean up all temporary data

## Expected Analysis Results

The system includes predefined expected results for test files:

```typescript
const expectedResults = {
    'HelloWorld.php': {
        issues: [
            {
                type: 'unreachable-code',
                message: 'Unreachable code after return statement',
                line: 13
            }
        ]
    }
    // ... more files
};
```

## Custom Test Files

You can create custom test files for specific test scenarios:

```typescript
// Create a custom test file
await TestSetup.createTestFile('CustomTest.php', `
<?php
namespace MagoVscode\\Tests;

class CustomTest
{
    public function testMethod()
    {
        // Your test code here
    }
}
`);

// The file will be automatically cleaned up after the test
```

## Debugging

### Force Reset Test Data

```typescript
// Force reset test data (useful for debugging)
await TestSetup.forceReset();
```

### Check Test Environment Status

```typescript
// Check if test environment is ready
const isReady = TestSetup.isTestEnvironmentReady();
assert.ok(isReady, 'Test environment should be ready');
```

### Get Test Workspace Path

```typescript
// Get the current test workspace path
const workspacePath = TestSetup.getTestWorkspacePath();
console.log('Test workspace:', workspacePath);
```

## Best Practices

1. **Always use the test utilities** - Don't create files manually
2. **Don't rely on test order** - Each test should be independent
3. **Use descriptive test file names** - Makes debugging easier
4. **Clean up custom files** - They're automatically cleaned, but be explicit
5. **Verify test environment** - Check that setup is complete before testing

## Troubleshooting

### Test Data Not Resetting

- Ensure you're using the test utilities (`TestSetup`, `TestHelpers`)
- Check that Mocha hooks are properly configured
- Verify test environment initialization

### Missing Test Files

- Check that `TestDataManager` is properly initialized
- Ensure test workspace creation is successful
- Verify file permissions for temporary directories

### Test Environment Issues

- Check VS Code extension activation
- Verify Mago binary availability
- Ensure proper test workspace configuration

## File Structure

```
src/tests/examples/
├── fixtures/
│   └── test-data.ts          # Core test data management
├── utils/
│   └── test-helpers.ts       # Test utility functions
├── setup/
│   └── test-setup.ts         # Test setup and teardown
├── workspace/                # Test workspace directory
│   ├── composer.json
│   ├── composer.lock
│   ├── mago.toml
│   └── src/
├── smoke.test.ts             # Basic functionality tests
├── extension.test.ts         # Extension-specific tests
├── index.ts                  # Test runner configuration
├── runTests.ts               # Test runner entry point
└── README.md                 # This documentation
```
