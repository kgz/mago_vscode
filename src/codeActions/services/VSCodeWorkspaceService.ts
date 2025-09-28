import * as vscode from 'vscode';
import { injectable } from 'tsyringe';
import { 
    IWorkspaceService, 
    IConfigurationSection, 
    IDocumentService, 
    IPosition, 
    IWorkspaceEditService, 
    ICodeActionService, 
    ICodeAction 
} from './IWorkspaceService';

/**
 * VS Code implementation of configuration section
 */
class VSCodeConfigurationSection implements IConfigurationSection {
    constructor(private config: vscode.WorkspaceConfiguration) {}

    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.config.get<T>(key) ?? defaultValue;
    }
}

/**
 * VS Code implementation of workspace service
 */
@injectable()
export class VSCodeWorkspaceService implements IWorkspaceService {
    getConfiguration(section: string): IConfigurationSection {
        return new VSCodeConfigurationSection(vscode.workspace.getConfiguration(section));
    }
}

/**
 * VS Code implementation of document service
 */
@injectable()
export class VSCodeDocumentService implements IDocumentService {
    constructor(private document: vscode.TextDocument) {}

    positionAt(offset: number): IPosition {
        const position = this.document.positionAt(offset);
        return {
            line: position.line,
            character: position.character
        };
    }
}

/**
 * VS Code implementation of workspace edit service
 */
@injectable()
export class VSCodeWorkspaceEditService implements IWorkspaceEditService {
    private edits: Array<{ uri: string; position: IPosition; text: string }> = [];

    insert(uri: string, position: IPosition, text: string): void {
        this.edits.push({ uri, position, text });
    }

    getEdits(): Array<{ uri: string; position: IPosition; text: string }> {
        return [...this.edits];
    }
}

/**
 * VS Code implementation of code action service
 */
@injectable()
export class VSCodeCodeActionService implements ICodeActionService {
    createCodeAction(title: string, kind: string): ICodeAction {
        const codeAction = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        return {
            title: codeAction.title,
            kind: kind,
            edit: undefined // Will be set later
        };
    }
}
