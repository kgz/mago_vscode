/**
 * Interface for workspace actions-related VS Code operations
 * Allows for easy mocking in unit tests
 */
export interface ITextDocument {
    uri: { fsPath: string };
    lineAt(line: number): ITextLine;
    positionAt(offset: number): IPosition;
}

export interface ITextLine {
    text: string;
    lineNumber: number;
}

export interface IPosition {
    line: number;
    character: number;
}

export interface IWorkspaceEdit {
    insert(uri: any, position: IPosition, text: string): void;
    replace(uri: any, range: any, text: string): void;
    delete(uri: any, range: any): void;
}

export interface IWorkspaceFolder {
    uri: { fsPath: string };
}

export interface IWorkspace {
    workspaceFolders?: IWorkspaceFolder[];
    textDocuments: ITextDocument[];
}

export interface IFileSystem {
    readFileSync(filePath: string, encoding: string): string;
}

export interface IWorkspaceActionsService {
    createLinePragmaEdit(
        document: ITextDocument,
        lineNumber: number,
        pragmaComment: string
    ): IWorkspaceEdit;
    
    createWorkspaceIgnoreAction(issueCode: string): ICodeAction | undefined;
    
    extractIssueCodeFromPragma(pragmaComment: string): string;
    
    findExistingSuppressionAbove(
        document: ITextDocument,
        lineNumber: number
    ): { lineNumber: number; issueCodes: string[] } | null;
}

export interface ICodeAction {
    title: string;
    kind: string;
    edit?: IWorkspaceEdit;
}
