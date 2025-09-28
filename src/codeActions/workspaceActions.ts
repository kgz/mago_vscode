import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Creates a workspace edit that inserts a pragma comment above the problematic line
 * This is used for adding @mago-expect or @mago-ignore comments
 */
export function createLinePragmaEdit(
    document: vscode.TextDocument, 
    lineNumber: number, 
    pragmaComment: string
): vscode.WorkspaceEdit {
    const workspaceEdit = new vscode.WorkspaceEdit();
    
    // Check if there's already a suppression comment above this line
    const existingSuppression = findExistingSuppressionAbove(document, lineNumber);
    
    if (existingSuppression) {
        // Extract the issue code from the new pragma comment
        const newIssueCode = extractIssueCodeFromPragma(pragmaComment);
        
        // Check if this issue code is already suppressed above
        if (existingSuppression.issueCodes.includes(newIssueCode)) {
            // Issue already suppressed, no need to add it again
            return workspaceEdit;
        }
        
        // Insert a new suppression comment line above the existing one
        const insertPosition = new vscode.Position(existingSuppression.lineNumber, 0);
        const newSuppressionLine = `        // ${pragmaComment}\n`;
        workspaceEdit.insert(document.uri, insertPosition, newSuppressionLine);
    } else {
        // Create new suppression comment above the line with proper indentation
        const phpComment = `// ${pragmaComment}`;
        const insertPosition = new vscode.Position(lineNumber, 0);
        workspaceEdit.insert(document.uri, insertPosition, `        ${phpComment}\n`);
    }
    
    return workspaceEdit;
}

/**
 * Finds existing suppression comment above a line
 * Returns information about the comment if found
 */
function findExistingSuppressionAbove(document: vscode.TextDocument, lineNumber: number): { lineNumber: number; issueCodes: string[] } | null {
    // Look for suppression comments in the lines above (up to 3 lines above)
    for (let i = Math.max(0, lineNumber - 3); i < lineNumber; i++) {
        const line = document.lineAt(i);
        const lineText = line.text.trim();
        
        // Look for existing @mago-expect or @mago-ignore comments
        const suppressionPattern = /\/\/\s*@mago-(expect|ignore)\s+([^\/\n]+)/;
        const match = suppressionPattern.exec(lineText);
        
        if (match) {
            const issueCodesText = match[2].trim();
            
            // Parse comma-separated issue codes (in case there are any)
            const issueCodes = issueCodesText.split(',').map(code => code.trim()).filter(code => code.length > 0);
            
            return {
                lineNumber: i,
                issueCodes: issueCodes
            };
        }
    }
    
    return null;
}

/**
 * Extracts the issue code from a pragma comment string
 */
function extractIssueCodeFromPragma(pragmaComment: string): string {
    // Extract issue code from "@mago-expect analysis:issue-code" format
    const match = pragmaComment.match(/@mago-(expect|ignore)\s+(.+)/);
    return match ? match[2].trim() : pragmaComment;
}

/**
 * Creates a code action that adds an issue code to the workspace ignore list in mago.toml
 * This allows users to suppress specific issues across the entire workspace
 */
export function createWorkspaceIgnoreAction(issueCode: string): vscode.CodeAction | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return undefined; // No workspace folder available
    }
    
    const tomlFilePath = path.join(workspaceFolder.uri.fsPath, 'mago.toml');
    const tomlUri = vscode.Uri.file(tomlFilePath);
    const workspaceEdit = new vscode.WorkspaceEdit();
    
    try {
        const tomlContent = fs.readFileSync(tomlFilePath, 'utf8');
        
        // Try to add the issue to an existing ignore array
        const addedToExistingArray = tryAddToExistingIgnoreArray(tomlContent, issueCode, tomlUri, workspaceEdit);
        if (addedToExistingArray) {
            return createWorkspaceIgnoreCodeAction(workspaceEdit);
        }
        
        // Try to add a new ignore array to an existing analyzer section
        const addedToExistingSection = tryAddIgnoreArrayToExistingSection(tomlContent, issueCode, tomlUri, workspaceEdit);
        if (addedToExistingSection) {
            return createWorkspaceIgnoreCodeAction(workspaceEdit);
        }
        
        // Fallback: append a new analyzer section with ignore array
        appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
        return createWorkspaceIgnoreCodeAction(workspaceEdit);
        
    } catch {
        // If we can't read the file, return undefined
        return undefined;
    }
}

/**
 * Attempts to add the issue code to an existing ignore array in the analyzer section
 */
