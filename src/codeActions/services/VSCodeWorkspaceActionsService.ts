import * as vscode from 'vscode';
import * as fs from 'fs';
import { injectable } from 'tsyringe';
import { 
    IWorkspace, 
    IWorkspaceFolder, 
    ITextDocument, 
    IFileSystem 
} from './IWorkspaceActionsService';

/**
 * VS Code implementation of IWorkspace
 */
@injectable()
export class VSCodeWorkspace implements IWorkspace {
    get workspaceFolders(): IWorkspaceFolder[] | undefined {
        return vscode.workspace.workspaceFolders?.map(folder => ({
            uri: { fsPath: folder.uri.fsPath }
        }));
    }

    get textDocuments(): ITextDocument[] {
        return vscode.workspace.textDocuments.map(doc => ({
            uri: { fsPath: doc.uri.fsPath },
            lineAt: (line: number) => ({
                text: doc.lineAt(line).text,
                lineNumber: line
            }),
            positionAt: (offset: number) => {
                const pos = doc.positionAt(offset);
                return { line: pos.line, character: pos.character };
            }
        }));
    }
}

/**
 * VS Code implementation of IFileSystem
 */
@injectable()
export class VSCodeFileSystem implements IFileSystem {
    readFileSync(filePath: string, encoding: string): string {
        return fs.readFileSync(filePath, encoding as BufferEncoding);
    }
}
