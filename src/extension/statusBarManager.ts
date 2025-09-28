import * as vscode from 'vscode';

/**
 * Manages the Mago status bar item
 * Handles status bar creation, updates, and disposal
 */
export class MagoStatusBarManager {
    private _statusBarItem: vscode.StatusBarItem | null = null;

    /**
     * Creates and configures the status bar item
     */
    public createStatusBarItem(): vscode.StatusBarItem {
        if (this._statusBarItem) {
            return this._statusBarItem;
        }

        this._statusBarItem = vscode.window.createStatusBarItem(
            'mago.status',
            vscode.StatusBarAlignment.Left,
            100
        );

        this.configureStatusBarItem();
        return this._statusBarItem;
    }

    /**
     * Configures the status bar item with default settings
     */
    private configureStatusBarItem(): void {
        if (!this._statusBarItem) {
            return;
        }

        this._statusBarItem.text = 'Mago: Idle';
        this._statusBarItem.tooltip = 'Run Mago analysis for current file';
        this._statusBarItem.command = 'mago.analyzeFile';
        this._statusBarItem.show();
    }

    /**
     * Updates the status bar text
     */
    public updateStatus(text: string): void {
        if (this._statusBarItem) {
            this._statusBarItem.text = text;
        }
    }

    /**
     * Updates the status bar tooltip
     */
    public updateTooltip(tooltip: string): void {
        if (this._statusBarItem) {
            this._statusBarItem.tooltip = tooltip;
        }
    }

    /**
     * Updates the status bar command
     */
    public updateCommand(command: string): void {
        if (this._statusBarItem) {
            this._statusBarItem.command = command;
        }
    }

    /**
     * Shows the status bar item
     */
    public show(): void {
        if (this._statusBarItem) {
            this._statusBarItem.show();
        }
    }

    /**
     * Hides the status bar item
     */
    public hide(): void {
        if (this._statusBarItem) {
            this._statusBarItem.hide();
        }
    }

    /**
     * Gets the current status bar item
     */
    public getStatusBarItem(): vscode.StatusBarItem | null {
        return this._statusBarItem;
    }

    /**
     * Disposes of the status bar item
     */
    public dispose(): void {
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = null;
        }
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoStatusBarManager = new MagoStatusBarManager();
