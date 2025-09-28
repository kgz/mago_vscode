import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateGenerationResult, TemplateGenerationConfig } from './types';

/**
 * Checks if mago.toml already exists in the workspace
 */
export function checkTomlExists(workspacePath: string): boolean {
    const tomlPath = path.join(workspacePath, 'mago.toml');
    return fs.existsSync(tomlPath);
}

/**
 * Creates mago.toml file with the given content
 * Handles file creation and error reporting
 */
export async function createTomlFile(
    workspacePath: string, 
    content: string, 
    config: TemplateGenerationConfig = {
        includeProjectName: true,
        defaultPhpVersion: '8.4.0',
        openAfterCreation: true,
        showSuccessMessage: true,
    }
): Promise<TemplateGenerationResult> {
    const tomlPath = path.join(workspacePath, 'mago.toml');
    
    try {
        // Check if file already exists
        if (fs.existsSync(tomlPath)) {
            return {
                success: false,
                alreadyExists: true,
                error: 'mago.toml already exists',
            };
        }
        
        // Write the file
        fs.writeFileSync(tomlPath, content, { encoding: 'utf8' });
        
        // Open the file if configured to do so
        if (config.openAfterCreation) {
            await openTomlFile(tomlPath);
        }
        
        // Show success message if configured
        if (config.showSuccessMessage) {
            vscode.window.showInformationMessage('Mago: created mago.toml from template.');
        }
        
        return {
            success: true,
            filePath: tomlPath,
            alreadyExists: false,
        };
        
    } catch (error: unknown) {
        const errorMessage = extractErrorMessage(error);
        return {
            success: false,
            error: errorMessage,
            alreadyExists: false,
        };
    }
}

/**
 * Opens the mago.toml file in VS Code
 */
async function openTomlFile(filePath: string): Promise<void> {
    try {
        await vscode.window.showTextDocument(vscode.Uri.file(filePath));
    } catch (error: unknown) {
        // If opening fails, log but don't throw
        console.warn('Failed to open mago.toml file:', error);
    }
}

/**
 * Shows an error message to the user
 */
export function showTomlCreationError(error: string): void {
    vscode.window.showErrorMessage(`Mago: failed to create mago.toml: ${error}`);
}

/**
 * Shows an information message that the file already exists
 */
export function showTomlAlreadyExistsMessage(): void {
    vscode.window.showInformationMessage('Mago: mago.toml already exists.');
}

/**
 * Extracts error message from unknown error object
 */
function extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return String(error);
}
