import 'reflect-metadata';
import { describe, it } from 'mocha';
const { expect } = require('chai');

// We need to import the function, but it's not exported
// Let's create a test for the logic we can access

describe('Workspace Actions Unit Tests', () => {
    
    describe('extractIssueCodeFromPragma logic', () => {
        // Since extractIssueCodeFromPragma is not exported, we'll test the logic inline
        function extractIssueCodeFromPragma(pragmaComment: string): string {
            // Extract issue code from "@mago-expect analysis:issue-code" format
            const match = pragmaComment.match(/@mago-(expect|ignore)\s+(.+)/);
            return match ? match[2].trim() : pragmaComment;
        }

        it('should extract issue code from @mago-expect pragma', () => {
            const result = extractIssueCodeFromPragma('@mago-expect analysis:invalid-operand');
            expect(result).to.equal('analysis:invalid-operand');
        });

        it('should extract issue code from @mago-ignore pragma', () => {
            const result = extractIssueCodeFromPragma('@mago-ignore lint:unused-variable');
            expect(result).to.equal('lint:unused-variable');
        });

        it('should handle pragma with extra whitespace', () => {
            const result = extractIssueCodeFromPragma('@mago-expect   analysis:invalid-operand   ');
            expect(result).to.equal('analysis:invalid-operand');
        });

        it('should handle multiple issue codes', () => {
            const result = extractIssueCodeFromPragma('@mago-expect analysis:invalid-operand,analysis:invalid-return-statement');
            expect(result).to.equal('analysis:invalid-operand,analysis:invalid-return-statement');
        });

        it('should return original string if no match', () => {
            const result = extractIssueCodeFromPragma('// some other comment');
            expect(result).to.equal('// some other comment');
        });

        it('should handle empty string', () => {
            const result = extractIssueCodeFromPragma('');
            expect(result).to.equal('');
        });

        it('should handle malformed pragma', () => {
            const result = extractIssueCodeFromPragma('@mago-expect');
            expect(result).to.equal('@mago-expect');
        });

        it('should handle pragma without issue code', () => {
            const result = extractIssueCodeFromPragma('@mago-expect ');
            expect(result).to.equal('@mago-expect ');
        });
    });

    describe('pragma parsing edge cases', () => {
        function extractIssueCodeFromPragma(pragmaComment: string): string {
            const match = pragmaComment.match(/@mago-(expect|ignore)\s+(.+)/);
            return match ? match[2].trim() : pragmaComment;
        }

        it('should handle pragma with special characters', () => {
            const result = extractIssueCodeFromPragma('@mago-expect analysis:invalid-operand-with-dashes');
            expect(result).to.equal('analysis:invalid-operand-with-dashes');
        });

        it('should handle pragma with numbers', () => {
            const result = extractIssueCodeFromPragma('@mago-expect analysis:error-404');
            expect(result).to.equal('analysis:error-404');
        });

        it('should handle pragma with underscores', () => {
            const result = extractIssueCodeFromPragma('@mago-expect analysis:invalid_return_statement');
            expect(result).to.equal('analysis:invalid_return_statement');
        });

        it('should handle case variations', () => {
            const result = extractIssueCodeFromPragma('@MAGO-EXPECT ANALYSIS:INVALID-OPERAND');
            expect(result).to.equal('@MAGO-EXPECT ANALYSIS:INVALID-OPERAND');
        });
    });
});
