import 'reflect-metadata';
import { container } from 'tsyringe';
import { VSCodeConfigurationService } from '../codeActions/services/VSCodeConfigurationService';
import { IConfigurationService } from '../codeActions/services/IConfigurationService';
import { SuggestionActionsService } from '../codeActions/suggestionActionsWithDI';

/**
 * Sets up the dependency injection container for the Mago extension
 * This should be called during extension activation
 */
export function setupDIContainer(): void {
    // Register configuration service
    container.registerSingleton<IConfigurationService>(
        'IConfigurationService',
        VSCodeConfigurationService
    );

    // Register suggestion actions service
    container.registerSingleton(SuggestionActionsService);

    console.log('DI Container initialized');
}

/**
 * Gets a service from the DI container
 * This is the main way to resolve dependencies throughout the extension
 */
export function getService<T>(token: string | symbol | (new (...args: any[]) => T)): T {
    return container.resolve<T>(token);
}

/**
 * Clears the DI container (useful for testing or deactivation)
 */
export function clearDIContainer(): void {
    container.clearInstances();
}
