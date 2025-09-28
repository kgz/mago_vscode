import * as vscode from 'vscode';
import { injectable } from 'tsyringe';
import { 
    IVSCodeService, 
    ICodeActionsProvider, 
    IExtensionContext, 
    IDocument, 
    IRange, 
    ICodeActionContext, 
    ICodeAction, 
    ICancellationToken 
} from './IVSCodeService';

/**
 * VS Code implementation of the VS Code service
 */
@injectable()
export class VSCodeService implements IVSCodeService {
    registerCodeActionsProvider(
        selector: string,
        provider: ICodeActionsProvider,
        context: IExtensionContext
    ): void {
        const vscodeProvider: vscode.CodeActionProvider = {
            provideCodeActions: (document, range, context, token) => {
                // Convert VS Code types to our interface types
                const interfaceDocument: IDocument = {
                    uri: { fsPath: document.uri.fsPath }
                };

                const interfaceRange: IRange = {
                    start: { line: range.start.line, character: range.start.character },
                    end: { line: range.end.line, character: range.end.character }
                };

                const interfaceContext: ICodeActionContext = {
                    diagnostics: context.diagnostics.map(d => ({
                        message: d.message,
                        magoSuggestions: (d as any).magoSuggestions
                    }))
                };

                const interfaceToken: ICancellationToken = {
                    isCancellationRequested: token.isCancellationRequested
                };

                // Call the interface method
                const result = provider.provideCodeActions(
                    interfaceDocument,
                    interfaceRange,
                    interfaceContext,
                    interfaceToken
                );

                // Convert back to VS Code types if needed
                if (result instanceof Promise) {
                    return result.then(actions => 
                        actions.map(action => ({
                            title: action.title,
                            kind: vscode.CodeActionKind.QuickFix
                        } as vscode.CodeAction))
                    );
                } else {
                    return result.map(action => ({
                        title: action.title,
                        kind: vscode.CodeActionKind.QuickFix
                    } as vscode.CodeAction));
                }
            }
        };

        // Register with VS Code
        const disposable = vscode.languages.registerCodeActionsProvider(selector, vscodeProvider);
        (context as any).subscriptions.push(disposable);
    }
}
