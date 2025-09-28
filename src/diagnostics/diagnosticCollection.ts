import * as vscode from 'vscode';

/**
 * Creates a new diagnostic collection for Mago issues
 * This collection will be used to store and display all Mago diagnostics
 */
export function createMagoDiagnosticCollection(): vscode.DiagnosticCollection {
    return vscode.languages.createDiagnosticCollection('mago');
}

/**
 * Clears all diagnostics from the collection
 * Useful when starting a new analysis run
 */
export function clearAllDiagnostics(collection: vscode.DiagnosticCollection): void {
    collection.clear();
}

/**
 * Sets diagnostics for a specific file
 * Replaces any existing diagnostics for that file
 */
export function setDiagnosticsForFile(
    collection: vscode.DiagnosticCollection, 
    filePath: string, 
    diagnostics: vscode.Diagnostic[]
): void {
    const uri = vscode.Uri.file(filePath);
    collection.set(uri, diagnostics);
}

/**
 * Removes diagnostics for a specific file
 * Useful when a file is deleted or no longer has issues
 */
export function removeDiagnosticsForFile(
    collection: vscode.DiagnosticCollection, 
    filePath: string
): void {
    const uri = vscode.Uri.file(filePath);
    collection.delete(uri);
}

/**
 * Gets the current diagnostics for a specific file
 * Returns undefined if no diagnostics exist for the file
 */
export function getDiagnosticsForFile(
    collection: vscode.DiagnosticCollection, 
    filePath: string
): readonly vscode.Diagnostic[] | undefined {
    const uri = vscode.Uri.file(filePath);
    return collection.get(uri);
}
