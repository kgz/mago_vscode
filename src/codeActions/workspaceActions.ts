import { injectable, inject } from 'tsyringe';
import * as path from 'path';
import { 
    IWorkspaceActionsService, 
    ITextDocument, 
    IWorkspaceEdit, 
    IWorkspace, 
    IFileSystem, 
    ICodeAction, 
    IPosition 
} from './services/IWorkspaceActionsService';

/**
 * DI-based workspace actions service
 */
@injectable()
export class WorkspaceActionsService implements IWorkspaceActionsService {
    constructor(
        @inject('IWorkspace') private workspace: IWorkspace,
        @inject('IFileSystem') private fileSystem: IFileSystem
    ) {}

    /**
     * Creates a workspace edit that inserts a pragma comment above the problematic line
     * This is used for adding @mago-expect or @mago-ignore comments
     */
    createLinePragmaEdit(
        document: ITextDocument,
        lineNumber: number,
        pragmaComment: string
    ): IWorkspaceEdit {
        const workspaceEdit = this.createMockWorkspaceEdit();
        
        // Check if there's already a suppression comment above this line
        const existingSuppression = this.findExistingSuppressionAbove(document, lineNumber);
        
        if (existingSuppression) {
            // Extract the issue code from the new pragma comment
            const newIssueCode = this.extractIssueCodeFromPragma(pragmaComment);
            
            // Check if this issue code is already suppressed above
            if (existingSuppression.issueCodes.includes(newIssueCode)) {
                // Issue already suppressed, no need to add it again
                return workspaceEdit;
            }
            
            // Insert a new suppression comment line above the existing one
            const insertPosition: IPosition = { line: existingSuppression.lineNumber, character: 0 };
            const newSuppressionLine = `        // ${pragmaComment}\n`;
            workspaceEdit.insert(document.uri, insertPosition, newSuppressionLine);
        } else {
            // Create new suppression comment above the line with proper indentation
            const phpComment = `// ${pragmaComment}`;
            const insertPosition: IPosition = { line: lineNumber, character: 0 };
            workspaceEdit.insert(document.uri, insertPosition, `        ${phpComment}\n`);
        }
        
        return workspaceEdit;
    }

    /**
     * Creates a code action that adds an issue code to the workspace ignore list in mago.toml
     * This allows users to suppress specific issues across the entire workspace
     */
    createWorkspaceIgnoreAction(issueCode: string): ICodeAction | undefined {
        const workspaceFolder = this.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined; // No workspace folder available
        }
        
        const tomlFilePath = path.join(workspaceFolder.uri.fsPath, 'mago.toml');
        const tomlUri = { fsPath: tomlFilePath };
        const workspaceEdit = this.createMockWorkspaceEdit();
        
        try {
            const tomlContent = this.fileSystem.readFileSync(tomlFilePath, 'utf8');
            
            // Try to add the issue to an existing ignore array
            const addedToExistingArray = this.tryAddToExistingIgnoreArray(tomlContent, issueCode, tomlUri, workspaceEdit);
            if (addedToExistingArray) {
                return this.createWorkspaceIgnoreCodeAction(workspaceEdit);
            }
            
            // Check if issue already exists in ignore array (tryAddToExistingIgnoreArray returns false for this case)
            const analyzerSectionMatch = tomlContent.match(/\[analyzer\]/);
            if (analyzerSectionMatch) {
                const analyzerStartIndex = analyzerSectionMatch.index ?? 0;
                const analyzerSectionContent = this.extractAnalyzerSectionContent(tomlContent, analyzerStartIndex);
                const ignoreArrayMatch = analyzerSectionContent.match(/(^|\n)\s*ignore\s*=\s*\[/);
                if (ignoreArrayMatch) {
                    const arrayStartIndex = analyzerStartIndex + (ignoreArrayMatch.index ?? 0) + ignoreArrayMatch[0].length - 1;
                    const arrayEndIndex = tomlContent.indexOf(']', arrayStartIndex);
                    if (arrayEndIndex > arrayStartIndex) {
                        const arrayContent = tomlContent.slice(arrayStartIndex + 1, arrayEndIndex);
                        const escapedIssueCode = issueCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const alreadyExists = new RegExp(`"${escapedIssueCode}"`).test(arrayContent);
                        if (alreadyExists) {
                            return undefined; // Issue already ignored
                        }
                    }
                }
            }
            
            // Try to add a new ignore array to an existing analyzer section
            const addedToExistingSection = this.tryAddIgnoreArrayToExistingSection(tomlContent, issueCode, tomlUri, workspaceEdit);
            if (addedToExistingSection) {
                return this.createWorkspaceIgnoreCodeAction(workspaceEdit);
            }
            
            // Fallback: append a new analyzer section with ignore array
            this.appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
            return this.createWorkspaceIgnoreCodeAction(workspaceEdit);
            
        } catch {
            // If we can't read the file, return undefined
            return undefined;
        }
    }

