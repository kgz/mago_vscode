import { injectable, inject } from 'tsyringe';
import { extractIssueCodeFromDiagnostic, determineIssueCategory } from './diagnosticUtils';
import { 
    ISuppressionService, 
    IDiagnostic, 
    ITextDocument, 
    ICodeAction, 
    IWorkspaceEdit, 
    IWorkspaceConfiguration, 
    SuppressionActionSettings 
} from './services/ISuppressionService';

/**
 * DI-based suppression actions service
 */
@injectable()
export class SuppressionActionsService implements ISuppressionService {
    constructor(
        @inject('IWorkspaceConfiguration') private workspaceConfig: IWorkspaceConfiguration
    ) {}

    /**
     * Creates all available suppression actions for a diagnostic issue
     */
    createIssueSuppressionActions(
        diagnostic: IDiagnostic,
        document: ITextDocument
    ): ICodeAction[] {
        // Extract the issue code and category
        const issueCode = extractIssueCodeFromDiagnostic(diagnostic as any);
        const issueCategory = determineIssueCategory(diagnostic as any) ?? 'analysis';
        const fullIssueCode = issueCode ? `${issueCategory}:${issueCode}` : undefined;
        
        // If we can't determine the issue code, we can't create suppression actions
        if (!fullIssueCode) {
            return [];
        }
        
        const diagnosticRange = diagnostic.range;
        const startLine = diagnosticRange.start.line;
        const endLine = diagnosticRange.end.line;
        const isMultiLineIssue = endLine > startLine;
        
        // Create the pragma codes for suppression
        const expectPragma = `@mago-expect ${fullIssueCode}`;
        const ignorePragma = `@mago-ignore ${fullIssueCode}`;
        
        // Get user's suppression preferences
        const suppressionSettings = this.getUserSuppressionSettings();
        
        const suppressionActions: ICodeAction[] = [];
        
        // Add line-level suppression actions
        suppressionActions.push(...this.createLineLevelSuppressionActions(
            document, 
            startLine, 
            expectPragma, 
            ignorePragma, 
            suppressionSettings
        ));
        
        // Add block-level suppression actions (only for multi-line issues)
        if (isMultiLineIssue) {
            suppressionActions.push(...this.createBlockLevelSuppressionActions(
                document, 
                startLine, 
                expectPragma, 
                ignorePragma, 
                suppressionSettings
            ));
        }
        
        // Add workspace-level suppression action
        if (suppressionSettings.showWorkspaceIgnore) {
            const workspaceAction = this.createWorkspaceIgnoreAction(fullIssueCode);
            if (workspaceAction) {
                suppressionActions.push(workspaceAction);
            }
        }
        
        return suppressionActions;
    }

    /**
     * Gets the user's suppression action preferences from VS Code settings
     */
    getUserSuppressionSettings(): SuppressionActionSettings {
        const magoConfig = this.workspaceConfig.getConfiguration('mago');
        
        return {
            showLineExpect: magoConfig.get<boolean>('analysis.suppress.showLineExpect') ?? true,
            showLineIgnore: magoConfig.get<boolean>('analysis.suppress.showLineIgnore') ?? true,
            showBlockIgnore: magoConfig.get<boolean>('analysis.suppress.showBlockIgnore') ?? true,
            showBlockExpect: magoConfig.get<boolean>('analysis.suppress.showBlockExpect') ?? true,
            showWorkspaceIgnore: magoConfig.get<boolean>('analysis.suppress.showWorkspaceIgnore') ?? true,
        };
    }

    /**
     * Creates line-level suppression actions (expect and ignore)
     */
    private createLineLevelSuppressionActions(
        document: ITextDocument,
        lineNumber: number,
        expectPragma: string,
        ignorePragma: string,
        settings: SuppressionActionSettings
    ): ICodeAction[] {
        const actions: ICodeAction[] = [];
        
        if (settings.showLineExpect) {
            const actionTitle = `Mago: Suppress with ${expectPragma} (inline)`;
            const edit = this.createMockWorkspaceEdit();
            actions.push(this.createCodeAction(actionTitle, edit));
        }
        
        if (settings.showLineIgnore) {
            const actionTitle = `Mago: Suppress with ${ignorePragma} (inline)`;
            const edit = this.createMockWorkspaceEdit();
            actions.push(this.createCodeAction(actionTitle, edit));
        }
        
        return actions;
    }

    /**
     * Creates block-level suppression actions (expect and ignore)
     */
    private createBlockLevelSuppressionActions(
        document: ITextDocument,
        lineNumber: number,
        expectPragma: string,
        ignorePragma: string,
        settings: SuppressionActionSettings
    ): ICodeAction[] {
        const actions: ICodeAction[] = [];
        const insertLine = Math.max(0, lineNumber); // Ensure we don't go below line 0
        
        if (settings.showBlockIgnore) {
            const actionTitle = `Mago: Suppress block with ${ignorePragma}`;
            const edit = this.createMockWorkspaceEdit();
            actions.push(this.createCodeAction(actionTitle, edit));
        }
        
        if (settings.showBlockExpect) {
            const actionTitle = `Mago: Expect issue for block with ${expectPragma}`;
            const edit = this.createMockWorkspaceEdit();
            actions.push(this.createCodeAction(actionTitle, edit));
        }
        
        return actions;
    }

    /**
     * Creates a code action with the given title and edit
     */
    private createCodeAction(title: string, edit: IWorkspaceEdit): ICodeAction {
        return {
            title,
            kind: 'quickfix',
            edit
        };
    }

    /**
     * Creates a mock workspace edit for testing
     */
    private createMockWorkspaceEdit(): IWorkspaceEdit {
        return {
            insert: (uri: any, position: any, text: string) => {},
            replace: (uri: any, range: any, text: string) => {},
            delete: (uri: any, range: any) => {}
        };
    }

    /**
     * Creates a workspace ignore action for testing
     */
    private createWorkspaceIgnoreAction(issueCode: string): ICodeAction | null {
        return {
            title: `Mago: Add ${issueCode} to workspace ignore`,
            kind: 'quickfix',
            edit: this.createMockWorkspaceEdit()
        };
    }
}
