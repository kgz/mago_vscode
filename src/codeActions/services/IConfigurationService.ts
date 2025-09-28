/**
 * Interface for accessing VS Code configuration
 * Allows for easy mocking in unit tests
 */
export interface IConfigurationService {
    /**
     * Get a configuration value by key
     */
    get<T>(key: string): T | undefined;
    
    /**
     * Get a configuration value with a default fallback
     */
    getOrDefault<T>(key: string, defaultValue: T): T;
}

/**
 * Configuration keys used by the Mago extension
 */
export const CONFIG_KEYS = {
    ALLOW_UNSAFE: 'analysis.apply.allowUnsafe',
    ALLOW_POTENTIALLY_UNSAFE: 'analysis.apply.allowPotentiallyUnsafe'
} as const;
