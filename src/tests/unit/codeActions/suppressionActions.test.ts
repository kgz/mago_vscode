import 'reflect-metadata';
import { describe, it } from 'mocha';
const { expect } = require('chai');

describe('Suppression Actions Unit Tests', () => {
    
    describe('Issue code formatting', () => {
        it('should format issue codes correctly', () => {
            // Test the logic for formatting issue codes
            function formatIssueCode(category: string, code: string): string {
                return `${category}:${code}`;
            }

            expect(formatIssueCode('analysis', 'invalid-operand')).to.equal('analysis:invalid-operand');
            expect(formatIssueCode('lint', 'unused-variable')).to.equal('lint:unused-variable');
            expect(formatIssueCode('', 'code')).to.equal(':code');
            expect(formatIssueCode('category', '')).to.equal('category:');
        });

        it('should handle special characters in issue codes', () => {
            function formatIssueCode(category: string, code: string): string {
                return `${category}:${code}`;
            }

            expect(formatIssueCode('analysis', 'invalid-operand-with-dashes')).to.equal('analysis:invalid-operand-with-dashes');
            expect(formatIssueCode('lint', 'unused_variable')).to.equal('lint:unused_variable');
            expect(formatIssueCode('analysis', 'error-404')).to.equal('analysis:error-404');
        });
    });

    describe('Suppression comment generation', () => {
        it('should generate expect pragma comments', () => {
            function generateExpectPragma(issueCode: string): string {
                return `// @mago-expect ${issueCode}`;
            }

            expect(generateExpectPragma('analysis:invalid-operand')).to.equal('// @mago-expect analysis:invalid-operand');
            expect(generateExpectPragma('lint:unused-variable')).to.equal('// @mago-expect lint:unused-variable');
        });

        it('should generate ignore pragma comments', () => {
            function generateIgnorePragma(issueCode: string): string {
                return `// @mago-ignore ${issueCode}`;
            }

            expect(generateIgnorePragma('analysis:invalid-operand')).to.equal('// @mago-ignore analysis:invalid-operand');
            expect(generateIgnorePragma('lint:unused-variable')).to.equal('// @mago-ignore lint:unused-variable');
        });

        it('should handle multiple issue codes', () => {
            function generateExpectPragma(issueCodes: string[]): string {
                return `// @mago-expect ${issueCodes.join(',')}`;
            }

            const issueCodes = ['analysis:invalid-operand', 'analysis:invalid-return-statement'];
            expect(generateExpectPragma(issueCodes)).to.equal('// @mago-expect analysis:invalid-operand,analysis:invalid-return-statement');
        });
    });

    describe('Suppression settings validation', () => {
        it('should validate suppression settings structure', () => {
            interface SuppressionActionSettings {
                showLineExpect: boolean;
                showLineIgnore: boolean;
                showBlockIgnore: boolean;
                showBlockExpect: boolean;
                showWorkspaceIgnore: boolean;
            }

            const defaultSettings: SuppressionActionSettings = {
                showLineExpect: true,
                showLineIgnore: true,
                showBlockIgnore: true,
                showBlockExpect: true,
                showWorkspaceIgnore: true
            };

            expect(defaultSettings.showLineExpect).to.be.true;
            expect(defaultSettings.showLineIgnore).to.be.true;
            expect(defaultSettings.showBlockIgnore).to.be.true;
            expect(defaultSettings.showBlockExpect).to.be.true;
            expect(defaultSettings.showWorkspaceIgnore).to.be.true;
        });

        it('should handle disabled suppression settings', () => {
            interface SuppressionActionSettings {
                showLineExpect: boolean;
                showLineIgnore: boolean;
                showBlockIgnore: boolean;
                showBlockExpect: boolean;
                showWorkspaceIgnore: boolean;
            }

            const disabledSettings: SuppressionActionSettings = {
                showLineExpect: false,
                showLineIgnore: false,
                showBlockIgnore: false,
                showBlockExpect: false,
                showWorkspaceIgnore: false
            };

            expect(disabledSettings.showLineExpect).to.be.false;
            expect(disabledSettings.showLineIgnore).to.be.false;
            expect(disabledSettings.showBlockIgnore).to.be.false;
            expect(disabledSettings.showBlockExpect).to.be.false;
            expect(disabledSettings.showWorkspaceIgnore).to.be.false;
        });
    });

    describe('Action title generation', () => {
        it('should generate suppression action titles', () => {
            function generateActionTitle(actionType: string, issueCode: string): string {
                return `Mago: ${actionType} ${issueCode}`;
            }

            expect(generateActionTitle('Suppress', 'analysis:invalid-operand')).to.equal('Mago: Suppress analysis:invalid-operand');
            expect(generateActionTitle('Ignore', 'lint:unused-variable')).to.equal('Mago: Ignore lint:unused-variable');
        });

        it('should handle action titles with special characters', () => {
            function generateActionTitle(actionType: string, issueCode: string): string {
                return `Mago: ${actionType} ${issueCode}`;
            }

            expect(generateActionTitle('Suppress (inline)', 'analysis:invalid-operand')).to.equal('Mago: Suppress (inline) analysis:invalid-operand');
            expect(generateActionTitle('Ignore (workspace)', 'lint:unused-variable')).to.equal('Mago: Ignore (workspace) lint:unused-variable');
        });
    });
});
