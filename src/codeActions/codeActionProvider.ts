import { injectable, inject } from 'tsyringe';
import { CodeSuggestionActionService } from './suggestionActions';
import { SuppressionActionsService } from './suppressionActions';
import { WorkspaceActionsService } from './workspaceActions';
import { IVSCodeService, ICodeActionsProvider, IExtensionContext, IDocument, IRange, ICodeActionContext, ICodeAction, ICancellationToken } from './services/IVSCodeService';
import { getService } from '../di/container';

/**
 * Code action provider service with full DI support
 */
@injectable()
export class CodeActionProviderService implements ICodeActionsProvider {
    constructor(
        @inject('IVSCodeService') private vscodeService: IVSCodeService,
        @inject(CodeSuggestionActionService) private suggestionActionService: CodeSuggestionActionService,
        @inject(SuppressionActionsService) private suppressionActionsService: SuppressionActionsService,
        @inject(WorkspaceActionsService) private workspaceActionsService: WorkspaceActionsService
    ) {}

    /**
     * Registers the Mago code action provider with VS Code using DI
     */
    registerCodeActions(context: IExtensionContext): void {
        this.vscodeService.registerCodeActionsProvider('php', this, context);
    }

    /**
     * Provide code actions for a document (implements ICodeActionsProvider)
     */
    provideCodeActions(
        document: IDocument,
        range: IRange,
        context: ICodeActionContext,
        token: ICancellationToken
    ): ICodeAction[] {
        const availableActions: ICodeAction[] = [];
        
        // Create mock document and workspace edit services for testing
        // In real usage, these would be injected via DI
        const documentService = {
            positionAt: (offset: number) => ({ line: 0, character: offset }),
            getText: () => '',
            getLineText: (line: number) => '',
            getLineCount: () => 1,
            getUri: () => document.uri.fsPath
        };
        
        const workspaceEditService = {
            insert: (uri: string, position: any, text: string) => {},
            replace: (uri: string, range: any, text: string) => {},
            delete: (uri: string, range: any) => {},
            apply: async () => true,
            getEdits: () => []
        };
        
        // Process each diagnostic to create appropriate code actions
        for (const diagnostic of context.diagnostics) {
            // Create suggestion actions from Mago's code suggestions
            const magoSuggestions = diagnostic.magoSuggestions ?? [];
            
            for (const suggestionGroup of magoSuggestions) {
                const suggestionAction = this.suggestionActionService.createCodeSuggestionAction(
                    suggestionGroup, 
                    documentService, 
                    workspaceEditService
                );
                
                if (suggestionAction) {
                    availableActions.push({
                        title: suggestionAction.action.title,
                        kind: 'quickfix'
                    });
                }
            }

            // Create suppression actions using DI
            const suppressionActions = this.suppressionActionsService.createIssueSuppressionActions(
                diagnostic as any, 
                document as any
            );
            
            for (const suppressionAction of suppressionActions) {
                availableActions.push({
                    title: suppressionAction.title,
                    kind: suppressionAction.kind,
                    edit: suppressionAction.edit
                });
            }
        }
        
        return availableActions;
    }
}

/**
 * Registers the Mago code action provider with VS Code using DI
 * This provider offers quick fixes and suppression actions for Mago diagnostics
 */
export function registerCodeActions(context: any) {
    const codeActionProviderService = getService(CodeActionProviderService);
    codeActionProviderService.registerCodeActions(context);
}
