import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
const { expect } = require('chai');
import { container } from 'tsyringe';
import { WorkspaceActionsService } from '../../../codeActions/workspaceActions';
import { 
    MockWorkspace, 
    MockFileSystem, 
    MockTextDocument, 
    MockWorkspaceEdit,
    createMockDocument, 
    createMockWorkspaceFolder, 
    createMockWorkspace, 
    createMockFileSystem 
} from './services/MockWorkspaceActionsService';

describe('Workspace Actions Service Unit Tests', () => {
    let service: WorkspaceActionsService;
    let mockWorkspace: MockWorkspace;
    let mockFileSystem: MockFileSystem;

    beforeEach(() => {
        // Clear container and register mock services
        container.clearInstances();
        
        mockWorkspace = createMockWorkspace();
        mockFileSystem = createMockFileSystem();
        
        container.registerInstance('IWorkspace', mockWorkspace);
        container.registerInstance('IFileSystem', mockFileSystem);
        
        // Get the service from DI container
        service = container.resolve(WorkspaceActionsService);
    });

    describe('extractIssueCodeFromPragma', () => {
        it('should extract issue code from @mago-expect pragma', () => {
            const result = service.extractIssueCodeFromPragma('@mago-expect analysis:unhandled-thrown-type');
            expect(result).to.equal('analysis:unhandled-thrown-type');
        });

        it('should extract issue code from @mago-ignore pragma', () => {
            const result = service.extractIssueCodeFromPragma('@mago-ignore lint:unused-variable');
            expect(result).to.equal('lint:unused-variable');
        });

        it('should handle pragma with extra whitespace', () => {
            const result = service.extractIssueCodeFromPragma('@mago-expect   analysis:invalid-operand   ');
            expect(result).to.equal('analysis:invalid-operand');
        });

        it('should handle multiple issue codes', () => {
            const result = service.extractIssueCodeFromPragma('@mago-expect analysis:invalid-operand,analysis:invalid-return-statement');
            expect(result).to.equal('analysis:invalid-operand,analysis:invalid-return-statement');
        });

        it('should return original string if no match', () => {
            const result = service.extractIssueCodeFromPragma('invalid-pragma');
            expect(result).to.equal('invalid-pragma');
        });

        it('should handle empty string', () => {
            const result = service.extractIssueCodeFromPragma('');
            expect(result).to.equal('');
        });

        it('should handle malformed pragma', () => {
            const result = service.extractIssueCodeFromPragma('@mago-expect');
            expect(result).to.equal('@mago-expect');
        });

        it('should handle pragma without issue code', () => {
            const result = service.extractIssueCodeFromPragma('@mago-expect ');
            expect(result).to.equal('@mago-expect ');
        });
    });

    describe('findExistingSuppressionAbove', () => {
        it('should find existing @mago-expect pragma', () => {
            const document = createMockDocument();
            document.setLine(5, '        // @mago-expect analysis:unhandled-thrown-type');
            document.setLine(6, '        $this->someMethod();');

            const result = service.findExistingSuppressionAbove(document, 6);

            expect(result).to.not.be.null;
            expect(result!.lineNumber).to.equal(5);
            expect(result!.issueCodes).to.deep.equal(['analysis:unhandled-thrown-type']);
        });

        it('should find existing @mago-ignore pragma', () => {
            const document = createMockDocument();
            document.setLine(3, '        // @mago-ignore lint:unused-variable');
            document.setLine(4, '        $variable = "test";');

            const result = service.findExistingSuppressionAbove(document, 4);

            expect(result).to.not.be.null;
            expect(result!.lineNumber).to.equal(3);
            expect(result!.issueCodes).to.deep.equal(['lint:unused-variable']);
        });

        it('should handle multiple issue codes', () => {
            const document = createMockDocument();
            document.setLine(1, '        // @mago-expect analysis:invalid-operand,analysis:invalid-return-statement');
            document.setLine(2, '        return $response . \'\';');

            const result = service.findExistingSuppressionAbove(document, 2);

            expect(result).to.not.be.null;
            expect(result!.lineNumber).to.equal(1);
            expect(result!.issueCodes).to.deep.equal(['analysis:invalid-operand', 'analysis:invalid-return-statement']);
        });

        it('should return null if no suppression found', () => {
            const document = createMockDocument();
            document.setLine(5, '        // Regular comment');
            document.setLine(6, '        $this->someMethod();');

            const result = service.findExistingSuppressionAbove(document, 6);

            expect(result).to.be.null;
        });

        it('should search up to 3 lines above', () => {
            const document = createMockDocument();
            document.setLine(2, '        // @mago-expect analysis:test-issue');
            document.setLine(3, '        // Regular comment');
            document.setLine(4, '        // Another comment');
            document.setLine(5, '        $this->someMethod();');

            const result = service.findExistingSuppressionAbove(document, 5);

            expect(result).to.not.be.null;
            expect(result!.lineNumber).to.equal(2);
        });
    });

    describe('createLinePragmaEdit', () => {
        it('should create edit for new suppression comment', () => {
            const document = createMockDocument();
            document.setLine(5, '        $this->someMethod();');

            const edit = service.createLinePragmaEdit(document, 5, '@mago-expect analysis:unhandled-thrown-type');

            expect(edit).to.not.be.null;
            expect(edit.insert).to.be.a('function');
        });

        it('should create edit for existing suppression comment', () => {
            const document = createMockDocument();
            document.setLine(4, '        // @mago-expect analysis:existing-issue');
            document.setLine(5, '        $this->someMethod();');

            const edit = service.createLinePragmaEdit(document, 5, '@mago-expect analysis:new-issue');

            expect(edit).to.not.be.null;
            expect(edit.insert).to.be.a('function');
        });

        it('should not create edit if issue already suppressed', () => {
            const document = createMockDocument();
            document.setLine(4, '        // @mago-expect analysis:existing-issue');
            document.setLine(5, '        $this->someMethod();');

            const edit = service.createLinePragmaEdit(document, 5, '@mago-expect analysis:existing-issue');

            expect(edit).to.not.be.null;
        });
    });

    describe('createWorkspaceIgnoreAction', () => {
        it('should return undefined when no workspace folder', () => {
            mockWorkspace.setWorkspaceFolders([]);

            const result = service.createWorkspaceIgnoreAction('analysis:test-issue');

            expect(result).to.be.undefined;
        });

        it('should return undefined when mago.toml file does not exist', () => {
            const workspaceFolder = createMockWorkspaceFolder('/test/workspace');
            mockWorkspace.setWorkspaceFolders([workspaceFolder]);

            const result = service.createWorkspaceIgnoreAction('analysis:test-issue');

            expect(result).to.be.undefined;
        });

        it('should create action for empty mago.toml file', () => {
            const workspaceFolder = createMockWorkspaceFolder('/test/workspace');
            mockWorkspace.setWorkspaceFolders([workspaceFolder]);
            mockFileSystem.setFileContent('/test/workspace/mago.toml', '');

            const result = service.createWorkspaceIgnoreAction('analysis:test-issue');

            expect(result).to.not.be.undefined;
            expect(result!.title).to.equal('Mago: Ignore in workspace (mago.toml)');
            expect(result!.kind).to.equal('quickfix');
        });

        it('should create action for mago.toml with existing analyzer section', () => {
            const workspaceFolder = createMockWorkspaceFolder('/test/workspace');
            mockWorkspace.setWorkspaceFolders([workspaceFolder]);
            mockFileSystem.setFileContent('/test/workspace/mago.toml', '[analyzer]\nphp-version = "8.2"');

            const result = service.createWorkspaceIgnoreAction('analysis:test-issue');

            expect(result).to.not.be.undefined;
            expect(result!.title).to.equal('Mago: Ignore in workspace (mago.toml)');
        });

        it('should not create action if issue already in ignore array', () => {
            const workspaceFolder = createMockWorkspaceFolder('/test/workspace');
            mockWorkspace.setWorkspaceFolders([workspaceFolder]);
            mockFileSystem.setFileContent('/test/workspace/mago.toml', '[analyzer]\nignore = ["analysis:existing-issue"]');

            const result = service.createWorkspaceIgnoreAction('analysis:existing-issue');

            expect(result).to.be.undefined;
        });
    });
});