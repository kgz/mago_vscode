import { MagoExtensionConfig, AnalysisTriggerMode } from './types';

/**
 * Validation result for configuration
 */
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validates the Mago extension configuration
 * Checks for invalid values and provides helpful error messages
 */
export function validateMagoConfiguration(config: MagoExtensionConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate runOn mode
    if (!isValidAnalysisTriggerMode(config.runOn)) {
        errors.push(`Invalid runOn mode: ${config.runOn}. Must be one of: save, type, manual`);
    }
    
    // Validate minimumFailLevel
    if (!isValidFailLevel(config.minimumFailLevel)) {
        errors.push(`Invalid minimumFailLevel: ${config.minimumFailLevel}. Must be one of: note, help, warning, error`);
    }
    
    // Validate debounceMs
    if (config.debounceMs < 0) {
        errors.push('debounceMs must be a non-negative number');
    } else if (config.debounceMs < 100) {
        warnings.push('debounceMs is very low (< 100ms), which may cause performance issues');
    } else if (config.debounceMs > 5000) {
        warnings.push('debounceMs is very high (> 5000ms), which may make the extension feel unresponsive');
    }
    
    // Validate magoPath if provided
    if (config.magoPath && !isValidPath(config.magoPath)) {
        warnings.push('magoPath appears to be invalid. Mago may not be found at this location');
    }
    
    // Validate analyzer args
    if (config.analyzerArgs.length > 10) {
        warnings.push('Many analyzer arguments provided. This may slow down analysis');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Checks if the analysis trigger mode is valid
 */
function isValidAnalysisTriggerMode(mode: string): mode is AnalysisTriggerMode {
    return ['save', 'type', 'manual'].includes(mode);
}

/**
 * Checks if the fail level is valid
 */
function isValidFailLevel(level: string): boolean {
    return ['note', 'help', 'warning', 'error'].includes(level);
}

/**
 * Basic path validation
 */
function isValidPath(path: string): boolean {
    // Basic checks for a valid path
    return path.length > 0 && !path.includes('\0');
}

/**
 * Gets a human-readable description of the current configuration
 * Useful for debugging and user feedback
 */
export function describeConfiguration(config: MagoExtensionConfig): string {
    const parts: string[] = [];
    
    parts.push(`Analysis trigger: ${config.runOn}`);
    parts.push(`Minimum fail level: ${config.minimumFailLevel}`);
    parts.push(`Debounce: ${config.debounceMs}ms`);
    
    if (config.magoPath) {
        parts.push(`Mago path: ${config.magoPath}`);
    } else {
        parts.push('Mago path: auto-detect');
    }
    
    if (config.analyzerArgs.length > 0) {
        parts.push(`Extra args: ${config.analyzerArgs.join(' ')}`);
    }
    
    if (config.dryRun) {
        parts.push('Mode: dry-run (debug)');
    }
    
    if (config.allowUnsafe || config.allowPotentiallyUnsafe) {
        const unsafeLevels = [];
        if (config.allowPotentiallyUnsafe) {
            unsafeLevels.push('potentially unsafe');
        }
        if (config.allowUnsafe) {
            unsafeLevels.push('unsafe');
        }
        parts.push(`Allowed suggestions: ${unsafeLevels.join(', ')}`);
    }
    
    return parts.join(' | ');
}
