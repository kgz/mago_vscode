import * as vscode from 'vscode';
import { MagoExtensionConfig, AnalysisTriggerMode } from './types';

/**
 * Reads the current Mago extension configuration from VS Code settings
 * Returns a complete configuration object with all settings resolved
 */
export function readMagoConfiguration(): MagoExtensionConfig {
    const magoConfig = vscode.workspace.getConfiguration('mago');
    
    return {
        magoPath: magoConfig.get<string>('path') ?? '',
        analyzerArgs: magoConfig.get<string[]>('analyzer.args') ?? [],
        runOn: magoConfig.get<AnalysisTriggerMode>('runOn') ?? 'save',
        minimumFailLevel: magoConfig.get<string>('minimumFailLevel') ?? 'error',
        dryRun: magoConfig.get<boolean>('debug.dryRun') ?? false,
        debounceMs: magoConfig.get<number>('debounceMs') ?? 400,
        allowUnsafe: magoConfig.get<boolean>('apply.allowUnsafe') ?? false,
        allowPotentiallyUnsafe: magoConfig.get<boolean>('apply.allowPotentiallyUnsafe') ?? false,
    };
}

/**
 * Gets a specific configuration value from VS Code settings
 * Useful for accessing individual settings without loading the entire config
 */
export function getMagoSetting<T>(key: string, defaultValue: T): T {
    const magoConfig = vscode.workspace.getConfiguration('mago');
    return magoConfig.get<T>(key) ?? defaultValue;
}
