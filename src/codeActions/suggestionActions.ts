import * as vscode from 'vscode';
import { SuggestionSafetyLevel, CodeSuggestionAction } from './types';

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
 * Creates a VS Code code action from a Mago suggestion
 * Processes the suggestion operations and creates the appropriate edits
 */
export function createCodeSuggestionAction(
    suggestionGroup: unknown, 
    document: vscode.TextDocument
): CodeSuggestionAction | undefined {
    // Extract the patch data from the suggestion group
    const [, patchData] = suggestionGroup as [unknown, { operations?: unknown[] }];
    const operations: unknown[] = Array.isArray(patchData?.operations) ? patchData.operations : [];
    
    const workspaceEdit = new vscode.WorkspaceEdit();
    let safetyLevel: SuggestionSafetyLevel | undefined;
    
    // Process each operation in the suggestion
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
            
            // Convert offset to VS Code position and add the edit
            const insertPosition = document.positionAt(textOffset);
            workspaceEdit.insert(document.uri, insertPosition, textToInsert);
        }
    }
    
    // Create the VS Code code action
    const codeAction = new vscode.CodeAction('Mago: Apply suggestion', vscode.CodeActionKind.QuickFix);
    codeAction.edit = workspaceEdit;
    
    return { 
        action: codeAction, 
        safety: safetyLevel 
    };
}

/**
 * Checks if a suggestion with the given safety level is allowed based on user settings
 */
export function isSuggestionAllowedByUserSettings(safetyLevel: SuggestionSafetyLevel | undefined): boolean {
    const magoConfig = vscode.workspace.getConfiguration('mago');
    
    const allowUnsafeSuggestions = magoConfig.get<boolean>('analysis.apply.allowUnsafe') ?? false;
    const allowPotentiallyUnsafeSuggestions = magoConfig.get<boolean>('analysis.apply.allowPotentiallyUnsafe') ?? false;
    
    switch (safetyLevel) {
        case 'Safe':
            // Safe suggestions are always allowed
            return true;
            
        case 'PotentiallyUnsafe':
            // Potentially unsafe suggestions require user permission
            return allowPotentiallyUnsafeSuggestions;
            
        case 'Unsafe':
            // Unsafe suggestions require explicit user permission
            return allowUnsafeSuggestions;
            
        default:
            // Unknown safety levels are allowed by default (conservative approach)
            return true;
    }
}
