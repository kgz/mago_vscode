import * as vscode from 'vscode';
import { parseMagoJsonOutput } from './jsonParser';
import { convertMagoIssueToDiagnostic } from './diagnosticConverter';
import { shouldIncludeFileInDiagnostics } from './fileFilter';
import { setDiagnosticsForFile, clearAllDiagnostics } from './diagnosticCollection';

/**
 * Publishes diagnostics from Mago JSON output for a specific file
 * This is used when analyzing a single file
 */
export async function publishDiagnosticsForFile(
    jsonText: string, 
    analyzedFilePath: string, 
    outputChannel: vscode.OutputChannel, 
    diagnosticCollection: vscode.DiagnosticCollection | undefined
): Promise<void> {
    if (!diagnosticCollection) {
        return;
    }
    
    const issues = parseMagoJsonOutput(jsonText);
    const fileDiagnostics: vscode.Diagnostic[] = [];
    
    for (const issue of issues) {
        const diagnostic = await convertMagoIssueToDiagnostic(issue, analyzedFilePath);
        
        if (!diagnostic) {
            continue;
        }
        
        // Check if this diagnostic is for the target file
        const issueFilePath = extractFilePathFromDiagnostic(diagnostic);
        if (!issueFilePath || !shouldIncludeFileInDiagnostics(issueFilePath, analyzedFilePath)) {
            continue;
        }
        
        fileDiagnostics.push(diagnostic);
        
        // Log the diagnostic to output channel
        logDiagnosticToOutput(diagnostic, issueFilePath, outputChannel);
    }
    
    // Set diagnostics for the analyzed file
    setDiagnosticsForFile(diagnosticCollection, analyzedFilePath, fileDiagnostics);
}

/**
 * Publishes diagnostics from Mago JSON output for the entire workspace
 * This is used when analyzing the whole workspace
 */
export async function publishWorkspaceDiagnostics(
    jsonText: string, 
    outputChannel: vscode.OutputChannel, 
    diagnosticCollection: vscode.DiagnosticCollection | undefined
): Promise<void> {
    if (!diagnosticCollection) {
        return;
    }
    
    const issues = parseMagoJsonOutput(jsonText);
    const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();
    
    for (const issue of issues) {
        const diagnostic = await convertMagoIssueToDiagnostic(issue, '');
        
        if (!diagnostic) {
            continue;
        }
        
        const issueFilePath = extractFilePathFromDiagnostic(diagnostic);
        if (!issueFilePath || !shouldIncludeFileInDiagnostics(issueFilePath)) {
            continue;
        }
        
        // Group diagnostics by file
        const existingDiagnostics = diagnosticsByFile.get(issueFilePath) ?? [];
        existingDiagnostics.push(diagnostic);
        diagnosticsByFile.set(issueFilePath, existingDiagnostics);
    }
    
    // Clear all existing diagnostics and set new ones
    clearAllDiagnostics(diagnosticCollection);
    
    for (const [filePath, diagnostics] of diagnosticsByFile) {
        setDiagnosticsForFile(diagnosticCollection, filePath, diagnostics);
    }
}

/**
 * Extracts the file path from a diagnostic's related information
 * This is a helper function to get the file path that the diagnostic refers to
 */
function extractFilePathFromDiagnostic(diagnostic: vscode.Diagnostic): string | null {
    // The file path is typically stored in the related information
    if (diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0) {
        const firstRelatedInfo = diagnostic.relatedInformation[0];
        if (firstRelatedInfo.location.uri.scheme === 'file') {
            return firstRelatedInfo.location.uri.fsPath;
        }
    }
    
    return null;
}

/**
 * Logs diagnostic information to the output channel
 * Provides debugging information about what diagnostics were created
 */
function logDiagnosticToOutput(
    diagnostic: vscode.Diagnostic, 
    filePath: string, 
    outputChannel: vscode.OutputChannel
): void {
    try {
        const startLine = diagnostic.range.start.line + 1;
        const startCharacter = diagnostic.range.start.character + 1;
        const code = diagnostic.code ? String(diagnostic.code) : '';
        const message = diagnostic.message;
        
        const logMessage = `[mago][diag][file] ${filePath}:${startLine}:${startCharacter} ${code} ${message}`.trim();
        outputChannel.appendLine(logMessage);
    } catch {
        // If logging fails, continue silently
    }
}
