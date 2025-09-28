import * as vscode from 'vscode';
import { injectable } from 'tsyringe';
import { IWorkspaceEdit, IPosition } from './IWorkspaceActionsService';

/**
 * VS Code implementation of IWorkspaceEdit
 */
@injectable()
export class VSCodeWorkspaceEditService implements IWorkspaceEdit {
    private workspaceEdit = new vscode.WorkspaceEdit();

    insert(uri: any, position: IPosition, text: string): void {
        const vscodeUri = typeof uri === 'string' ? vscode.Uri.file(uri) : uri;
        const vscodePosition = new vscode.Position(position.line, position.character);
        this.workspaceEdit.insert(vscodeUri, vscodePosition, text);
    }

    replace(uri: any, range: any, text: string): void {
        const vscodeUri = typeof uri === 'string' ? vscode.Uri.file(uri) : uri;
        const vscodeRange = new vscode.Range(
            range.start.line, range.start.character,
            range.end.line, range.end.character
        );
        this.workspaceEdit.replace(vscodeUri, vscodeRange, text);
    }

    delete(uri: any, range: any): void {
        const vscodeUri = typeof uri === 'string' ? vscode.Uri.file(uri) : uri;
        const vscodeRange = new vscode.Range(
            range.start.line, range.start.character,
            range.end.line, range.end.character
        );
        this.workspaceEdit.delete(vscodeUri, vscodeRange);
    }

    getWorkspaceEdit(): vscode.WorkspaceEdit {
        return this.workspaceEdit;
    }
}
