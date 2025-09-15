import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type RunOnMode = 'save' | 'type' | 'manual';

export interface MagoExtensionConfig {
	magoPath: string;
	analyzerArgs: string[];
	runOn: RunOnMode;
	minimumFailLevel: string;
	dryRun: boolean;
	debounceMs: number;
	allowUnsafe: boolean;
	allowPotentiallyUnsafe: boolean;
}

export function getConfig(): MagoExtensionConfig {
	const cfg = vscode.workspace.getConfiguration('mago');
	return {
		magoPath: cfg.get<string>('path') || '',
		analyzerArgs: cfg.get<string[]>('analyzer.args') || [],
		runOn: cfg.get<RunOnMode>('runOn') || 'save',
		minimumFailLevel: cfg.get<string>('minimumFailLevel') || 'error',
		dryRun: cfg.get<boolean>('debug.dryRun') ?? true,
		debounceMs: cfg.get<number>('debounceMs') ?? 400,
		allowUnsafe: cfg.get<boolean>('apply.allowUnsafe') ?? false,
		allowPotentiallyUnsafe: cfg.get<boolean>('apply.allowPotentiallyUnsafe') ?? false,
	};
}

export async function resolveMagoBinary(): Promise<string | null> {
	const { magoPath } = getConfig();
	if (magoPath) {
		return magoPath;
	}
	const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (folder) {
		const vendorCandidates = [
			path.join(folder, 'vendor', 'bin', 'mago'),
			path.join(folder, 'vendor', 'bin', 'mago.exe'),
			path.join(folder, 'vendor', 'carthage-software', 'mago', 'bin', 'mago'),
		];
		for (const candidate of vendorCandidates) {
			try { if (fs.existsSync(candidate)) { return candidate; } } catch { }
		}
	}
	return 'mago';
}


