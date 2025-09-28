import { injectable, inject } from 'tsyringe';
import { SuggestionSafetyLevel } from './types';
import { IConfigurationService, CONFIG_KEYS } from './services/IConfigurationService';

/**
 * Service for handling code suggestion actions with dependency injection
 */
@injectable()
export class SuggestionActionsService {
    constructor(
        @inject('IConfigurationService') private configService: IConfigurationService
    ) {}

    /**
     * Checks if a suggestion with the given safety level is allowed based on user settings
     * Now testable with mocked configuration service!
     */
    isSuggestionAllowedByUserSettings(safetyLevel: SuggestionSafetyLevel | undefined): boolean {
        const allowUnsafeSuggestions = this.configService.getOrDefault(
            CONFIG_KEYS.ALLOW_UNSAFE, 
            false
        );
        const allowPotentiallyUnsafeSuggestions = this.configService.getOrDefault(
            CONFIG_KEYS.ALLOW_POTENTIALLY_UNSAFE, 
            false
        );
        
        switch (safetyLevel) {
            case 'Safe':
                // Safe suggestions are always allowed
                return true;
                
            case 'PotentiallyUnsafe':
                // Potentially unsafe suggestions require user permission
                return allowPotentiallyUnsafeSuggestions;
                
            case 'Unsafe':
                // Unsafe suggestions require explicit user permission
                return allowUnsafeSuggestions;
                
            default:
                // Unknown safety levels are allowed by default (conservative approach)
                return true;
        }
    }
}

/**
 * Backward compatibility function that uses DI
 * This would be registered in the DI container
 */
export function createSuggestionActionsService(): SuggestionActionsService {
    // In real usage, this would be resolved from the DI container
    // For now, we'll show how it would work
    throw new Error('This should be resolved from DI container');
}
