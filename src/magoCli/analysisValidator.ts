import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AnalysisContext } from './types';

/**
 * Validates analysis prerequisites and requirements
 * Checks for necessary files, configurations, and conditions
 */
export class MagoAnalysisValidator {
    /**
     * Validates that an active editor is available and is a PHP file
     */
    public validateActiveEditor(): { valid: boolean; message?: string } {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            return {
                valid: false,
                message: 'No active editor to analyze.',
            };
        }

        const document = editor.document;
        
        if (document.languageId !== 'php') {
            return {
                valid: false,
                message: 'Current file is not a PHP file.',
            };
        }

        return { valid: true };
    }

    /**
     * Validates that a workspace folder is available
     */
    public validateWorkspaceFolder(): { valid: boolean; message?: string; folderPath?: string } {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        if (!workspaceFolder) {
            return {
                valid: false,
                message: 'No workspace folder to analyze.',
            };
        }

        return {
            valid: true,
            folderPath: workspaceFolder,
        };
    }

    /**
     * Validates that mago.toml exists in the workspace
     */
    public validateMagoTomlExists(workspacePath: string): { valid: boolean; tomlPath: string } {
        const tomlPath = path.join(workspacePath, 'mago.toml');
        const exists = fs.existsSync(tomlPath);
        
        return {
            valid: exists,
            tomlPath,
        };
    }

    /**
     * Validates that the Mago binary is available
     */
    public validateMagoBinary(magoBinary: string | null): { valid: boolean; message?: string } {
        if (!magoBinary) {
            return {
                valid: false,
                message: 'Could not resolve mago binary.',
            };
        }

        return { valid: true };
    }

    /**
     * Validates the complete analysis context
     * Performs all necessary checks for analysis to proceed
     */
    public validateAnalysisContext(context: AnalysisContext): {
        valid: boolean;
        message?: string;
        requiresInit?: boolean;
    } {
        // Check workspace folder
        const workspaceValidation = this.validateWorkspaceFolder();
        if (!workspaceValidation.valid) {
            return {
                valid: false,
                message: workspaceValidation.message,
            };
        }

        // Check mago.toml if required
        if (context.checkTomlExists) {
            const tomlValidation = this.validateMagoTomlExists(workspaceValidation.folderPath!);
            if (!tomlValidation.valid && context.offerInitIfMissing) {
                return {
                    valid: false,
                    message: 'mago.toml not found',
                    requiresInit: true,
                };
            } else if (!tomlValidation.valid) {
                return {
                    valid: false,
                    message: 'mago.toml not found in workspace',
                };
            }
        }

        return { valid: true };
    }

    /**
     * Validates file-specific analysis requirements
     */
    public validateFileAnalysis(document: vscode.TextDocument): {
        valid: boolean;
        message?: string;
        requiresSave?: boolean;
    } {
        // Check if document is dirty and needs saving
        if (document.isDirty) {
            return {
                valid: true,
                requiresSave: true,
            };
        }

        return { valid: true };
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoAnalysisValidator = new MagoAnalysisValidator();
