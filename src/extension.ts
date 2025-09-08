// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

function getConfig() {
	const cfg = vscode.workspace.getConfiguration('mago');
	return {
		magoPath: cfg.get<string>('path') || '',
		analyzerArgs: cfg.get<string[]>('analyzer.args') || [],
		runOn: cfg.get<'save'|'type'|'manual'>('runOn') || 'save',
		autodiscoverVendor: cfg.get<boolean>('autodiscoverVendor') ?? true,
		reportingFormat: cfg.get<string>('reporting.format') || 'json',
		reportingTarget: cfg.get<string>('reporting.target') || 'stdout',
		minimumFailLevel: cfg.get<string>('minimumFailLevel') || 'error',
		fixEnabled: cfg.get<boolean>('fix.enabled') || false,
		fixDryRun: cfg.get<boolean>('fix.dryRun') ?? true,
		formatAfterFix: cfg.get<boolean>('fix.formatAfterFix') || false,
		fixableOnly: cfg.get<boolean>('fixableOnly') || false,
	};
}

async function resolveMagoBinary(): Promise<string | null> {
	const { magoPath, autodiscoverVendor } = getConfig();
	if (magoPath) {
		return magoPath;
	}

	// Try vendor/bin/mago relative to workspace
	if (autodiscoverVendor) {
		const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (folder) {
			const vendorCandidates = [
				path.join(folder, 'vendor', 'bin', 'mago'),
				path.join(folder, 'vendor', 'bin', 'mago.exe'),
				path.join(folder, 'vendor', 'carthage-software', 'mago', 'bin', 'mago'),
			];
			for (const candidate of vendorCandidates) {
				try {
					if (fs.existsSync(candidate)) {
						return candidate;
					}
				} catch {}
			}
		}
	}

	// Fall back to PATH resolution
	return 'mago';
}

async function analyzeActiveFile(output: vscode.OutputChannel): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No active editor to analyze.');
		return;
	}
	const doc = editor.document;
	if (doc.languageId !== 'php') {
		vscode.window.showWarningMessage('Current file is not a PHP file.');
		return;
	}

	const mago = await resolveMagoBinary();
	if (!mago) {
		vscode.window.showErrorMessage('Could not resolve mago binary.');
		return;
	}

	// Save if dirty to ensure CLI reads latest
	if (doc.isDirty) {
		await doc.save();
	}

	const cfg = getConfig();
	const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || path.dirname(doc.uri.fsPath);
	const args: string[] = ['analyze'];

	// reporting
	args.push('--reporting-format', cfg.reportingFormat);
	args.push('--reporting-target', cfg.reportingTarget);

	// levels and filters
	if (cfg.minimumFailLevel) args.push('--minimum-fail-level', cfg.minimumFailLevel);
	if (cfg.fixableOnly) args.push('--fixable-only');

	// fix flags
	if (cfg.fixEnabled) {
		args.push('--fix');
		if (cfg.fixDryRun) args.push('--dry-run');
		if (cfg.formatAfterFix) args.push('--format-after-fix');
	}

	// file path
	args.push(doc.uri.fsPath);

	// extra user args last
	const extra = cfg.analyzerArgs;
	const shellQuote = (s: string) => /[\s"'\\]/.test(s) ? `'${s.replace(/'/g, "'\\''")}'` : s;
	const fullCmd = [shellQuote(mago), ...[...args, ...extra].map(shellQuote)].join(' ');
	output.appendLine(`[mago] cwd=${cwd}`);
	output.appendLine(`[mago] would run: ${fullCmd}`);
	vscode.window.showInformationMessage('Mago: logged analyze command (no execution).');

}

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('Mago');
	context.subscriptions.push(output);

	console.log('Mago extension activated');

	const hello = vscode.commands.registerCommand('mago-problems.helloWorld', () => {
		vscode.window.showInformationMessage('Hello from Mago extension');
	});
	context.subscriptions.push(hello);

	const analyzeCmd = vscode.commands.registerCommand('mago.analyzeFile', async () => {
		try {
			await analyzeActiveFile(output);
		} catch (e: any) {
			vscode.window.showErrorMessage(`Mago analyze failed: ${e?.message || e}`);
			output.appendLine(String(e));
		}
	});
	context.subscriptions.push(analyzeCmd);
}

export function deactivate() {}
