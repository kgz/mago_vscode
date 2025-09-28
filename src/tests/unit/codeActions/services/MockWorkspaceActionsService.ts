import { 
    IWorkspaceActionsService, 
    ITextDocument, 
    ITextLine, 
    IWorkspaceEdit, 
    IWorkspace, 
    IWorkspaceFolder, 
    IFileSystem, 
    ICodeAction, 
    IPosition 
} from '../../../../codeActions/services/IWorkspaceActionsService';

/**
 * Mock implementation of ITextDocument for testing
 */
export class MockTextDocument implements ITextDocument {
    constructor(
        public uri: { fsPath: string } = { fsPath: '/test/file.php' },
        private lines: string[] = []
    ) {
        if (lines.length === 0) {
            // Create some default lines
            for (let i = 0; i < 10; i++) {
                this.lines.push(`Line ${i + 1}`);
            }
        }
    }

    lineAt(line: number): ITextLine {
        return {
            text: this.lines[line] || '',
            lineNumber: line
        };
    }

    positionAt(offset: number): IPosition {
        // Simple implementation - assume each line is 20 characters
        const line = Math.floor(offset / 20);
        const character = offset % 20;
        return { line, character };
    }

    setLine(line: number, text: string): void {
        this.lines[line] = text;
    }

    getLineCount(): number {
        return this.lines.length;
    }
}

/**
 * Mock implementation of IWorkspaceEdit for testing
 */
export class MockWorkspaceEdit implements IWorkspaceEdit {
    public insertions: { uri: any; position: IPosition; text: string }[] = [];
    public replacements: { uri: any; range: any; text: string }[] = [];
    public deletions: { uri: any; range: any }[] = [];

    insert(uri: any, position: IPosition, text: string): void {
        this.insertions.push({ uri, position, text });
    }

    replace(uri: any, range: any, text: string): void {
        this.replacements.push({ uri, range, text });
    }

    delete(uri: any, range: any): void {
        this.deletions.push({ uri, range });
    }

    getInsertions(): { uri: any; position: IPosition; text: string }[] {
        return this.insertions;
    }

    getReplacements(): { uri: any; range: any; text: string }[] {
        return this.replacements;
    }

    getDeletions(): { uri: any; range: any }[] {
        return this.deletions;
    }

    clear(): void {
        this.insertions = [];
        this.replacements = [];
        this.deletions = [];
    }
}

/**
 * Mock implementation of IWorkspaceFolder for testing
 */
export class MockWorkspaceFolder implements IWorkspaceFolder {
    constructor(public uri: { fsPath: string } = { fsPath: '/test/workspace' }) {}
}

/**
 * Mock implementation of IWorkspace for testing
 */
export class MockWorkspace implements IWorkspace {
    constructor(
        public workspaceFolders?: IWorkspaceFolder[],
        public textDocuments: ITextDocument[] = []
    ) {}

    setWorkspaceFolders(folders: IWorkspaceFolder[]): void {
        this.workspaceFolders = folders;
    }

    setTextDocuments(documents: ITextDocument[]): void {
        this.textDocuments = documents;
    }
}

/**
 * Mock implementation of IFileSystem for testing
 */
export class MockFileSystem implements IFileSystem {
    private files: Map<string, string> = new Map();

    readFileSync(filePath: string, encoding: string): string {
        const content = this.files.get(filePath);
        if (content === undefined) {
            throw new Error(`File not found: ${filePath}`);
        }
        return content;
    }

    setFileContent(filePath: string, content: string): void {
        this.files.set(filePath, content);
    }

    removeFile(filePath: string): void {
        this.files.delete(filePath);
    }

    hasFile(filePath: string): boolean {
        return this.files.has(filePath);
    }

    getFileContent(filePath: string): string | undefined {
        return this.files.get(filePath);
    }
}

/**
 * Helper function to create mock documents with different configurations
 */
export function createMockDocument(overrides: Partial<ITextDocument> = {}): MockTextDocument {
    return new MockTextDocument(
        overrides.uri,
        []
    );
}

/**
 * Helper function to create mock workspace folders
 */
export function createMockWorkspaceFolder(fsPath: string = '/test/workspace'): MockWorkspaceFolder {
    return new MockWorkspaceFolder({ fsPath });
}

/**
 * Helper function to create mock workspaces
 */
export function createMockWorkspace(
    folders?: IWorkspaceFolder[],
    documents?: ITextDocument[]
): MockWorkspace {
    return new MockWorkspace(folders, documents);
}

/**
 * Helper function to create mock file systems
 */
export function createMockFileSystem(): MockFileSystem {
    return new MockFileSystem();
}