    /**
     * Extracts the issue code from a pragma comment string
     */
    extractIssueCodeFromPragma(pragmaComment: string): string {
        // Extract issue code from "@mago-expect analysis:issue-code" format
        const match = pragmaComment.match(/@mago-(expect|ignore)\s+(.+)/);
        return match ? match[2].trim() : pragmaComment;
    }

    /**
     * Finds existing suppression comment above a line
     * Returns information about the comment if found
     */
    findExistingSuppressionAbove(document: ITextDocument, lineNumber: number): { lineNumber: number; issueCodes: string[] } | null {
        // Look for suppression comments in the lines above (up to 3 lines above)
        for (let i = Math.max(0, lineNumber - 3); i < lineNumber; i++) {
            const line = document.lineAt(i);
            const lineText = line.text.trim();
            
            // Look for existing @mago-expect or @mago-ignore comments
            const suppressionPattern = /\/\/\s*@mago-(expect|ignore)\s+([^\/\n]+)/;
            const match = suppressionPattern.exec(lineText);
            
            if (match) {
                const issueCodesText = match[2].trim();
                
                // Parse comma-separated issue codes (in case there are any)
                const issueCodes = issueCodesText.split(',').map(code => code.trim()).filter(code => code.length > 0);
                
                return {
                    lineNumber: i,
                    issueCodes: issueCodes
                };
            }
        }
        
        return null;
    }

