import { magoTemplateManager } from './templateManager';

/**
 * Offers to initialize mago.toml if it doesn't exist
 * This is the main entry point for template initialization
 * 
 * @deprecated Use magoTemplateManager.offerInitialization() instead
 */
export async function maybeOfferInit(folder: string): Promise<void> {
    await magoTemplateManager.offerInitialization(folder);
}

/**
 * Creates mago.toml from composer template
 * Analyzes composer.json and generates appropriate configuration
 * 
 * @deprecated Use magoTemplateManager.createTomlFromTemplate() instead
 */
export async function createTomlFromComposerTemplate(folder: string): Promise<void> {
    await magoTemplateManager.createTomlFromTemplate(folder);
}
