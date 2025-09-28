import * as vscode from 'vscode';
import { analyzeActiveFile } from '../magoCli';
import { workspaceAnalysisManager } from './workspaceAnalysisManager';
import { getConfig } from '../config';

/**
 * Registers all Mago extension commands
 * Handles command registration and error handling
 */
export class MagoCommandRegistry {
    private _statusBarItem: vscode.StatusBarItem | null = null;
    private _outputChannel: vscode.OutputChannel | null = null;
    private _diagnosticCollection: vscode.DiagnosticCollection | null = null;

    /**
     * Initializes the command registry with required dependencies
     */
    public initialize(
        outputChannel: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection,
        statusBarItem: vscode.StatusBarItem
    ): void {
        this._outputChannel = outputChannel;
        this._diagnosticCollection = diagnosticCollection;
        this._statusBarItem = statusBarItem;
    }

    /**
     * Registers all Mago commands with VS Code
     */
    public registerCommands(context: vscode.ExtensionContext): void {
        // Hello World sample command
        // this.registerHelloWorldCommand(context);
        
        // File analysis command
        this.registerFileAnalysisCommand(context);
        
        // Workspace analysis command
        this.registerWorkspaceAnalysisCommand(context);
        
        // TOML change reanalysis command
        this.registerTomlChangeCommand(context);
    }

    // /**
    //  * Registers the hello world sample command
    //  */
    // private registerHelloWorldCommand(context: vscode.ExtensionContext): void {
    //     const command = vscode.commands.registerCommand('mago-problems.helloWorld', () => {
    //         vscode.window.showInformationMessage('Hello from Mago extension');
    //     });
        
    //     context.subscriptions.push(command);
    // }

    /**
     * Registers the file analysis command
     */
    private registerFileAnalysisCommand(context: vscode.ExtensionContext): void {
        const command = vscode.commands.registerCommand('mago.analyzeFile', async() => {
            await this.runFileAnalysisWithStatus();
        });
        
        context.subscriptions.push(command);
    }

    /**
     * Registers the workspace analysis command
     */
    private registerWorkspaceAnalysisCommand(context: vscode.ExtensionContext): void {
        const command = vscode.commands.registerCommand('mago.analyzeWorkspace', async() => {
            await this.runWorkspaceAnalysisWithStatus();
        });
        
        context.subscriptions.push(command);
    }

    /**
     * Registers the TOML change reanalysis command
     */
    private registerTomlChangeCommand(context: vscode.ExtensionContext): void {
        const command = vscode.commands.registerCommand('mago.reanalyzeAfterTomlChange', async(uri?: vscode.Uri) => {
            await this.handleTomlChangeReanalysis(uri);
        });
        
        context.subscriptions.push(command);
    }

    /**
     * Runs file analysis with status bar updates
     */
    private async runFileAnalysisWithStatus(): Promise<void> {
        if (!this._statusBarItem || !this._outputChannel || !this._diagnosticCollection) {
            return;
        }

        this._statusBarItem.text = 'Mago: Analyzing file…';
        
        try {
            await analyzeActiveFile(this._outputChannel, this._diagnosticCollection);
        } catch (error: unknown) {
            const errorMessage = this.extractErrorMessage(error);
            vscode.window.showErrorMessage(`Mago file analyze failed: ${errorMessage}`);
            this._outputChannel.appendLine(String(error));
        } finally {
            this._statusBarItem.text = 'Mago: Idle';
        }
    }

    /**
     * Runs workspace analysis with status bar updates
     */
    private async runWorkspaceAnalysisWithStatus(): Promise<void> {
        if (!this._statusBarItem || !this._outputChannel || !this._diagnosticCollection) {
            return;
        }

        this._statusBarItem.text = 'Mago: Analyzing workspace…';
        
        try {
            await workspaceAnalysisManager.runWorkspaceAnalysis(this._outputChannel, this._diagnosticCollection ?? undefined);
        } catch (error: unknown) {
            const errorMessage = this.extractErrorMessage(error);
            vscode.window.showErrorMessage(`Mago workspace analyze failed: ${errorMessage}`);
            this._outputChannel.appendLine(String(error));
        } finally {
            this._statusBarItem.text = 'Mago: Idle';
        }
    }

    /**
     * Handles TOML change reanalysis
     */
    private async handleTomlChangeReanalysis(uri?: vscode.Uri): Promise<void> {
        if (!this._outputChannel) {
            return;
        }

        try {
            // Save the document if it's dirty
            if (uri) {
                const document = await vscode.workspace.openTextDocument(uri);
                if (document.isDirty) {
                    await document.save();
                }
            }
            
            // Re-run workspace analysis
            await workspaceAnalysisManager.runWorkspaceAnalysis(this._outputChannel, this._diagnosticCollection ?? undefined);
        } catch (error: unknown) {
            const errorMessage = this.extractErrorMessage(error);
            vscode.window.showErrorMessage(`Mago: failed to reanalyze after mago.toml change: ${errorMessage}`);
        }
    }

    /**
     * Extracts error message from unknown error object
     */
    private extractErrorMessage(error: unknown): string {
        if (error && typeof error === 'object' && 'message' in error) {
            return String((error as { message: unknown }).message);
        }
        return String(error);
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoCommandRegistry = new MagoCommandRegistry();
