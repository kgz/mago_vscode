import 'reflect-metadata';
import { container } from 'tsyringe';
import { VSCodeConfigurationService } from '../codeActions/services/VSCodeConfigurationService';
import { IConfigurationService } from '../codeActions/services/IConfigurationService';
import { SuggestionActionsService } from '../codeActions/suggestionSafetyService';
import { CodeSuggestionActionService } from '../codeActions/suggestionActions';
import { VSCodeWorkspaceService, VSCodeDocumentService, VSCodeWorkspaceEditService, VSCodeCodeActionService } from '../codeActions/services/VSCodeWorkspaceService';
import { IWorkspaceService, ICodeActionService } from '../codeActions/services/IWorkspaceService';
import { VSCodeService } from '../codeActions/services/VSCodeService';
import { IVSCodeService } from '../codeActions/services/IVSCodeService';
import { CodeActionProviderService } from '../codeActions/codeActionProvider';

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

    // Register workspace services
    container.registerSingleton<IWorkspaceService>(
        'IWorkspaceService',
        VSCodeWorkspaceService
    );

    container.registerSingleton<ICodeActionService>(
        'ICodeActionService',
        VSCodeCodeActionService
    );

    // Register VS Code service
    container.registerSingleton<IVSCodeService>(
        'IVSCodeService',
        VSCodeService
    );

    // Register suggestion actions services
    container.registerSingleton(SuggestionActionsService);
    container.registerSingleton(CodeSuggestionActionService);
    container.registerSingleton(CodeActionProviderService);

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
