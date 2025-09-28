import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    extractIssueCodeFromDiagnostic, 
    determineIssueCategory 
} from '../../codeActions/diagnosticUtils';
import { 
    createCodeSuggestionAction, 
    isSuggestionAllowedByUserSettings 
} from '../../codeActions/suggestionActions';
import { 
    createIssueSuppressionActions,
    getUserSuppressionSettings
} from '../../codeActions/suppressionActions';
import { 
    createLinePragmaEdit,
    createWorkspaceIgnoreAction
} from '../../codeActions/workspaceActions';

suite('Code Actions Integration Tests', () => {
    
    test('end-to-end code action flow', async() => {
        // This test demonstrates the complete flow of code actions
        
        // 1. Create a diagnostic
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'analysis:invalid-operand'
        };

        // 2. Extract issue code
        const issueCode = extractIssueCodeFromDiagnostic(diagnostic);
        assert.strictEqual(issueCode, 'analysis:invalid-operand');

        // 3. Determine category
        const category = determineIssueCategory(diagnostic);
        assert.strictEqual(category, undefined); // No magoCategory set

        // 4. Get user settings
        const settings = getUserSuppressionSettings();
        assert.ok(settings);
        assert.strictEqual(typeof settings.showLineExpect, 'boolean');

        // 5. Create document for testing
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: 'test line',
                lineNumber: line
            })
        } as vscode.TextDocument;

        // 6. Test suggestion creation
        const suggestionGroup = [
            'test',
            {
                operations: [
                    {
                        type: 'fix',
                        value: {
                            offset: 0,
                            text: 'Replace with correct operand',
                            safety_classification: {
                                type: 'Safe'
                            }
                        }
                    }
                ]
            }
        ];

        const suggestionAction = createCodeSuggestionAction(suggestionGroup, document);
        assert.ok(suggestionAction);
        assert.ok(suggestionAction.action.title.includes('Apply suggestion'));

        // 7. Test suggestion filtering
        const isAllowed = isSuggestionAllowedByUserSettings('Safe');
        assert.strictEqual(isAllowed, true);

        // 8. Test suppression actions

        const suppressionActions = createIssueSuppressionActions(diagnostic, document);
        assert.ok(Array.isArray(suppressionActions));
        assert.ok(suppressionActions.length > 0);

        // 9. Test workspace ignore action
        const workspaceAction = createWorkspaceIgnoreAction('analysis:invalid-operand');
        assert.ok(workspaceAction);
        assert.ok(workspaceAction.title.includes('Suppress'));

        // 10. Test line pragma edit
        const pragmaEdit = createLinePragmaEdit(document, 0, '@mago-expect analysis:invalid-operand');
        assert.ok(pragmaEdit);
        assert.ok(pragmaEdit.has(document.uri));
    });

    test('error handling in code actions', () => {
        // Test error handling for invalid inputs
        
        // Invalid diagnostic
        const invalidDiagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error
            // No code property
        };

        const issueCode = extractIssueCodeFromDiagnostic(invalidDiagnostic);
        assert.strictEqual(issueCode, 'unknown');

        // Invalid issue code
        const invalidDiagnostic2: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'invalid-code'
        };
        const category = determineIssueCategory(invalidDiagnostic2);
        assert.strictEqual(category, undefined);

        // Empty issue code
        const emptyDiagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: ''
        };
        const emptyCategory = determineIssueCategory(emptyDiagnostic);
        assert.strictEqual(emptyCategory, undefined);
    });

    test('safety level handling', () => {
        // Test all safety levels
        
        const safeSuggestion = {
            type: 'fix',
            value: 'Safe suggestion',
            safety: 'Safe'
        };

        const potentiallyUnsafeSuggestion = {
            type: 'fix',
            value: 'Potentially unsafe suggestion',
            safety: 'PotentiallyUnsafe'
        };

        const unsafeSuggestion = {
            type: 'fix',
            value: 'Unsafe suggestion',
            safety: 'Unsafe'
        };

        // Safe suggestion should always be allowed
        assert.strictEqual(isSuggestionAllowedByUserSettings('Safe'), true);

        // Potentially unsafe depends on VS Code settings
        const potentiallyUnsafeResult = isSuggestionAllowedByUserSettings('PotentiallyUnsafe');
        assert.strictEqual(typeof potentiallyUnsafeResult, 'boolean');

        // Unsafe depends on VS Code settings
        const unsafeResult = isSuggestionAllowedByUserSettings('Unsafe');
        assert.strictEqual(typeof unsafeResult, 'boolean');
    });
});
