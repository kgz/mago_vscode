import * as vscode from 'vscode';
import { magoAnalysisRunner } from './analysisRunner';
import { WorkspaceProcessReference } from './types';

/**
 * Analyzes the currently active file
 * Validates prerequisites and runs Mago analysis
 * 
 * @deprecated Use magoAnalysisRunner.analyzeActiveFile() instead
 */
export async function analyzeActiveFile(
    output: vscode.OutputChannel, 
    magoDiagnostics: vscode.DiagnosticCollection | undefined
): Promise<void> {
    await magoAnalysisRunner.analyzeActiveFile(output, magoDiagnostics);
}

/**
 * Analyzes the entire workspace
 * Validates prerequisites and runs Mago analysis
 * 
 * @deprecated Use magoAnalysisRunner.analyzeWorkspace() instead
 */
export async function analyzeWorkspace(
    output: vscode.OutputChannel, 
    magoDiagnostics: vscode.DiagnosticCollection | undefined, 
    currentWorkspaceChildRef: WorkspaceProcessReference
): Promise<void> {
    await magoAnalysisRunner.analyzeWorkspace(output, magoDiagnostics, currentWorkspaceChildRef);
}
