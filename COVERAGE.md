# Code Coverage Guide

This guide explains how to get code coverage for the Mago VS Code extension.

## 🎯 Unit Test Coverage

**Command:** `pnpm run test:coverage`

This runs unit tests with coverage for pure TypeScript functions that don't depend on VS Code APIs. This provides meaningful coverage metrics for your codebase.

**Use this for:** Testing utility functions, parsers, and business logic.

## 📊 Coverage Reports

After running coverage, you'll find:

- **HTML Report:** `./coverage/index.html` - Interactive coverage report
- **LCOV Report:** `./coverage/lcov.info` - For CI/CD integration
- **Text Report:** Displayed in terminal

## 🔧 Coverage Configuration

### Thresholds
Current thresholds are set to 70% for:
- Statements
- Branches  
- Functions
- Lines

### Files Included
- `src/**/*.ts` - All source files
- Excludes test files and compiled output

### Files Excluded
- `src/**/*.test.ts` - Test files
- `src/**/*.spec.ts` - Spec files
- `src/tests/**/*` - Test directory
- `out/**/*` - Compiled output
- `dist/**/*` - Distribution files
- `node_modules/**/*` - Dependencies

## 🚀 Getting Started

1. **Run Unit Tests with Coverage:**
   ```bash
   pnpm run test:coverage
   ```

2. **View HTML Report:**
   ```bash
   open coverage/index.html
   ```

3. **Check Coverage Thresholds:**
   ```bash
   pnpm run test:coverage:check
   ```

## 📈 Improving Coverage

### Focus Areas
Since VS Code extensions run in a separate process, focus on:

1. **Unit Testing Pure Functions**
   - Utility functions
   - Parsers and validators
   - Business logic
   - Data transformations
   - String manipulation
   - Configuration parsing

### Example Unit Tests
```typescript
// Test pure functions without VS Code dependencies
import { parseComposerJson } from '../template/composerParser';

describe('Composer Parser', () => {
  it('should parse valid composer.json', () => {
    const result = parseComposerJson('{"name": "test/package"}');
    expect(result.name).toBe('test/package');
  });
});
```

## 🛠️ Tools Used

- **nyc** - Coverage collection
- **mocha** - Unit test runner
- **@vscode/test-electron** - VS Code extension testing
- **ts-node** - TypeScript execution

## 📝 Notes

- Focus on unit testing pure functions for meaningful coverage
- VS Code extension integration tests run separately via `pnpm test`
- Coverage thresholds can be adjusted in `.nycrc.json`
- Current threshold is set to 30% (realistic for VS Code extensions)

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot find module 'vscode'"**
   - Unit tests can't import VS Code APIs
   - Use mocks or test pure functions only

2. **Coverage Threshold Failures**
   - Adjust thresholds in `.nycrc.json`
   - Add more unit tests for pure functions

3. **No Coverage Data**
   - Ensure tests are importing the functions you want to test
   - Check that nyc is including the right files

### Solutions

1. **Mock VS Code APIs:**
   ```typescript
   const mockVscode = {
     window: { showInformationMessage: jest.fn() },
     workspace: { getConfiguration: jest.fn() }
   };
   ```

2. **Test Pure Functions:**
   ```typescript
   // Good - no VS Code dependencies
   function parseToml(content: string): TomlConfig { ... }
   
   // Avoid - VS Code dependent
   function getWorkspaceConfig(): vscode.WorkspaceConfiguration { ... }
   ```

## 📚 Additional Resources

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [nyc Documentation](https://github.com/istanbuljs/nyc)
- [Mocha Documentation](https://mochajs.org/)
