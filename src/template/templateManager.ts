import * as vscode from 'vscode';
import { parseComposerConfig, extractProjectName, getPhpVersionForTemplate } from './composerParser';
import { generateCompleteTomlContent } from './templateGenerator';
import { createTomlFile, checkTomlExists, showTomlCreationError, showTomlAlreadyExistsMessage } from './fileOperations';
import { TemplateGenerationConfig, TemplateGenerationResult } from './types';

/**
 * Main template manager for the Mago extension
 * Handles template creation, initialization prompts, and file management
 */
export class MagoTemplateManager {
    private _defaultConfig: TemplateGenerationConfig = {
        includeProjectName: true,
        defaultPhpVersion: '8.4.0',
        openAfterCreation: true,
        showSuccessMessage: true,
    };

    /**
     * Offers to initialize mago.toml if it doesn't exist
     * Shows a warning message with options to create or cancel
     */
    public async offerInitialization(workspacePath: string): Promise<void> {
        if (checkTomlExists(workspacePath)) {
            return; // File already exists, no need to offer initialization
        }

        const choice = await vscode.window.showWarningMessage(
            'Mago: mago.toml was not found in this workspace. Initialize configuration?',
            'Create mago.toml from template',
            'Cancel'
        );

        if (choice === 'Create mago.toml from template') {
            await this.createTomlFromTemplate(workspacePath);
        }
    }

    /**
     * Creates mago.toml from template with automatic project detection
     * Analyzes composer.json to extract project information
     */
    public async createTomlFromTemplate(workspacePath: string): Promise<TemplateGenerationResult> {
        try {
            // Check if file already exists
            if (checkTomlExists(workspacePath)) {
                showTomlAlreadyExistsMessage();
                return {
                    success: false,
                    alreadyExists: true,
                    error: 'mago.toml already exists',
                };
            }

            // Extract project information from composer.json
            const composerConfig = parseComposerConfig(workspacePath);
            const projectName = extractProjectName(composerConfig);
            const phpVersion = getPhpVersionForTemplate(workspacePath, this._defaultConfig.defaultPhpVersion);

            // Generate the template content
            const content = generateCompleteTomlContent(projectName, phpVersion);

            // Create the file
            const result = await createTomlFile(workspacePath, content, this._defaultConfig);

            // Handle errors
            if (!result.success && result.error) {
                showTomlCreationError(result.error);
            }

            return result;

        } catch (error: unknown) {
            const errorMessage = this.extractErrorMessage(error);
            showTomlCreationError(errorMessage);
            
            return {
                success: false,
                error: errorMessage,
                alreadyExists: false,
            };
        }
    }

    /**
     * Creates mago.toml with custom configuration
     * Allows overriding default settings
     */
    public async createTomlWithConfig(
        workspacePath: string, 
        config: Partial<TemplateGenerationConfig> = {}
    ): Promise<TemplateGenerationResult> {
        const mergedConfig = { ...this._defaultConfig, ...config };
        
        try {
            // Check if file already exists
            if (checkTomlExists(workspacePath)) {
                if (mergedConfig.showSuccessMessage) {
                    showTomlAlreadyExistsMessage();
                }
                return {
                    success: false,
                    alreadyExists: true,
                    error: 'mago.toml already exists',
                };
            }

            // Extract project information
            const composerConfig = parseComposerConfig(workspacePath);
            const projectName = mergedConfig.includeProjectName ? extractProjectName(composerConfig) : undefined;
            const phpVersion = getPhpVersionForTemplate(workspacePath, mergedConfig.defaultPhpVersion);

            // Generate content
            const content = generateCompleteTomlContent(projectName, phpVersion);

            // Create file
            const result = await createTomlFile(workspacePath, content, mergedConfig);

            if (!result.success && result.error) {
                showTomlCreationError(result.error);
            }

            return result;

        } catch (error: unknown) {
            const errorMessage = this.extractErrorMessage(error);
            showTomlCreationError(errorMessage);
            
            return {
                success: false,
                error: errorMessage,
                alreadyExists: false,
            };
        }
    }

    /**
     * Updates the default configuration
     */
    public updateDefaultConfig(config: Partial<TemplateGenerationConfig>): void {
        this._defaultConfig = { ...this._defaultConfig, ...config };
    }

    /**
     * Gets the current default configuration
     */
    public getDefaultConfig(): Readonly<TemplateGenerationConfig> {
        return { ...this._defaultConfig };
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
export const magoTemplateManager = new MagoTemplateManager();
