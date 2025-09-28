import { 
    IVSCodeService, 
    ICodeActionsProvider, 
    IExtensionContext, 
    IDocument, 
    IRange, 
    ICodeActionContext, 
    ICodeAction, 
    ICancellationToken 
} from '../../../../codeActions/services/IVSCodeService';

/**
 * Mock implementation of IVSCodeService for testing
 */
export class MockVSCodeService implements IVSCodeService {
    private registeredProviders: Array<{
        selector: string;
        provider: ICodeActionsProvider;
        context: IExtensionContext;
    }> = [];

    registerCodeActionsProvider(
        selector: string,
        provider: ICodeActionsProvider,
        context: IExtensionContext
    ): void {
        this.registeredProviders.push({ selector, provider, context });
        
        // Mock adding to subscriptions
        context.subscriptions.push({
            dispose: () => {
                // Mock disposal
            }
        });
    }

    /**
     * Get registered providers for testing
     */
    getRegisteredProviders(): Array<{
        selector: string;
        provider: ICodeActionsProvider;
        context: IExtensionContext;
    }> {
        return [...this.registeredProviders];
    }

    /**
     * Clear registered providers
     */
    clearProviders(): void {
        this.registeredProviders = [];
    }

    /**
     * Test a provider with mock data
     */
    async testProvider(
        selector: string,
        document: IDocument,
        range: IRange,
        context: ICodeActionContext,
        token: ICancellationToken
    ): Promise<ICodeAction[]> {
        const registeredProvider = this.registeredProviders.find(p => p.selector === selector);
        if (!registeredProvider) {
            throw new Error(`No provider registered for selector: ${selector}`);
        }

        const result = registeredProvider.provider.provideCodeActions(
            document,
            range,
            context,
            token
        );

        if (result instanceof Promise) {
            return await result;
        } else {
            return result;
        }
    }
}
