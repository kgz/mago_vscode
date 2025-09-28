import * as vscode from 'vscode';
import { extractIssueCodeFromDiagnostic, determineIssueCategory } from './diagnosticUtils';
import { createLinePragmaEdit, createWorkspaceIgnoreAction } from './workspaceActions';

/**
 * Configuration for which suppression actions to show
 */
interface SuppressionActionSettings {
    showLineExpect: boolean;
    showLineIgnore: boolean;
    showBlockIgnore: boolean;
    showBlockExpect: boolean;
    showWorkspaceIgnore: boolean;
}

/**
 * Creates all available suppression actions for a diagnostic issue
 * Returns actions for line-level, block-level, and workspace-level suppressions
 */
export function createIssueSuppressionActions(
    diagnostic: vscode.Diagnostic, 
    document: vscode.TextDocument
): vscode.CodeAction[] {
    // Extract the issue code and category
    const issueCode = extractIssueCodeFromDiagnostic(diagnostic);
    const issueCategory = determineIssueCategory(diagnostic) ?? 'analysis';
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
    const suppressionSettings = getUserSuppressionSettings();
    
    const suppressionActions: vscode.CodeAction[] = [];
    
    // Add line-level suppression actions
    suppressionActions.push(...createLineLevelSuppressionActions(
        document, 
        startLine, 
        expectPragma, 
        ignorePragma, 
        suppressionSettings
    ));
    
    // Add block-level suppression actions (only for multi-line issues)
    if (isMultiLineIssue) {
        suppressionActions.push(...createBlockLevelSuppressionActions(
            document, 
            startLine, 
            expectPragma, 
            ignorePragma, 
            suppressionSettings
        ));
    }
    
    // Add workspace-level suppression action
    if (suppressionSettings.showWorkspaceIgnore) {
        const workspaceAction = createWorkspaceIgnoreAction(fullIssueCode);
        if (workspaceAction) {
            suppressionActions.push(workspaceAction);
        }
    }
    
    return suppressionActions;
}

/**
 * Gets the user's suppression action preferences from VS Code settings
 */
export function getUserSuppressionSettings(): SuppressionActionSettings {
    const magoConfig = vscode.workspace.getConfiguration('mago');
    
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
function createLineLevelSuppressionActions(
    document: vscode.TextDocument,
    lineNumber: number,
    expectPragma: string,
    ignorePragma: string,
    settings: SuppressionActionSettings
): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    if (settings.showLineExpect) {
        const actionTitle = `Mago: Suppress with ${expectPragma} (inline)`;
        const edit = createLinePragmaEdit(document, lineNumber, expectPragma);
        actions.push(createCodeAction(actionTitle, edit));
    }
    
    if (settings.showLineIgnore) {
        const actionTitle = `Mago: Suppress with ${ignorePragma} (inline)`;
        const edit = createLinePragmaEdit(document, lineNumber, ignorePragma);
        actions.push(createCodeAction(actionTitle, edit));
    }
    
    return actions;
}

/**
 * Creates block-level suppression actions (expect and ignore)
 */
function createBlockLevelSuppressionActions(
    document: vscode.TextDocument,
    lineNumber: number,
    expectPragma: string,
    ignorePragma: string,
    settings: SuppressionActionSettings
): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const insertLine = Math.max(0, lineNumber); // Ensure we don't go below line 0
    
    if (settings.showBlockIgnore) {
        const actionTitle = `Mago: Suppress block with ${ignorePragma}`;
        const edit = createLinePragmaEdit(document, insertLine, ignorePragma);
        actions.push(createCodeAction(actionTitle, edit));
    }
    
    if (settings.showBlockExpect) {
        const actionTitle = `Mago: Expect issue for block with ${expectPragma}`;
        const edit = createLinePragmaEdit(document, insertLine, expectPragma);
        actions.push(createCodeAction(actionTitle, edit));
    }
    
    return actions;
}

/**
 * Creates a VS Code code action with the given title and edit
 */
function createCodeAction(title: string, edit: vscode.WorkspaceEdit): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.edit = edit;
    return action;
}
