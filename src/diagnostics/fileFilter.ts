import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * Checks if a file path is in a vendor directory
 * Vendor files are typically third-party dependencies that shouldn't be analyzed
 */
export function isVendorFilePath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath).toLowerCase();
    const pathSeparator = path.sep;
    
    return normalizedPath.includes(`${pathSeparator}vendor${pathSeparator}`) || 
           normalizedPath.includes(`${pathSeparator}vendor-bin${pathSeparator}`);
}

/**
 * Checks if a file path should be included in diagnostics
 * Applies various filtering rules based on file type and location
 */
export function shouldIncludeFileInDiagnostics(
    filePath: string, 
    targetFilePath?: string
): boolean {
    // If we have a target file, only include diagnostics for that file
    if (targetFilePath) {
        return path.normalize(filePath) === path.normalize(targetFilePath);
    }
    
    // Exclude vendor files
    if (isVendorFilePath(filePath)) {
        return false;
    }
    
    // Include all other files
    return true;
}

/**
 * Checks if the workspace has a mago.toml configuration file
 * This indicates that Mago is properly configured for the project
 */
export function hasMagoConfigurationFile(): boolean {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return false;
    }
    
    const tomlPath = path.join(workspaceFolder, 'mago.toml');
    return fs.existsSync(tomlPath);
}

/**
 * Gets the workspace root directory
 * Returns undefined if no workspace is open
 */
export function getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/**
 * Checks if a file is within the workspace
 * Useful for filtering out external files
 */
export function isFileInWorkspace(filePath: string): boolean {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        return false;
    }
    
    const normalizedFilePath = path.normalize(filePath);
    const normalizedWorkspaceRoot = path.normalize(workspaceRoot);
    
    return normalizedFilePath.startsWith(normalizedWorkspaceRoot);
}
