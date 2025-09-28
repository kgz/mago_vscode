import { describe, it } from 'mocha';
const { expect } = require('chai');

// Mock VS Code types for testing
interface MockRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

interface MockDiagnostic {
  range: MockRange;
  message: string;
  severity?: number;
  code?: string | number | { value: string; target?: string };
  source?: string;
  magoCategory?: string;
}

// Import the functions we want to test
import { 
    extractIssueCodeFromDiagnostic, 
    determineIssueCategory 
} from '../../../codeActions/diagnosticUtils';

describe('Diagnostic Utils Unit Tests', () => {
    
    describe('extractIssueCodeFromDiagnostic', () => {
        it('should extract string code', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'analysis:invalid-operand'
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.equal('analysis:invalid-operand');
        });

        it('should extract number code', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 123
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.equal('123');
        });

        it('should extract complex code object', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: { value: 'analysis:type-mismatch', target: 'https://example.com' }
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.equal('analysis:type-mismatch');
        });

        it('should return undefined for no code', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.be.undefined;
        });

        it('should handle null code', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: null as any
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.be.undefined;
        });

        it('should handle undefined code', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: undefined
            };

            const result = extractIssueCodeFromDiagnostic(diagnostic as any);
            expect(result).to.be.undefined;
        });
    });

    describe('determineIssueCategory', () => {
        it('should categorize analysis issues', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'analysis:invalid-operand',
                magoCategory: 'analysis'
            };

            const result = determineIssueCategory(diagnostic as any);
            expect(result).to.equal('analysis');
        });

        it('should categorize lint issues', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'linter:unused-variable',
                magoCategory: 'lint'
            };

            const result = determineIssueCategory(diagnostic as any);
            expect(result).to.equal('lint');
        });

        it('should return undefined for unrecognized categories', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'unknown:something',
                magoCategory: 'unknown'
            };

            const result = determineIssueCategory(diagnostic as any);
            expect(result).to.be.undefined;
        });

        it('should return undefined for missing magoCategory', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'analysis:invalid-operand'
            };

            const result = determineIssueCategory(diagnostic as any);
            expect(result).to.be.undefined;
        });

        it('should handle case-insensitive category matching', () => {
            const diagnostic: MockDiagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test message',
                severity: 0,
                code: 'analysis:invalid-operand',
                magoCategory: 'ANALYSIS'
            };

            const result = determineIssueCategory(diagnostic as any);
            expect(result).to.equal('analysis');
        });
    });
});
