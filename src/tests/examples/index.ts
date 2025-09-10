import * as path from 'path';
import Mocha = require('mocha');

export function run(): Promise<void> {
  const mocha = new Mocha({ 
    ui: 'tdd', 
    color: true,
    timeout: 30000, // 30 second timeout for tests
    slow: 10000 // 10 seconds is considered slow
  });
  
  // Add test files
  mocha.addFile(path.resolve(__dirname, './smoke.test.js'));
  mocha.addFile(path.resolve(__dirname, './extension.test.js'));

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}


