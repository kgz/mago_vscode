import * as vscode from 'vscode';
import { getConfig } from '../config';
import { createDiagnosticsCollection } from '../diagnostics';
import { registerCodeActions } from '../codeActions';
import { magoCommandRegistry } from './commandRegistry';
import { magoEventHandlers } from './eventHandlers';
import { magoStatusBarManager } from './statusBarManager';
import { workspaceAnalysisManager } from './workspaceAnalysisManager';
import { ExtensionActivationConfig } from './types';

/**
 * Main extension manager for the Mago VS Code extension
 * Handles activation, deactivation, and coordination of all extension components
 */
export class MagoExtensionManager {
    private _context: vscode.ExtensionContext | null = null;
    private _outputChannel: vscode.OutputChannel | null = null;
    private _diagnosticCollection: vscode.DiagnosticCollection | null = null;
    private _statusBarItem: vscode.StatusBarItem | null = null;

    /**
     * Activates the Mago extension
     * Sets up all components and registers event handlers
     */
    public activate(context: vscode.ExtensionContext): void {
        this._context = context;
        
        // Create output channel
        this._outputChannel = vscode.window.createOutputChannel('Mago');
        context.subscriptions.push(this._outputChannel);
        
        // Create diagnostic collection
        this._diagnosticCollection = createDiagnosticsCollection();
        context.subscriptions.push(this._diagnosticCollection);
        
        // Create status bar item
        this._statusBarItem = magoStatusBarManager.createStatusBarItem();
        context.subscriptions.push(this._statusBarItem);
        
        // Initialize components
        this.initializeComponents();
        
        // Register commands and event handlers
        this.registerComponents(context);
        
        // Run initial analysis if configured
        this.runInitialAnalysisIfConfigured();
        
        console.log('Mago extension activated');
    }

    /**
     * Deactivates the Mago extension
     * Cleans up all resources and components
     */
    public deactivate(): void {
        // Reset workspace analysis manager
        workspaceAnalysisManager.reset();
        
        // Dispose of event handlers
        magoEventHandlers.dispose();
        
        // Dispose of status bar manager
        magoStatusBarManager.dispose();
        
        // Clear all diagnostics
        if (this._diagnosticCollection) {
            this._diagnosticCollection.clear();
        }
        
        console.log('Mago extension deactivated');
    }

    /**
     * Initializes all extension components
     */
    private initializeComponents(): void {
        if (!this._outputChannel || !this._diagnosticCollection || !this._statusBarItem) {
            return;
        }

        // Initialize command registry
        magoCommandRegistry.initialize(
            this._outputChannel,
            this._diagnosticCollection,
            this._statusBarItem
        );
        
        // Initialize event handlers
        magoEventHandlers.initialize(this._outputChannel);
    }

    /**
     * Registers all extension components with VS Code
     */
    private registerComponents(context: vscode.ExtensionContext): void {
        // Register commands
        magoCommandRegistry.registerCommands(context);
        
        // Register event handlers
        magoEventHandlers.registerEventHandlers(context);
        
        // Register code actions
        registerCodeActions(context);
    }

    /**
     * Runs initial analysis if configured to do so
     */
    private runInitialAnalysisIfConfigured(): void {
        const config = getConfig();
        
        if (config.runOn === 'manual') {
            return; // Don't run initial analysis if set to manual
        }
        
        // Run initial workspace analysis after a short delay
        const delay = 1000; // 1 second delay
        setTimeout(() => {
            vscode.commands.executeCommand('mago.analyzeWorkspace');
        }, delay);
    }

    /**
     * Gets the current extension context
     */
    public getContext(): vscode.ExtensionContext | null {
        return this._context;
    }

    /**
     * Gets the output channel
     */
    public getOutputChannel(): vscode.OutputChannel | null {
        return this._outputChannel;
    }

    /**
     * Gets the diagnostic collection
     */
    public getDiagnosticCollection(): vscode.DiagnosticCollection | null {
        return this._diagnosticCollection;
    }

    /**
     * Gets the status bar item
     */
    public getStatusBarItem(): vscode.StatusBarItem | null {
        return this._statusBarItem;
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoExtensionManager = new MagoExtensionManager();
