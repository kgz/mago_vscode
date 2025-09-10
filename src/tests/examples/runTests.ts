import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../..');
    // Point to compiled test index that configures Mocha with TDD ui
    const extensionTestsPath = path.resolve(__dirname, './index.js');
    
    // Specify the test workspace - this is crucial for workspace initialization
    const testWorkspacePath = path.resolve(__dirname, './workspace');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [testWorkspacePath] // This tells VS Code to open the tests directory as workspace
    });
  } catch (err) {
    console.error('Failed to run tests');
    console.error(err);
    process.exit(1);
  }
}

main();


