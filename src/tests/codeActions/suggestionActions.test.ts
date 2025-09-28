import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    createCodeSuggestionAction, 
    isSuggestionAllowedByUserSettings 
} from '../../codeActions/suggestionActions';
import { SuggestionSafetyLevel } from '../../codeActions/types';

suite('Suggestion Actions Tests', () => {
    
    test('createCodeSuggestionAction - safe suggestion', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: 'test line',
                lineNumber: line
            })
        } as vscode.TextDocument;

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
                                type: 'Safe' as SuggestionSafetyLevel
                            }
                        }
                    }
                ]
            }
        ];

        const result = createCodeSuggestionAction(suggestionGroup, document);
        
        assert.ok(result);
        assert.ok(result.action.title.includes('Apply suggestion'));
        assert.strictEqual(result.action.kind, vscode.CodeActionKind.QuickFix);
        assert.ok(result.action.command);
        assert.strictEqual(result.action.command?.command, 'mago.applySuggestion');
    });

    test('createCodeSuggestionAction - potentially unsafe suggestion', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: 'test line',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const suggestionGroup = [
            'test',
            {
                operations: [
                    {
                        type: 'fix',
                        value: {
                            offset: 0,
                            text: 'Replace with potentially unsafe code',
                            safety_classification: {
                                type: 'PotentiallyUnsafe' as SuggestionSafetyLevel
                            }
                        }
                    }
                ]
            }
        ];

        const result = createCodeSuggestionAction(suggestionGroup, document);
        
        assert.ok(result);
        assert.ok(result.action.title.includes('Apply suggestion'));
        assert.ok(result.action.title.includes('Potentially Unsafe'));
        assert.strictEqual(result.action.kind, vscode.CodeActionKind.QuickFix);
    });

    test('createCodeSuggestionAction - unsafe suggestion', () => {
        const document = {
            uri: vscode.Uri.parse('file:///test.php'),
            lineAt: (line: number) => ({
                text: 'test line',
                lineNumber: line
            })
        } as vscode.TextDocument;

        const suggestionGroup = [
            'test',
            {
                operations: [
                    {
                        type: 'fix',
                        value: {
                            offset: 0,
                            text: 'Replace with unsafe code',
                            safety_classification: {
                                type: 'Unsafe' as SuggestionSafetyLevel
                            }
                        }
                    }
                ]
            }
        ];

        const result = createCodeSuggestionAction(suggestionGroup, document);
        
        assert.ok(result);
        assert.ok(result.action.title.includes('Apply suggestion'));
        assert.ok(result.action.title.includes('Unsafe'));
        assert.strictEqual(result.action.kind, vscode.CodeActionKind.QuickFix);
    });

    test('isSuggestionAllowedByUserSettings - safe suggestion', () => {
        const result = isSuggestionAllowedByUserSettings('Safe' as SuggestionSafetyLevel);
        assert.strictEqual(result, true);
    });

    test('isSuggestionAllowedByUserSettings - potentially unsafe suggestion', () => {
        const result = isSuggestionAllowedByUserSettings('PotentiallyUnsafe' as SuggestionSafetyLevel);
        // This depends on VS Code configuration, so we just test that it returns a boolean
        assert.strictEqual(typeof result, 'boolean');
    });

    test('isSuggestionAllowedByUserSettings - unsafe suggestion', () => {
        const result = isSuggestionAllowedByUserSettings('Unsafe' as SuggestionSafetyLevel);
        // This depends on VS Code configuration, so we just test that it returns a boolean
        assert.strictEqual(typeof result, 'boolean');
    });

    test('isSuggestionAllowedByUserSettings - undefined safety level', () => {
        const result = isSuggestionAllowedByUserSettings(undefined);
        assert.strictEqual(result, true);
    });

    test('isSuggestionAllowedByUserSettings - unknown safety level', () => {
        const result = isSuggestionAllowedByUserSettings('Unknown' as SuggestionSafetyLevel);
        assert.strictEqual(result, true);
    });
});
