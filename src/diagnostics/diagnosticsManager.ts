import * as vscode from 'vscode';
import { createMagoDiagnosticCollection } from './diagnosticCollection';
import { publishDiagnosticsForFile, publishWorkspaceDiagnostics } from './diagnosticPublisher';
import { countIssuesInJsonOutput } from './jsonParser';

/**
 * Main diagnostics manager for the Mago extension
 * Handles creation, publishing, and management of diagnostic collections
 */
export class MagoDiagnosticsManager {
    private _diagnosticCollection: vscode.DiagnosticCollection | null = null;
    private _outputChannel: vscode.OutputChannel | null = null;

    /**
     * Gets the diagnostic collection, creating it if necessary
     */
    public getDiagnosticCollection(): vscode.DiagnosticCollection {
        this._diagnosticCollection ??= createMagoDiagnosticCollection();
        return this._diagnosticCollection;
    }

    /**
     * Gets the output channel, creating it if necessary
     */
    public getOutputChannel(): vscode.OutputChannel {
        this._outputChannel ??= vscode.window.createOutputChannel('Mago');
        return this._outputChannel;
    }

    /**
     * Publishes diagnostics for a specific file
     * Parses Mago JSON output and creates VS Code diagnostics
     */
    public async publishFileDiagnostics(
        jsonText: string, 
        analyzedFilePath: string
    ): Promise<void> {
        const collection = this.getDiagnosticCollection();
        const output = this.getOutputChannel();
        
        await publishDiagnosticsForFile(jsonText, analyzedFilePath, output, collection);
    }

    /**
     * Publishes diagnostics for the entire workspace
     * Parses Mago JSON output and creates VS Code diagnostics for all files
     */
    public async publishWorkspaceDiagnostics(jsonText: string): Promise<void> {
        const collection = this.getDiagnosticCollection();
        const output = this.getOutputChannel();
        
        await publishWorkspaceDiagnostics(jsonText, output, collection);
    }

    /**
     * Counts the number of issues in Mago JSON output
     * Useful for status bar updates and progress reporting
     */
    public countIssues(jsonText: string): number {
        return countIssuesInJsonOutput(jsonText);
    }

    /**
     * Clears all diagnostics
     * Useful when starting a new analysis or when disabling the extension
     */
    public clearAllDiagnostics(): void {
        const collection = this.getDiagnosticCollection();
        collection.clear();
    }

    /**
     * Disposes of the diagnostics manager
     * Cleans up resources when the extension is deactivated
     */
    public dispose(): void {
        if (this._diagnosticCollection) {
            this._diagnosticCollection.dispose();
            this._diagnosticCollection = null;
        }
        
        if (this._outputChannel) {
            this._outputChannel.dispose();
            this._outputChannel = null;
        }
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoDiagnosticsManager = new MagoDiagnosticsManager();

/**
 * Convenience function to publish diagnostics for a file
 * Uses the singleton diagnostics manager
 */
export async function publishDiagnosticsFromJson(
    jsonText: string, 
    analyzedFilePath: string, 
    output: vscode.OutputChannel, 
    magoDiagnostics: vscode.DiagnosticCollection | undefined
): Promise<void> {
    if (!magoDiagnostics) {
        return;
    }
    
    await publishDiagnosticsForFile(jsonText, analyzedFilePath, output, magoDiagnostics);
}

/**
 * Convenience function to publish workspace diagnostics
 * Uses the singleton diagnostics manager
 */
export async function publishWorkspaceDiagnosticsFromJson(
    jsonText: string, 
    output: vscode.OutputChannel, 
    magoDiagnostics: vscode.DiagnosticCollection | undefined
): Promise<void> {
    if (!magoDiagnostics) {
        return;
    }
    
    await publishWorkspaceDiagnostics(jsonText, output, magoDiagnostics);
}

/**
 * Convenience function to count issues in JSON output
 * Uses the singleton diagnostics manager
 */
export function countIssues(jsonText: string): number {
    return magoDiagnosticsManager.countIssues(jsonText);
}

/**
 * Convenience function to create a diagnostic collection
 * Uses the singleton diagnostics manager
 */
export function createDiagnosticsCollection(): vscode.DiagnosticCollection {
    return magoDiagnosticsManager.getDiagnosticCollection();
}
