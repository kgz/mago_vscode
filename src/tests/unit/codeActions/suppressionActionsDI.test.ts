import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
const { expect } = require('chai');
import { container } from 'tsyringe';
import { SuppressionActionsService } from '../../../codeActions/suppressionActions';
import { MockWorkspaceConfiguration, MockDiagnostic, MockTextDocument, createMockDiagnostic, createMockDocument } from './services/MockSuppressionService';

describe('Suppression Actions Service (DI) Unit Tests', () => {
    let service: SuppressionActionsService;
    let mockWorkspaceConfig: MockWorkspaceConfiguration;

    beforeEach(() => {
        // Clear container and register mock services
        container.clearInstances();
        
        mockWorkspaceConfig = new MockWorkspaceConfiguration();
        container.registerInstance('IWorkspaceConfiguration', mockWorkspaceConfig);
        
        // Get the service from DI container
        service = container.resolve(SuppressionActionsService);
    });

    describe('getUserSuppressionSettings', () => {
        it('should return default settings when no configuration is set', () => {
            const settings = service.getUserSuppressionSettings();
            
            expect(settings.showLineExpect).to.be.true;
            expect(settings.showLineIgnore).to.be.true;
            expect(settings.showBlockIgnore).to.be.true;
            expect(settings.showBlockExpect).to.be.true;
            expect(settings.showWorkspaceIgnore).to.be.true;
        });

        it('should return custom settings when configuration is set', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineExpect', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineIgnore', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockIgnore', true);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockExpect', true);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showWorkspaceIgnore', false);

            const settings = service.getUserSuppressionSettings();
            
            expect(settings.showLineExpect).to.be.false;
            expect(settings.showLineIgnore).to.be.false;
            expect(settings.showBlockIgnore).to.be.true;
            expect(settings.showBlockExpect).to.be.true;
            expect(settings.showWorkspaceIgnore).to.be.false;
        });

        it('should handle partial configuration settings', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineExpect', false);
            // Other settings not set, should use defaults

            const settings = service.getUserSuppressionSettings();
            
            expect(settings.showLineExpect).to.be.false;
            expect(settings.showLineIgnore).to.be.true; // default
            expect(settings.showBlockIgnore).to.be.true; // default
            expect(settings.showBlockExpect).to.be.true; // default
            expect(settings.showWorkspaceIgnore).to.be.true; // default
        });
    });

    describe('createIssueSuppressionActions', () => {
        it('should create suppression actions for single-line diagnostic', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3); // expect, ignore, and workspace actions
            expect(actions[0].title).to.include('@mago-expect analysis:test-issue');
            expect(actions[1].title).to.include('@mago-ignore analysis:test-issue');
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should create suppression actions for multi-line diagnostic', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Multi-line diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 7, character: 10 } },
                code: 'multi-line-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(5); // line-level (2) + block-level (2) + workspace (1) actions
            expect(actions[0].title).to.include('@mago-expect analysis:multi-line-issue');
            expect(actions[1].title).to.include('@mago-ignore analysis:multi-line-issue');
            expect(actions[2].title).to.include('Suppress block with @mago-ignore');
            expect(actions[3].title).to.include('Expect issue for block with @mago-expect');
            expect(actions[4].title).to.include('workspace ignore');
        });

        it('should return empty array when issue code cannot be determined', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Diagnostic without code',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: undefined,
                magoCategory: undefined
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(0);
        });

        it('should respect suppression settings for line-level actions', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineExpect', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineIgnore', true);

            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(2); // ignore action + workspace action
            expect(actions[0].title).to.include('@mago-ignore analysis:test-issue');
            expect(actions[1].title).to.include('workspace ignore');
        });

        it('should respect suppression settings for block-level actions', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockExpect', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockIgnore', true);

            const diagnostic = createMockDiagnostic({
                message: 'Multi-line diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 7, character: 10 } },
                code: 'multi-line-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(4); // line-level (2) + block-level ignore (1) + workspace (1)
            expect(actions[2].title).to.include('Suppress block with @mago-ignore');
            expect(actions[3].title).to.include('workspace ignore');
        });

        it('should include workspace ignore action when enabled', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showWorkspaceIgnore', true);

            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3); // line-level (2) + workspace (1)
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should exclude workspace ignore action when disabled', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showWorkspaceIgnore', false);

            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(2); // only line-level actions
        });

        it('should handle different issue categories', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Lint diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 'lint-issue',
                magoCategory: 'lint'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
            expect(actions[0].title).to.include('@mago-expect lint:lint-issue');
            expect(actions[1].title).to.include('@mago-ignore lint:lint-issue');
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should handle numeric issue codes', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Numeric code diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: 123,
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
            expect(actions[0].title).to.include('@mago-expect analysis:123');
            expect(actions[1].title).to.include('@mago-ignore analysis:123');
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should handle complex issue codes', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Complex code diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
                code: { value: 'complex-issue', target: 'some-target' },
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
            expect(actions[0].title).to.include('@mago-expect analysis:complex-issue');
            expect(actions[1].title).to.include('@mago-ignore analysis:complex-issue');
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should handle edge case with line 0', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Line 0 diagnostic',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                code: 'line-zero-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
            expect(actions[0].title).to.include('@mago-expect analysis:line-zero-issue');
            expect(actions[1].title).to.include('@mago-ignore analysis:line-zero-issue');
            expect(actions[2].title).to.include('workspace ignore');
        });

        it('should handle all suppression settings disabled', () => {
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineExpect', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showLineIgnore', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockIgnore', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showBlockExpect', false);
            mockWorkspaceConfig.setConfiguration('mago', 'analysis.suppress.showWorkspaceIgnore', false);

            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 5, character: 0 }, end: { line: 7, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(0);
        });
    });

    describe('edge cases', () => {
        it('should handle empty document', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Test diagnostic',
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                code: 'test-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument({ lineCount: 0 });

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
        });

        it('should handle very large line numbers', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Large line diagnostic',
                range: { start: { line: 9999, character: 0 }, end: { line: 9999, character: 10 } },
                code: 'large-line-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
        });

        it('should handle negative line numbers gracefully', () => {
            const diagnostic = createMockDiagnostic({
                message: 'Negative line diagnostic',
                range: { start: { line: -1, character: 0 }, end: { line: -1, character: 10 } },
                code: 'negative-line-issue',
                magoCategory: 'analysis'
            });
            
            const document = createMockDocument();

            const actions = service.createIssueSuppressionActions(diagnostic, document);

            expect(actions).to.have.length(3);
        });
    });
});
