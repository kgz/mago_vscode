import { injectable, inject } from 'tsyringe';
import { SuggestionSafetyLevel, CodeSuggestionAction } from './types';
import { IWorkspaceService, IDocumentService, IWorkspaceEditService, ICodeActionService, IPosition } from './services/IWorkspaceService';
import { SuggestionActionsService } from './suggestionSafetyService';

/**
 * Represents a Mago suggestion operation
 */
interface SuggestionOperation {
    type?: string;
    value?: {
        offset?: number;
        text?: string;
        safety_classification?: {
            type?: SuggestionSafetyLevel;
        };
    };
}

/**
 * Service for creating code suggestion actions with full DI support
 */
@injectable()
export class CodeSuggestionActionService {
    constructor(
        @inject('IWorkspaceService') private workspaceService: IWorkspaceService,
        @inject('ICodeActionService') private codeActionService: ICodeActionService,
        @inject(SuggestionActionsService) private suggestionService: SuggestionActionsService
    ) {}

    /**
     * Creates a code action from a Mago suggestion using DI services
     */
    createCodeSuggestionAction(
        suggestionGroup: unknown, 
        documentService: IDocumentService,
        workspaceEditService: IWorkspaceEditService
    ): CodeSuggestionAction | undefined {
        // Extract the patch data from the suggestion group
        const [, patchData] = suggestionGroup as [unknown, { operations?: unknown[] }];
        const operations: unknown[] = Array.isArray(patchData?.operations) ? patchData.operations : [];
        
        let safetyLevel: SuggestionSafetyLevel | undefined;
        
        // Process each operation in the suggestion
        let hasValidOperations = false;
        for (const operation of operations) {
            const insertOperation = operation as SuggestionOperation;
            
            if (insertOperation.type === 'Insert') {
                const operationValue = insertOperation.value;
                if (!operationValue) {
                    continue;
                }
                
                const textOffset = operationValue.offset ?? 0;
                const textToInsert = operationValue.text ?? '';
                safetyLevel = operationValue.safety_classification?.type;
                
                // Convert offset to position and add the edit using DI service
                const insertPosition = documentService.positionAt(textOffset);
                workspaceEditService.insert('', insertPosition, textToInsert);
                hasValidOperations = true;
            }
        }
        
        // If no valid operations were found, return undefined
        if (!hasValidOperations) {
            return undefined;
        }
        
        // Check if suggestion is allowed using DI service
        if (!this.suggestionService.isSuggestionAllowedByUserSettings(safetyLevel)) {
            return undefined;
        }
        
        // Create the code action using DI service
        const codeAction = this.codeActionService.createCodeAction('Mago: Apply suggestion', 'quickfix');
        
        return {
            action: codeAction as any, // Cast to VS Code type for compatibility
            safety: safetyLevel
        };
    }
}

/**
 * Backward compatibility function that creates the service
 * This would be resolved from DI container in real usage
 */
export function createCodeSuggestionActionService(): CodeSuggestionActionService {
    throw new Error('This should be resolved from DI container');
}
