import * as vscode from 'vscode';
import { magoExtensionManager } from './extensionManager';

/**
 * Activates the Mago VS Code extension
 * This is the main entry point for the extension
 */
export function activate(context: vscode.ExtensionContext): void {
    magoExtensionManager.activate(context);
}

/**
 * Deactivates the Mago VS Code extension
 * This is called when the extension is disabled or VS Code is shutting down
 */
export function deactivate(): void {
    magoExtensionManager.deactivate();
}