    /**
     * Attempts to add the issue code to an existing ignore array in the analyzer section
     */
    private tryAddToExistingIgnoreArray(
        tomlContent: string, 
        issueCode: string, 
        tomlUri: any, 
        workspaceEdit: IWorkspaceEdit
    ): boolean {
        const analyzerSectionMatch = tomlContent.match(/\[analyzer\]/);
        if (!analyzerSectionMatch) {
            return false; // No analyzer section found
        }
        
        const analyzerStartIndex = analyzerSectionMatch.index ?? 0;
        const analyzerSectionContent = this.extractAnalyzerSectionContent(tomlContent, analyzerStartIndex);
        
        const ignoreArrayMatch = analyzerSectionContent.match(/(^|\n)\s*ignore\s*=\s*\[/);
        if (!ignoreArrayMatch) {
            return false; // No ignore array found
        }
        
        // Find the position of the opening bracket
        const arrayStartIndex = analyzerStartIndex + (ignoreArrayMatch.index ?? 0) + ignoreArrayMatch[0].length - 1;
        
        // Find the matching closing bracket
        const arrayEndIndex = tomlContent.indexOf(']', arrayStartIndex);
        if (arrayEndIndex <= arrayStartIndex) {
            return false; // Malformed array
        }
        
        // Check if the issue code is already in the array
        const arrayContent = tomlContent.slice(arrayStartIndex + 1, arrayEndIndex);
        const escapedIssueCode = issueCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const alreadyExists = new RegExp(`"${escapedIssueCode}"`).test(arrayContent);
        
        if (alreadyExists) {
            return false; // Issue already ignored
        }
        
        // Add the issue code to the array
        const needsComma = arrayContent.trim().length > 0 && !/[,\s]$/.test(arrayContent);
        const newEntry = `${needsComma ? ',' : ''}${arrayContent.trim() ? '\n    ' : ''}"${issueCode}"`;
        const insertText = `${newEntry}\n`;
        
        // Try to find the document in VS Code for precise positioning
        const document = this.workspace.textDocuments.find(doc => doc.uri.fsPath === tomlUri.fsPath);
        if (document) {
            const insertPosition = document.positionAt(arrayEndIndex);
            workspaceEdit.insert(tomlUri, insertPosition, insertText);
        } else {
            // Fallback: append at end of file
            this.appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
        }
        
        return true;
    }

    /**
     * Attempts to add a new ignore array to an existing analyzer section
     */
    private tryAddIgnoreArrayToExistingSection(
        tomlContent: string, 
        issueCode: string, 
        tomlUri: any, 
        workspaceEdit: IWorkspaceEdit
    ): boolean {
        const analyzerSectionMatch = tomlContent.match(/\[analyzer\]/);
        if (!analyzerSectionMatch) {
            return false; // No analyzer section found
        }
        
        const analyzerStartIndex = analyzerSectionMatch.index ?? 0;
        const analyzerSectionContent = this.extractAnalyzerSectionContent(tomlContent, analyzerStartIndex);
        
        // Check if ignore array already exists
        if (analyzerSectionContent.includes('ignore = [')) {
            return false; // Ignore array already exists
        }
        
        // Add ignore array at the end of the analyzer section
        const insertPosition = analyzerStartIndex + analyzerSectionContent.length;
        const ignoreArrayText = `\nignore = [\n    "${issueCode}"\n]\n`;
        
        const document = this.workspace.textDocuments.find(doc => doc.uri.fsPath === tomlUri.fsPath);
        if (document) {
            const position = document.positionAt(insertPosition);
            workspaceEdit.insert(tomlUri, position, ignoreArrayText);
        } else {
            // Fallback: append at end of file
            this.appendNewAnalyzerSectionWithIgnore(issueCode, tomlUri, workspaceEdit);
        }
        
        return true;
    }

    /**
     * Appends a new analyzer section with ignore array at the end of the file
     */
    private appendNewAnalyzerSectionWithIgnore(
        issueCode: string, 
        tomlUri: any, 
        workspaceEdit: IWorkspaceEdit
    ): void {
        const newSectionText = `\n[analyzer]\nignore = [\n    "${issueCode}"\n]\n`;
        const endOfFilePosition: IPosition = { line: Number.MAX_SAFE_INTEGER, character: 0 };
        workspaceEdit.insert(tomlUri, endOfFilePosition, newSectionText);
    }

    /**
     * Extracts the content of the analyzer section from the TOML file
     */
    private extractAnalyzerSectionContent(tomlContent: string, analyzerStartIndex: number): string {
        const contentAfterAnalyzer = tomlContent.slice(analyzerStartIndex);
        const nextSectionIndex = contentAfterAnalyzer.indexOf('\n[', 1);
        
        return nextSectionIndex >= 0 
            ? contentAfterAnalyzer.slice(0, nextSectionIndex)
            : contentAfterAnalyzer;
    }

    /**
     * Creates a VS Code code action for workspace ignore functionality
     */
    private createWorkspaceIgnoreCodeAction(workspaceEdit: IWorkspaceEdit): ICodeAction {
        return {
            title: 'Mago: Ignore in workspace (mago.toml)',
            kind: 'quickfix',
            edit: workspaceEdit
        };
    }

    /**
     * Creates a mock workspace edit for testing
     */
    private createMockWorkspaceEdit(): IWorkspaceEdit {
        return {
            insert: (uri: any, position: IPosition, text: string) => {},
            replace: (uri: any, range: any, text: string) => {},
            delete: (uri: any, range: any) => {}
        };
    }
}