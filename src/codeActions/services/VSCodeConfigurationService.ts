import * as vscode from 'vscode';
import { injectable } from 'tsyringe';
import { IConfigurationService } from './IConfigurationService';

/**
 * VS Code implementation of IConfigurationService
 */
@injectable()
export class VSCodeConfigurationService implements IConfigurationService {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('mago');
    }

    get<T>(key: string): T | undefined {
        return this.config.get<T>(key);
    }

    getOrDefault<T>(key: string, defaultValue: T): T {
        return this.config.get<T>(key) ?? defaultValue;
    }
}