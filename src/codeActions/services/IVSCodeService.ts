/**
 * Interface for VS Code API operations
 * Allows for easy mocking in unit tests
 */
export interface IVSCodeService {
    /**
     * Register a code actions provider
     */
    registerCodeActionsProvider(
        selector: string,
        provider: ICodeActionsProvider,
        context: IExtensionContext
    ): void;
}

/**
 * Interface for code actions provider
 */
export interface ICodeActionsProvider {
    /**
     * Provide code actions for a document
     */
    provideCodeActions(
        document: IDocument,
        range: IRange,
        context: ICodeActionContext,
        token: ICancellationToken
    ): ICodeAction[] | Promise<ICodeAction[]>;
}

/**
 * Interface for extension context
 */
export interface IExtensionContext {
    /**
     * Add subscription to context
     */
    subscriptions: Array<{ dispose(): void }>;
}

/**
 * Interface for document
 */
export interface IDocument {
    uri: { fsPath: string };
}

/**
 * Interface for range
 */
export interface IRange {
    start: { line: number; character: number };
    end: { line: number; character: number };
}

/**
 * Interface for code action context
 */
export interface ICodeActionContext {
    diagnostics: IDiagnostic[];
}

/**
 * Interface for diagnostic
 */
export interface IDiagnostic {
    message: string;
    magoSuggestions?: unknown[];
}

/**
 * Interface for code action
 */
export interface ICodeAction {
    title: string;
    kind: string;
}

/**
 * Interface for cancellation token
 */
export interface ICancellationToken {
    isCancellationRequested: boolean;
}
