import * as assert from 'assert';
import * as vscode from 'vscode';
import { registerCodeActions } from '../../codeActions/codeActionProvider';

suite('Code Action Provider Tests', () => {
    
    test('registerCodeActions - registers provider', () => {
        // Create a mock extension context
        const mockContext = {
            subscriptions: [] as vscode.Disposable[]
        } as vscode.ExtensionContext;

        // Register the code actions
        registerCodeActions(mockContext);
        
        // Verify that a subscription was added
        assert.strictEqual(mockContext.subscriptions.length, 1);
        assert.ok(mockContext.subscriptions[0]);
    });

});
