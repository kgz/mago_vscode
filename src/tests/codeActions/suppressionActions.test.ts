import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    createIssueSuppressionActions,
    getUserSuppressionSettings
} from '../../codeActions/suppressionActions';

suite('Suppression Actions Tests', () => {
    
    test('createIssueSuppressionActions - basic suppression', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'analysis:invalid-operand'
        };

        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: 'test line',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const settings = {
            showLineExpect: true,
            showLineIgnore: true,
            showBlockIgnore: true,
            showBlockExpect: true,
            showWorkspaceIgnore: true
        };

        const result = createIssueSuppressionActions(diagnostic, document);
        
        assert.ok(Array.isArray(result));
        assert.ok(result.length > 0);
        
        // Check that we have the expected action types
        const titles = result.map(action => action.title);
        assert.ok(titles.some(title => title.includes('Suppress')), 'Should have suppress actions');
    });


    test('getUserSuppressionSettings - default settings', () => {
        const result = getUserSuppressionSettings();
        
        assert.ok(result);
        assert.strictEqual(typeof result.showLineExpect, 'boolean');
        assert.strictEqual(typeof result.showLineIgnore, 'boolean');
        assert.strictEqual(typeof result.showBlockIgnore, 'boolean');
        assert.strictEqual(typeof result.showBlockExpect, 'boolean');
        assert.strictEqual(typeof result.showWorkspaceIgnore, 'boolean');
    });

});
