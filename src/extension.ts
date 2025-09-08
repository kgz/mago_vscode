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
		dryRun: cfg.get<boolean>('dryRun') ?? true,
		debounceMs: cfg.get<number>('debounceMs') ?? 400,
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
	output.appendLine(`[mago] ${cfg.dryRun ? 'would run' : 'running'}: ${fullCmd}`);

	if (cfg.dryRun) {
		vscode.window.showInformationMessage('Mago: logged analyze command (no execution).');
		return;
	}

	// Execute and show raw JSON for now
	const child = spawn(mago, [...args, ...extra], { cwd });
	let stdout = '';
	let stderr = '';
	child.stdout.on('data', (d) => { stdout += d.toString(); });
	child.stderr.on('data', (d) => { stderr += d.toString(); });
	const exit = await new Promise<number>((resolve) => child.on('close', resolve));
	output.appendLine(`[mago] exit=${exit}`);
	if (stderr.trim()) output.appendLine(`[mago][stderr] ${stderr.trim()}`);
	const analyzedPath = doc.uri.fsPath;
	if (stdout.trim()) {
		output.appendLine(stdout.trim());
		await publishDiagnosticsFromJson(stdout.trim(), analyzedPath, output);
	} else {
		if (exit === 0 && magoDiagnostics) {
			magoDiagnostics.set(vscode.Uri.file(analyzedPath), []);
		}
	}
	vscode.window.showInformationMessage('Mago: analysis finished.');
}

async function publishDiagnosticsFromJson(jsonText: string, analyzedFilePath: string, output: vscode.OutputChannel) {
	if (!magoDiagnostics) return;
	let payload: any;
	try {
		payload = JSON.parse(jsonText);
	} catch (e) {
		output.appendLine('[mago] failed to parse JSON output');
		return;
	}
	const fileDiags: vscode.Diagnostic[] = [];
	const issues: any[] = Array.isArray(payload?.issues) ? payload.issues : [];
	for (const issue of issues) {
		const level = String(issue.level || 'error').toLowerCase();
		const severity = level === 'error' ? vscode.DiagnosticSeverity.Error
			: level === 'warning' ? vscode.DiagnosticSeverity.Warning
			: vscode.DiagnosticSeverity.Information;
		const code = issue.code ? String(issue.code) : undefined;
		const message = String(issue.message || '');
		const ann = Array.isArray(issue.annotations) ? issue.annotations[0] : undefined;
		const filePath: string | undefined = ann?.span?.file_id?.path || ann?.span?.file?.path || undefined;
		let range: vscode.Range | undefined;
		if (filePath) {
			try {
				const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
				const startOffset: number | undefined = ann?.span?.start?.offset;
				const endOffset: number | undefined = ann?.span?.end?.offset;
				if (typeof startOffset === 'number' && typeof endOffset === 'number') {
					const startPos = doc.positionAt(startOffset);
					const endPos = doc.positionAt(Math.max(startOffset, endOffset));
					range = new vscode.Range(startPos, endPos);
				}
			} catch {}
		}
		if (!range) {
			const startLine: number = (ann?.span?.start?.line ?? 0);
			const endLine: number = (ann?.span?.end?.line ?? startLine);
			range = new vscode.Range(Math.max(0, startLine), 0, Math.max(0, endLine), 1e9);
		}
		if (!filePath) continue;
		if (path.normalize(filePath) !== path.normalize(analyzedFilePath)) continue;
		const diag = new vscode.Diagnostic(range, message, severity);
		if (code) diag.code = code;
		// Attach notes as relatedInformation for better UX in Problems panel / hover
		const notes: string[] = Array.isArray(issue.notes) ? issue.notes.map((n: any) => String(n)) : [];
		if (notes.length) {
			const uri = vscode.Uri.file(filePath);
			const relatedAt = range.start;
			diag.relatedInformation = notes.map((note) => new vscode.DiagnosticRelatedInformation(
				new vscode.Location(uri, relatedAt),
				note
			));
		}
		fileDiags.push(diag);
	}
	magoDiagnostics.set(vscode.Uri.file(analyzedFilePath), fileDiags);
}

let magoDiagnostics: vscode.DiagnosticCollection | undefined;

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('Mago');
	context.subscriptions.push(output);

	magoDiagnostics = vscode.languages.createDiagnosticCollection('mago');
	context.subscriptions.push(magoDiagnostics);

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

	// On-save / on-type triggers
	let pendingTimer: NodeJS.Timeout | undefined;
	const trigger = (doc: vscode.TextDocument) => {
		if (doc.languageId !== 'php') return;
		const cfg = getConfig();
		if (cfg.runOn === 'manual') return;
		const run = () => analyzeActiveFile(output);
		if (cfg.runOn === 'save') {
			run();
		} else if (cfg.runOn === 'type') {
			if (pendingTimer) clearTimeout(pendingTimer);
			pendingTimer = setTimeout(run, Math.max(0, cfg.debounceMs));
		}
	};

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(trigger));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => trigger(e.document)));

	// Status bar indicator
	const status = vscode.window.createStatusBarItem('mago.status', vscode.StatusBarAlignment.Left, 100);
	status.text = 'Mago: Idle';
	status.tooltip = 'Run Mago analysis for current file';
	status.command = 'mago.analyzeFile';
	status.show();
	context.subscriptions.push(status);

	// Wrap command to update status text
	const runWithStatus = async () => {
		status.text = 'Mago: Analyzing…';
		try {
			await analyzeActiveFile(output);
		} finally {
			status.text = 'Mago: Idle';
		}
	};
	// Replace command implementation to use status wrapper
	context.subscriptions.push(vscode.commands.registerCommand('mago.analyzeFile', runWithStatus));
}

export function deactivate() {}
