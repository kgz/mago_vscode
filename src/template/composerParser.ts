import * as path from 'path';
import * as fs from 'fs';
import { ComposerConfig, PhpVersion } from './types';

/**
 * Parses composer.json file and extracts project information
 * Returns undefined if parsing fails or file doesn't exist
 */
export function parseComposerConfig(workspacePath: string): ComposerConfig | undefined {
    const composerPath = path.join(workspacePath, 'composer.json');
    
    if (!fs.existsSync(composerPath)) {
        return undefined;
    }
    
    try {
        const composerContent = fs.readFileSync(composerPath, 'utf8');
        const composerConfig = JSON.parse(composerContent) as ComposerConfig;
        return composerConfig;
    } catch {
        return undefined;
    }
}

/**
 * Extracts the project name from composer.json
 * Returns undefined if not found or invalid
 */
export function extractProjectName(composerConfig: ComposerConfig | undefined): string | undefined {
    if (!composerConfig?.name || typeof composerConfig.name !== 'string') {
        return undefined;
    }
    
    return composerConfig.name;
}

/**
 * Extracts PHP version constraint from composer.json
 * Checks both platform.php and require.php fields
 */
export function extractPhpVersionConstraint(composerConfig: ComposerConfig | undefined): string | undefined {
    if (!composerConfig) {
        return undefined;
    }
    
    // Check platform.php first (more specific)
    const platformPhp = composerConfig.config?.platform?.php;
    if (platformPhp) {
        return platformPhp;
    }
    
    // Fall back to require.php
    const requirePhp = composerConfig.require?.php;
    if (requirePhp) {
        return requirePhp;
    }
    
    return undefined;
}

/**
 * Derives a specific PHP version from a version constraint
 * Handles various constraint formats like "^8.1", ">=8.0", "~8.1.0"
 */
export function derivePhpVersionFromConstraint(constraint: string): string | undefined {
    const versionMatches = [...constraint.matchAll(/(\d+)\.(\d+)(?:\.(\d+))?/g)];
    
    if (versionMatches.length === 0) {
        return undefined;
    }
    
    let bestVersion: PhpVersion | undefined;
    
    for (const match of versionMatches) {
        const major = Number(match[1]);
        const minor = Number(match[2]);
        const patch = match[3] !== undefined ? Number(match[3]) : 0;
        
        if (!bestVersion) {
            bestVersion = { major, minor, patch };
            continue;
        }
        
        // Find the highest version
        if (major > bestVersion.major || 
            (major === bestVersion.major && minor > bestVersion.minor) ||
            (major === bestVersion.major && minor === bestVersion.minor && patch > bestVersion.patch)) {
            bestVersion = { major, minor, patch };
        }
    }
    
    if (!bestVersion) {
        return undefined;
    }
    
    return `${bestVersion.major}.${bestVersion.minor}.${bestVersion.patch}`;
}

/**
 * Gets the PHP version to use for the template
 * Tries to detect from composer.json, falls back to default
 */
export function getPhpVersionForTemplate(
    workspacePath: string, 
    defaultVersion: string = '8.4.0'
): string {
    const composerConfig = parseComposerConfig(workspacePath);
    const constraint = extractPhpVersionConstraint(composerConfig);
    
    if (!constraint) {
        return defaultVersion;
    }
    
    const derivedVersion = derivePhpVersionFromConstraint(constraint);
    return derivedVersion ?? defaultVersion;
}
