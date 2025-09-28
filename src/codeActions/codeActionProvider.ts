import * as vscode from 'vscode';
import { createCodeSuggestionAction, isSuggestionAllowedByUserSettings } from './suggestionActions';
import { createIssueSuppressionActions } from './suppressionActions';
import { getService } from '../di/container';
import { SuggestionActionsService } from './suggestionActionsWithDI';

/**
 * Registers the Mago code action provider with VS Code
 * This provider offers quick fixes and suppression actions for Mago diagnostics
 */
export function registerCodeActions(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('php', {
		provideCodeActions(document, range, context, token) {
			const availableActions: vscode.CodeAction[] = [];
            
            // 🎯 Get DI service for suggestion actions
            const suggestionService = getService(SuggestionActionsService);
            
            // Process each diagnostic to create appropriate code actions
            for (const diagnostic of context.diagnostics) {
                // Create suggestion actions from Mago's code suggestions
                const magoSuggestions = (diagnostic as vscode.Diagnostic & { magoSuggestions?: unknown[] }).magoSuggestions ?? [];
                
                for (const suggestionGroup of magoSuggestions) {
                    const suggestionAction = createCodeSuggestionAction(suggestionGroup, document);
                    
                    // 🎯 Use DI service to check if suggestion is allowed
                    if (suggestionAction && suggestionService.isSuggestionAllowedByUserSettings(suggestionAction.safety)) {
                        availableActions.push(suggestionAction.action);
                    }
                }

                // Create suppression actions (ignore, expect, workspace ignore)
                const suppressionActions = createIssueSuppressionActions(diagnostic, document);
                availableActions.push(...suppressionActions);
            }
            
			return availableActions;
		}
	}));
}
