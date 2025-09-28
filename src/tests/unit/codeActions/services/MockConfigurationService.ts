import { IConfigurationService } from '../../../../codeActions/services/IConfigurationService';

/**
 * Mock implementation of IConfigurationService for unit testing
 * Allows us to control configuration values in tests
 */
export class MockConfigurationService implements IConfigurationService {
    private config: Record<string, any> = {};

    /**
     * Set a configuration value for testing
     */
    setConfig(key: string, value: any): void {
        this.config[key] = value;
    }

    /**
     * Clear all configuration values
     */
    clearConfig(): void {
        this.config = {};
    }

    get<T>(key: string): T | undefined {
        return this.config[key];
    }

    getOrDefault<T>(key: string, defaultValue: T): T {
        return this.config[key] ?? defaultValue;
    }
}
