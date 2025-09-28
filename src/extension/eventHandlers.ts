import * as vscode from 'vscode';
import { getConfig } from '../config';
import { workspaceAnalysisManager } from './workspaceAnalysisManager';

/**
 * Manages event handlers for the Mago extension
 * Handles file save, change, and other workspace events
 */
export class MagoEventHandlers {
    private _outputChannel: vscode.OutputChannel | null = null;
    private _diagnosticCollection: vscode.DiagnosticCollection | null = null;
    private _pendingTimer: NodeJS.Timeout | undefined;

    /**
     * Initializes the event handlers with required dependencies
     */
    public initialize(
        outputChannel: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection
    ): void {
        this._outputChannel = outputChannel;
        this._diagnosticCollection = diagnosticCollection;
    }

    /**
     * Registers all event handlers with VS Code
     */
    public registerEventHandlers(context: vscode.ExtensionContext): void {
        // File save event handler
        this.registerSaveEventHandler(context);
        
        // File change event handler
        this.registerChangeEventHandler(context);
    }

    /**
     * Registers the file save event handler
     */
    private registerSaveEventHandler(context: vscode.ExtensionContext): void {
        const handler = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
            this.handleFileSave(document);
        });
        
        context.subscriptions.push(handler);
    }

    /**
     * Registers the file change event handler
     */
    private registerChangeEventHandler(context: vscode.ExtensionContext): void {
        const handler = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
            this.handleFileChange(event);
        });
        
        context.subscriptions.push(handler);
    }

    /**
     * Handles file save events
     * Triggers analysis if configured to run on save
     */
    private handleFileSave(document: vscode.TextDocument): void {
        if (!this._outputChannel || !this._diagnosticCollection) {
            return;
        }

        // Only analyze PHP files
        if (document.languageId !== 'php') {
            return;
        }

        const config = getConfig();
        
        // Only run if configured to analyze on save
        if (config.runOn !== 'save') {
            return;
        }

        // Run workspace analysis with diagnostic collection
        workspaceAnalysisManager.runWorkspaceAnalysis(this._outputChannel, this._diagnosticCollection);
    }

    /**
     * Handles file change events
     * Triggers analysis if configured to run on type (with debouncing)
     */
    private handleFileChange(event: vscode.TextDocumentChangeEvent): void {
        if (!this._outputChannel || !this._diagnosticCollection) {
            return;
        }

        const document = event.document;
        
        // Only analyze PHP files
        if (document.languageId !== 'php') {
            return;
        }

        const config = getConfig();
        
        // Only run if configured to analyze on type
        if (config.runOn !== 'type') {
            return;
        }

        // Clear any pending timer
        if (this._pendingTimer) {
            clearTimeout(this._pendingTimer);
        }

        // Set up debounced analysis
        const debounceMs = Math.max(0, config.debounceMs);
        this._pendingTimer = setTimeout(() => {
            workspaceAnalysisManager.runWorkspaceAnalysis(this._outputChannel!, this._diagnosticCollection!);
        }, debounceMs);
    }

    /**
     * Cleans up event handlers and timers
     */
    public dispose(): void {
        if (this._pendingTimer) {
            clearTimeout(this._pendingTimer);
            this._pendingTimer = undefined;
        }
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoEventHandlers = new MagoEventHandlers();
