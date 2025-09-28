/**
 * Represents a Composer.json configuration
 */
export interface ComposerConfig {
    name?: string;
    config?: {
        platform?: {
            php?: string;
        };
    };
    require?: {
        php?: string;
    };
}

/**
 * Represents PHP version information
 */
export interface PhpVersion {
    major: number;
    minor: number;
    patch: number;
}

/**
 * Configuration for template generation
 */
export interface TemplateGenerationConfig {
    /** Whether to include project name in the header */
    includeProjectName: boolean;
    /** Default PHP version if none can be detected */
    defaultPhpVersion: string;
    /** Whether to open the generated file after creation */
    openAfterCreation: boolean;
    /** Whether to show success message */
    showSuccessMessage: boolean;
}

/**
 * Template generation result
 */
export interface TemplateGenerationResult {
    /** Whether the template was successfully created */
    success: boolean;
    /** Path to the created file */
    filePath?: string;
    /** Error message if creation failed */
    error?: string;
    /** Whether the file already existed */
    alreadyExists: boolean;
}
