/**
 * Interface for workspace operations
 * Allows for easy mocking in unit tests
 */
export interface IWorkspaceService {
    /**
     * Get a configuration value by key
     */
    getConfiguration(section: string): IConfigurationSection;
}

/**
 * Interface for configuration section
 */
export interface IConfigurationSection {
    /**
     * Get a configuration value with optional default
     */
    get<T>(key: string, defaultValue?: T): T | undefined;
}

/**
 * Interface for document operations
 */
export interface IDocumentService {
    /**
     * Get position at character offset
     */
    positionAt(offset: number): IPosition;
}

/**
 * Interface for position
 */
export interface IPosition {
    line: number;
    character: number;
}

/**
 * Interface for workspace edit operations
 */
export interface IWorkspaceEditService {
    /**
     * Insert text at position
     */
    insert(uri: string, position: IPosition, text: string): void;
    
    /**
     * Get the edit data
     */
    getEdits(): Array<{ uri: string; position: IPosition; text: string }>;
}

/**
 * Interface for code action creation
 */
export interface ICodeActionService {
    /**
     * Create a code action
     */
    createCodeAction(title: string, kind: string): ICodeAction;
}

/**
 * Interface for code action
 */
export interface ICodeAction {
    title: string;
    kind: string;
    edit?: IWorkspaceEditService;
}
