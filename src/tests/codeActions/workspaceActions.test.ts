import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    createLinePragmaEdit,
    createWorkspaceIgnoreAction
} from '../../codeActions/workspaceActions';

suite('Workspace Actions Tests', () => {
    
    test('createLinePragmaEdit - new suppression comment', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: '    return $response;',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const result = createLinePragmaEdit(document, 0, '@mago-expect analysis:invalid-operand');
        
        assert.ok(result);
        assert.ok(result.has(document.uri));
        
        const edits = result.get(document.uri);
        assert.ok(edits);
        assert.strictEqual(edits.length, 1);
        
        const edit = edits[0];
        assert.strictEqual(edit.newText, '        // @mago-expect analysis:invalid-operand\n');
        assert.strictEqual(edit.range.start.line, 0);
        assert.strictEqual(edit.range.start.character, 0);
    });

    test('createLinePragmaEdit - existing suppression comment', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => {
                if (line === 0) {
                    return { text: '        // @mago-expect analysis:invalid-operand', lineNumber: line };
                }
                return { text: '    return $response;', lineNumber: line };
            }
        } as vscode.TextDocument;

        const result = createLinePragmaEdit(document, 1, '@mago-expect analysis:invalid-return-statement');
        
        assert.ok(result);
        assert.ok(result.has(document.uri));
        
        const edits = result.get(document.uri);
        assert.ok(edits);
        assert.strictEqual(edits.length, 1);
        
        const edit = edits[0];
        assert.strictEqual(edit.newText, '        // @mago-expect analysis:invalid-return-statement\n');
        assert.strictEqual(edit.range.start.line, 0);
        assert.strictEqual(edit.range.start.character, 0);
    });

    test('createLinePragmaEdit - append to existing suppression', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => {
                if (line === 0) {
                    return { text: '        // @mago-expect analysis:invalid-operand', lineNumber: line };
                }
                return { text: '    return $response;', lineNumber: line };
            }
        } as vscode.TextDocument;

        const result = createLinePragmaEdit(document, 1, '@mago-expect analysis:invalid-return-statement');
        
        assert.ok(result);
        assert.ok(result.has(document.uri));
        
        const edits = result.get(document.uri);
        assert.ok(edits);
        assert.strictEqual(edits.length, 1);
        
        const edit = edits[0];
        // Should append to existing suppression
        assert.ok(edit.newText.includes('analysis:invalid-operand'));
        assert.ok(edit.newText.includes('analysis:invalid-return-statement'));
    });

    test('createWorkspaceIgnoreAction - basic ignore action', () => {
        const result = createWorkspaceIgnoreAction('analysis:invalid-operand');
        
        assert.ok(result);
        assert.ok(result.title.includes('Suppress'));
        assert.ok(result.title.includes('workspace'));
        assert.strictEqual(result.kind, vscode.CodeActionKind.QuickFix);
    });

    test('createWorkspaceIgnoreAction - with issue code', () => {
        const result = createWorkspaceIgnoreAction('analysis:invalid-operand');
        
        assert.ok(result);
        assert.ok(result.title.includes('analysis:invalid-operand'));
    });

    test('createLinePragmaEdit - empty line', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: '',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const result = createLinePragmaEdit(document, 0, '@mago-expect analysis:invalid-operand');
        
        assert.ok(result);
        assert.ok(result.has(document.uri));
        
        const edits = result.get(document.uri);
        assert.ok(edits);
        assert.strictEqual(edits.length, 1);
        
        const edit = edits[0];
        assert.strictEqual(edit.newText, '// @mago-expect analysis:invalid-operand\n');
    });

    test('createLinePragmaEdit - line with content', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: '    $var = "test";',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const result = createLinePragmaEdit(document, 0, '@mago-expect analysis:invalid-operand');
        
        assert.ok(result);
        assert.ok(result.has(document.uri));
        
        const edits = result.get(document.uri);
        assert.ok(edits);
        assert.strictEqual(edits.length, 1);
        
        const edit = edits[0];
        assert.strictEqual(edit.newText, '        // @mago-expect analysis:invalid-operand\n');
    });
});
