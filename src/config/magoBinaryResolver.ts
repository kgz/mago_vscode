import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { readMagoConfiguration } from './configReader';

/**
 * Possible locations where Mago binary might be found in a PHP project
 */
const MAGO_BINARY_CANDIDATES = [
    'vendor/bin/mago',
    'vendor/bin/mago.exe',
    'vendor/carthage-software/mago/bin/mago',
] as const;

/**
 * Resolves the path to the Mago binary
 * First checks user-configured path, then searches common locations
 * Falls back to 'mago' (assumes it's in PATH)
 */
export async function resolveMagoBinaryPath(): Promise<string | null> {
    const config = readMagoConfiguration();
    
    // If user has configured a specific path, use it
    if (config.magoPath) {
        return config.magoPath;
    }
    
    // Try to find Mago in the workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
        const binaryPath = findMagoInWorkspace(workspaceFolder);
        if (binaryPath) {
            return binaryPath;
        }
    }
    
    // Fallback: assume Mago is in PATH
    return 'mago';
}

/**
 * Searches for Mago binary in common locations within the workspace
 */
function findMagoInWorkspace(workspacePath: string): string | null {
    for (const candidate of MAGO_BINARY_CANDIDATES) {
        const fullPath = path.join(workspacePath, candidate);
        
        try {
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        } catch {
            // If we can't check the file, continue to next candidate
            continue;
        }
    }
    
    return null;
}

/**
 * Validates that a Mago binary exists at the given path
 * Returns true if the binary exists and is executable
 */
export function validateMagoBinary(binaryPath: string): boolean {
    try {
        return fs.existsSync(binaryPath);
    } catch {
        return false;
    }
}

/**
 * Gets the directory containing the Mago binary
 * Useful for setting working directory when running Mago
 */
export function getMagoBinaryDirectory(binaryPath: string): string {
    return path.dirname(binaryPath);
}
