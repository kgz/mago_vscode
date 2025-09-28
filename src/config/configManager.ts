import { MagoExtensionConfig } from './types';
import { readMagoConfiguration } from './configReader';
import { resolveMagoBinaryPath } from './magoBinaryResolver';
import { validateMagoConfiguration, describeConfiguration } from './configValidator';

/**
 * Main configuration manager for the Mago extension
 * Provides a unified interface for accessing and managing configuration
 */
export class MagoConfigManager {
    private _config: MagoExtensionConfig | null = null;
    private _magoBinaryPath: string | null = null;

    /**
     * Gets the current configuration, loading it if necessary
     */
    public getConfig(): MagoExtensionConfig {
        this._config ??= readMagoConfiguration();
        return this._config;
    }

    /**
     * Gets the resolved Mago binary path, resolving it if necessary
     */
    public async getMagoBinaryPath(): Promise<string | null> {
        this._magoBinaryPath ??= await resolveMagoBinaryPath();
        return this._magoBinaryPath;
    }

    /**
     * Reloads the configuration from VS Code settings
     * Useful when settings change during runtime
     */
    public reloadConfiguration(): void {
        this._config = readMagoConfiguration();
        this._magoBinaryPath = null; // Reset binary path to force re-resolution
    }

    /**
     * Validates the current configuration
     */
    public validateConfiguration() {
        return validateMagoConfiguration(this.getConfig());
    }

    /**
     * Gets a human-readable description of the current configuration
     */
    public describeConfiguration(): string {
        return describeConfiguration(this.getConfig());
    }

    /**
     * Checks if the configuration has changed since last load
     * This is a simple implementation - in a real scenario you might want to
     * listen to VS Code configuration change events
     */
    public hasConfigurationChanged(): boolean {
        const currentConfig = readMagoConfiguration();
        const cachedConfig = this._config;
        
        if (!cachedConfig) {
            return true;
        }
        
        // Simple deep comparison (could be improved with a proper deep equality function)
        return JSON.stringify(currentConfig) !== JSON.stringify(cachedConfig);
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoConfigManager = new MagoConfigManager();

/**
 * Convenience function to get the current configuration
 * Uses the singleton config manager
 */
export function getConfig(): MagoExtensionConfig {
    return magoConfigManager.getConfig();
}

/**
 * Convenience function to resolve the Mago binary path
 * Uses the singleton config manager
 */
export async function resolveMagoBinary(): Promise<string | null> {
    return magoConfigManager.getMagoBinaryPath();
}
