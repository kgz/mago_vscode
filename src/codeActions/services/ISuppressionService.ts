/**
 * Interface for suppression-related VS Code operations
 * Allows for easy mocking in unit tests
 */
export interface IDiagnostic {
    message: string;
    range: IRange;
    code?: string | number | { value: string | number; target: any };
    source?: string;
    severity?: number;
    tags?: number[];
    relatedInformation?: any[];
    magoCategory?: string;
}

export interface IRange {
    start: IPosition;
    end: IPosition;
}

export interface IPosition {
    line: number;
    character: number;
}

export interface ITextDocument {
    uri: { fsPath: string };
    lineCount: number;
    lineAt(line: number): ITextLine;
}

export interface ITextLine {
    text: string;
    lineNumber: number;
}

export interface ICodeAction {
    title: string;
    kind: string;
    edit?: IWorkspaceEdit;
}

export interface IWorkspaceEdit {
    insert(uri: any, position: IPosition, text: string): void;
    replace(uri: any, range: IRange, text: string): void;
    delete(uri: any, range: IRange): void;
}

export interface IConfiguration {
    get<T>(key: string, defaultValue?: T): T | undefined;
}

export interface IWorkspaceConfiguration {
    getConfiguration(section: string): IConfiguration;
}

export interface ISuppressionService {
    createIssueSuppressionActions(
        diagnostic: IDiagnostic,
        document: ITextDocument
    ): ICodeAction[];
    
    getUserSuppressionSettings(): SuppressionActionSettings;
}

export interface SuppressionActionSettings {
    showLineExpect: boolean;
    showLineIgnore: boolean;
    showBlockIgnore: boolean;
    showBlockExpect: boolean;
    showWorkspaceIgnore: boolean;
}
