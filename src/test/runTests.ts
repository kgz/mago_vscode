import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../..');
    // Point to compiled test index that configures Mocha with TDD ui
    const extensionTestsPath = path.resolve(__dirname, './index.js');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error('Failed to run tests');
    console.error(err);
    process.exit(1);
  }
}

main();