function tryAddToExistingIgnoreArray(
    tomlContent: string, 
    issueCode: string, 
    tomlUri: vscode.Uri, 
    workspaceEdit: vscode.WorkspaceEdit
): boolean {
    const analyzerSectionMatch = tomlContent.match(/\[analyzer\]/);
    if (!analyzerSectionMatch) {
        return false; // No analyzer section found
    }
    
    const analyzerStartIndex = analyzerSectionMatch.index ?? 0;
    const analyzerSectionContent = extractAnalyzerSectionContent(tomlContent, analyzerStartIndex);
    
    const ignoreArrayMatch = analyzerSectionContent.match(/(^|\n)\s*ignore\s*=\s*\[/);
    if (!ignoreArrayMatch) {
        return false; // No ignore array found
    }
    
    // Find the position of the opening bracket
    const arrayStartIndex = analyzerStartIndex + (ignoreArrayMatch.index ?? 0) + ignoreArrayMatch[0].length - 1;
    
    // Find the matching closing bracket
    const arrayEndIndex = tomlContent.indexOf(']', arrayStartIndex);
    if (arrayEndIndex <= arrayStartIndex) {
        return false; // Malformed array
    }
    
    // Check if the issue code is already in the array
    const arrayContent = tomlContent.slice(arrayStartIndex + 1, arrayEndIndex);
    const escapedIssueCode = issueCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const alreadyExists = new RegExp(`"${escapedIssueCode}"`).test(arrayContent);
    
    if (alreadyExists) {
        return false; // Issue already ignored
    }
    
    // Add the issue code to the array
    const needsComma = arrayContent.trim().length > 0 && !/[,\s]$/.test(arrayContent);
    const newEntry = `${needsComma ? ',' : ''}${arrayContent.trim() ? '\n    ' : ''}"${issueCode}"`;
    const insertText = `${newEntry}\n`;
    
    // Try to find the document in VS Code for precise positioning
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === tomlUri.fsPath);
    if (document) {
        const insertPosition = document.positionAt(arrayEndIndex);
        workspaceEdit.insert(tomlUri, insertPosition, insertText);
    } else {
        // Fallback: append at end of file
        appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
    }
    
    return true;
}

/**
 * Attempts to add a new ignore array to an existing analyzer section
 */
function tryAddIgnoreArrayToExistingSection(
    tomlContent: string, 
    issueCode: string, 
    tomlUri: vscode.Uri, 
    workspaceEdit: vscode.WorkspaceEdit
): boolean {
    const analyzerSectionMatch = tomlContent.match(/\[analyzer\]/);
    if (!analyzerSectionMatch) {
        return false; // No analyzer section found
    }
    
    const analyzerStartIndex = analyzerSectionMatch.index ?? 0;
    const analyzerSectionContent = extractAnalyzerSectionContent(tomlContent, analyzerStartIndex);
    
    // Check if ignore array already exists
    if (analyzerSectionContent.includes('ignore = [')) {
        return false; // Ignore array already exists
    }
    
    // Add ignore array at the end of the analyzer section
    const insertPosition = analyzerStartIndex + analyzerSectionContent.length;
    const ignoreArrayText = `\nignore = [\n    "${issueCode}"\n]\n`;
    
    const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === tomlUri.fsPath);
    if (document) {
        const position = document.positionAt(insertPosition);
        workspaceEdit.insert(tomlUri, position, ignoreArrayText);
    } else {
        // Fallback: append at end of file
        appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
    }
    
    return true;
}

/**
 * Appends a new analyzer section with ignore array at the end of the file
 */
function appendNewAnalyzerSectionWithIgnore(
    issueCode: string, 
    tomlUri: vscode.Uri, 
    workspaceEdit: vscode.WorkspaceEdit
): void {
    const newSectionText = `\n[analyzer]\nignore = [\n    "${issueCode}"\n]\n`;
    const endOfFilePosition = new vscode.Position(Number.MAX_SAFE_INTEGER, 0);
    workspaceEdit.insert(tomlUri, endOfFilePosition, newSectionText);
}

/**
 * Extracts the content of the analyzer section from the TOML file
 */
function extractAnalyzerSectionContent(tomlContent: string, analyzerStartIndex: number): string {
    const contentAfterAnalyzer = tomlContent.slice(analyzerStartIndex);
    const nextSectionIndex = contentAfterAnalyzer.indexOf('\n[', 1);
    
    return nextSectionIndex >= 0 
        ? contentAfterAnalyzer.slice(0, nextSectionIndex)
        : contentAfterAnalyzer;
}

/**
 * Creates a VS Code code action for workspace ignore functionality
 */
function createWorkspaceIgnoreCodeAction(workspaceEdit: vscode.WorkspaceEdit): vscode.CodeAction {
    const action = new vscode.CodeAction('Mago: Ignore in workspace (mago.toml)', vscode.CodeActionKind.QuickFix);
    action.edit = workspaceEdit;
    return action;
}
