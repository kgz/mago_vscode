import * as vscode from 'vscode';
import { injectable } from 'tsyringe';
import { IWorkspaceConfiguration, IConfiguration } from './ISuppressionService';

/**
 * VS Code implementation of IConfiguration
 */
class VSCodeConfiguration implements IConfiguration {
    constructor(private config: vscode.WorkspaceConfiguration) {}

    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.config.get<T>(key) ?? defaultValue;
    }
}

/**
 * VS Code implementation of IWorkspaceConfiguration
 */
@injectable()
export class VSCodeWorkspaceConfigurationService implements IWorkspaceConfiguration {
    getConfiguration(section: string): IConfiguration {
        const config = vscode.workspace.getConfiguration(section);
        return new VSCodeConfiguration(config);
    }
}
