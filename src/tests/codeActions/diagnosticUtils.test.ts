import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    extractIssueCodeFromDiagnostic, 
    determineIssueCategory 
} from '../../codeActions/diagnosticUtils';

suite('Diagnostic Utils Tests', () => {
    
    test('extractIssueCodeFromDiagnostic - valid issue code', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'analysis:invalid-operand'
        };

        const result = extractIssueCodeFromDiagnostic(diagnostic);
        assert.strictEqual(result, 'analysis:invalid-operand');
    });

    test('extractIssueCodeFromDiagnostic - no code', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error
        };

        const result = extractIssueCodeFromDiagnostic(diagnostic);
        assert.strictEqual(result, 'unknown');
    });

    test('extractIssueCodeFromDiagnostic - code as number', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 123
        };

        const result = extractIssueCodeFromDiagnostic(diagnostic);
        assert.strictEqual(result, 'unknown');
    });

    test('extractIssueCodeFromDiagnostic - code as object', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: { value: 'analysis:invalid-operand', target: vscode.Uri.parse('https://example.com') }
        };

        const result = extractIssueCodeFromDiagnostic(diagnostic);
        assert.strictEqual(result, 'analysis:invalid-operand');
    });

    test('determineIssueCategory - analysis category', () => {
        const diagnostic: vscode.Diagnostic & { magoCategory?: string } = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'analysis:invalid-operand',
            magoCategory: 'analysis'
        };

        const result = determineIssueCategory(diagnostic);
        assert.strictEqual(result, 'analysis');
    });

    test('determineIssueCategory - linter category', () => {
        const diagnostic: vscode.Diagnostic & { magoCategory?: string } = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'linter:unused-variable',
            magoCategory: 'linter'
        };

        const result = determineIssueCategory(diagnostic);
        assert.strictEqual(result, 'lint');
    });

    test('determineIssueCategory - unknown category', () => {
        const diagnostic: vscode.Diagnostic & { magoCategory?: string } = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'unknown:issue',
            magoCategory: 'unknown'
        };

        const result = determineIssueCategory(diagnostic);
        assert.strictEqual(result, undefined);
    });

    test('determineIssueCategory - no magoCategory', () => {
        const diagnostic: vscode.Diagnostic = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'invalid-issue-code'
        };

        const result = determineIssueCategory(diagnostic);
        assert.strictEqual(result, undefined);
    });

    test('determineIssueCategory - empty magoCategory', () => {
        const diagnostic: vscode.Diagnostic & { magoCategory?: string } = {
            range: new vscode.Range(0, 0, 0, 10),
            message: 'Test message',
            severity: vscode.DiagnosticSeverity.Error,
            code: 'test',
            magoCategory: ''
        };

        const result = determineIssueCategory(diagnostic);
        assert.strictEqual(result, undefined);
    });
});
