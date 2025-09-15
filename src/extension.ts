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
		runOn: cfg.get<'save' | 'type' | 'manual'>('runOn') || 'save',
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
		allowUnsafe: cfg.get<boolean>('apply.allowUnsafe') ?? false,
		allowPotentiallyUnsafe: cfg.get<boolean>('apply.allowPotentiallyUnsafe') ?? false,
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
				} catch { }
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
	if (cfg.minimumFailLevel) {args.push('--minimum-fail-level', cfg.minimumFailLevel);}
	if (cfg.fixableOnly) {args.push('--fixable-only');}

	// fix flags
	if (cfg.fixEnabled) {
		args.push('--fix');
		if (cfg.fixDryRun) {args.push('--dry-run');}
		if (cfg.formatAfterFix) {args.push('--format-after-fix');}
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
	if (stderr.trim()) {output.appendLine(`[mago][stderr] ${stderr.trim()}`);}
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

async function analyzeWorkspace(output: vscode.OutputChannel): Promise<void> {
	const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!folder) {
		vscode.window.showWarningMessage('No workspace folder to analyze.');
		return;
	}
	const mago = await resolveMagoBinary();
	if (!mago) {
		vscode.window.showErrorMessage('Could not resolve mago binary.');
		return;
	}
	const cfg = getConfig();
	const args: string[] = ['analyze'];
	args.push('--reporting-format', cfg.reportingFormat);
	args.push('--reporting-target', cfg.reportingTarget);
	if (cfg.minimumFailLevel) {args.push('--minimum-fail-level', cfg.minimumFailLevel);}
	if (cfg.fixableOnly) {args.push('--fixable-only');}
	if (cfg.fixEnabled) {
		args.push('--fix');
		if (cfg.fixDryRun) {args.push('--dry-run');}
		if (cfg.formatAfterFix) {args.push('--format-after-fix');}
	}
	// If mago.toml exists at the workspace root, let Mago discover paths itself; otherwise pass the folder
	const hasTomlAtRoot = fs.existsSync(path.join(folder, 'mago.toml'));
	if (!hasTomlAtRoot) {
		args.push(folder);
	}
	const extra = cfg.analyzerArgs;
	const shellQuote = (s: string) => /[\s"'\\]/.test(s) ? `'${s.replace(/'/g, "'\\''")}'` : s;
	const fullCmd = [mago, ...args, ...extra].map(shellQuote).join(' ');
	output.appendLine(`[mago] workspace cwd=${folder}`);
	output.appendLine(`[mago] ${cfg.dryRun ? 'would run' : 'running'}: ${fullCmd}`);
	if (cfg.dryRun) {return;}

	const startedAt = Date.now();
	const child = spawn(mago, [...args, ...extra], { cwd: folder });
	currentWorkspaceChild = child;
	let stdout = '';
	let stderr = '';
	child.stdout.on('data', (d) => { stdout += d.toString(); });
	child.stderr.on('data', (d) => { stderr += d.toString(); });
	const exit = await new Promise<number>((resolve) => child.on('close', resolve));
	currentWorkspaceChild = null;
	output.appendLine(`[mago] exit=${exit}`);
	if (stderr.trim()) {output.appendLine(`[mago][stderr] ${stderr.trim()}`);}
	if (stdout.trim()) {
		// Batch update diagnostics for all files in the payload
		await publishWorkspaceDiagnostics(stdout.trim(), output);
		// Performance diagnostics
		try {
			const elapsedMs = Date.now() - startedAt;
			const issues = countIssues(stdout.trim());
			const warn = elapsedMs > 3000 ? ' [slow]' : '';
			output.appendLine(`[mago][perf] elapsedMs=${elapsedMs} issues=${issues}${warn}`);
		} catch { }
	} else {
		// No output: clear stale diagnostics
		if (magoDiagnostics) {magoDiagnostics.clear();}
	}
}

async function publishWorkspaceDiagnostics(jsonText: string, output: vscode.OutputChannel) {
	if (!magoDiagnostics) {return;}
	let payload: any;
	try { payload = JSON.parse(jsonText); } catch { return; }
	const issues: any[] = Array.isArray(payload?.issues) ? payload.issues : [];
	const byFile = new Map<string, vscode.Diagnostic[]>();
	const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	const hasToml = folder ? fs.existsSync(path.join(folder, 'mago.toml')) : false;
	const isVendorPath = (p: string) => {
		const norm = path.normalize(p).toLowerCase();
		return norm.includes(`${path.sep}vendor${path.sep}`) || norm.includes(`${path.sep}vendor-bin${path.sep}`);
	};
	for (const issue of issues) {
		const level = String(issue.level || 'error').toLowerCase();
		const severity = level === 'error' ? vscode.DiagnosticSeverity.Error
			: level === 'warning' ? vscode.DiagnosticSeverity.Warning
				: vscode.DiagnosticSeverity.Information;
		const code = issue.code ? String(issue.code) : undefined;
		const message = String(issue.message || '');
		const ann = Array.isArray(issue.annotations) ? issue.annotations[0] : undefined;
		const filePath: string | undefined = ann?.span?.file_id?.path || ann?.span?.file?.path || undefined;
		if (!filePath) {continue;}
		// Always ignore vendor diagnostics from reporting
		if (isVendorPath(filePath)) {continue;}
		let range: vscode.Range | undefined;
		try {
			const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
			const startOffset: number | undefined = ann?.span?.start?.offset;
			const endOffset: number | undefined = ann?.span?.end?.offset;
			if (typeof startOffset === 'number' && typeof endOffset === 'number') {
				const startPos = doc.positionAt(startOffset);
				const endPos = doc.positionAt(Math.max(startOffset, endOffset));
				range = new vscode.Range(startPos, endPos);
			}
		} catch { }
		if (!range) {
			const startLine: number = (ann?.span?.start?.line ?? 0);
			const endLine: number = (ann?.span?.end?.line ?? startLine);
			range = new vscode.Range(Math.max(0, startLine), 0, Math.max(0, endLine), 1e9);
		}
		const diag = new vscode.Diagnostic(range, message, severity);
		if (code) {diag.code = `${code}`;}
		diag.source = 'mago';
		// Attach suggestions so Quick Fix can surface for workspace diagnostics too
		const suggestions: any[] = Array.isArray(issue.suggestions) ? issue.suggestions : [];
		(diag as typeof diag & { magoSuggestions: any[] }).magoSuggestions = suggestions;
		(byFile.get(filePath) ?? byFile.set(filePath, []).get(filePath)!).push(diag);
		try {
			const start = `${range.start.line + 1}:${range.start.character + 1}`;
			output.appendLine(`[mago][diag][workspace] ${filePath}:${start} ${code ?? ''} ${message}`.trim());
		} catch { }
	}
	// Clear all and replace to remove stale diagnostics
	magoDiagnostics.clear();
	for (const [file, diags] of byFile) {
		magoDiagnostics.set(vscode.Uri.file(file), diags);
	}
}

function countIssues(jsonText: string): number {
	try {
		const payload = JSON.parse(jsonText);
		return Array.isArray(payload?.issues) ? payload.issues.length : 0;
	} catch {
		return 0;
	}
}

async function publishDiagnosticsFromJson(jsonText: string, analyzedFilePath: string, output: vscode.OutputChannel) {
	if (!magoDiagnostics) {return;}
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
			} catch { }
		}
		if (!range) {
			const startLine: number = (ann?.span?.start?.line ?? 0);
			const endLine: number = (ann?.span?.end?.line ?? startLine);
			range = new vscode.Range(Math.max(0, startLine), 0, Math.max(0, endLine), 1e9);
		}
		if (!filePath) {continue;}
		if (path.normalize(filePath) !== path.normalize(analyzedFilePath)) {continue;}
		const diag = new vscode.Diagnostic(range, message, severity);
		if (code) {diag.code = `${code}`;}
		diag.source = 'mago';
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
		// Attach code action metadata: store suggestions on the diagnostic
		const suggestions: any[] = Array.isArray(issue.suggestions) ? issue.suggestions : [];
		(diag as any).magoSuggestions = suggestions;
		fileDiags.push(diag);
		try {
			const start = `${range.start.line + 1}:${range.start.character + 1}`;
			output.appendLine(`[mago][diag][file] ${filePath}:${start} ${code ?? ''} ${message}`.trim());
		} catch { }
	}
	magoDiagnostics.set(vscode.Uri.file(analyzedFilePath), fileDiags);
}

let magoDiagnostics: vscode.DiagnosticCollection | undefined;
let isWorkspaceAnalyzing = false;
let workspaceRerunRequested = false;
let currentWorkspaceChild: import('child_process').ChildProcess | null = null;

async function runWorkspaceSingleFlight(output: vscode.OutputChannel) {
	if (isWorkspaceAnalyzing) {
		workspaceRerunRequested = true;
		if (currentWorkspaceChild) {
			try {
				output.appendLine('[mago] cancelling current analysis...');
				currentWorkspaceChild.kill('SIGTERM');
			} catch { }
		}
		return;
	}
	isWorkspaceAnalyzing = true;
	try {
		do {
			workspaceRerunRequested = false;
			await analyzeWorkspace(output);
		} while (workspaceRerunRequested);
	} finally {
		isWorkspaceAnalyzing = false;
	}
}

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

	// Command to run analysis (we'll update status bar text around it)
	const runWithStatus = async () => {
		status.text = 'Mago: Analyzing…';
		try {
			await runWorkspaceSingleFlight(output);
		} catch (e: any) {
			vscode.window.showErrorMessage(`Mago analyze failed: ${e?.message || e}`);
			output.appendLine(String(e));
		} finally {
			status.text = 'Mago: Idle';
		}
	};
	const analyzeCmd = vscode.commands.registerCommand('mago.analyzeFile', runWithStatus);
	context.subscriptions.push(analyzeCmd);

	// Workspace analysis command
	context.subscriptions.push(vscode.commands.registerCommand('mago.analyzeWorkspace', async () => {
		status.text = 'Mago: Analyzing workspace…';
		try {
			await runWorkspaceSingleFlight(output);
		} catch (e: any) {
			vscode.window.showErrorMessage(`Mago workspace analyze failed: ${e?.message || e}`);
			output.appendLine(String(e));
		} finally {
			status.text = 'Mago: Idle';
		}
	}));

	// On-save / on-type triggers (separate handlers to avoid running on change when set to save)
	let pendingTimer: NodeJS.Timeout | undefined;
	const handleSave = (doc: vscode.TextDocument) => {
		if (doc.languageId !== 'php') {return;}
		const cfg = getConfig();
		if (cfg.runOn !== 'save') {return;}
		runWorkspaceSingleFlight(output);
	};
	const handleChange = (e: vscode.TextDocumentChangeEvent) => {
		const doc = e.document;
		if (doc.languageId !== 'php') {return;}
		const cfg = getConfig();
		if (cfg.runOn !== 'type') {return;}
		if (pendingTimer) {clearTimeout(pendingTimer);}
		pendingTimer = setTimeout(() => runWorkspaceSingleFlight(output), Math.max(0, cfg.debounceMs));
	};

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(handleSave));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(handleChange));

	// Status bar indicator
	const status = vscode.window.createStatusBarItem('mago.status', vscode.StatusBarAlignment.Left, 100);
	status.text = 'Mago: Idle';
	status.tooltip = 'Run Mago analysis for current file';
	status.command = 'mago.analyzeFile';
	status.show();
	context.subscriptions.push(status);

	// CodeAction provider to apply suggestions
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('php', {
		provideCodeActions(document, range, context, token) {
			const actions: vscode.CodeAction[] = [];
			for (const diag of context.diagnostics) {
				const suggestions: any[] = (diag as any).magoSuggestions || [];
				for (const group of suggestions) {
					const [, patch] = group; // [fileMeta, patch]
					const ops: any[] = Array.isArray(patch?.operations) ? patch.operations : [];
					const edits = new vscode.WorkspaceEdit();
					let safety: 'Safe' | 'PotentiallyUnsafe' | 'Unsafe' | undefined;
					for (const op of ops) {
						if (op?.type === 'Insert') {
							const offset: number = op.value?.offset;
							const text: string = op.value?.text ?? '';
							safety = op.value?.safety_classification?.type;
							const pos = document.positionAt(offset);
							edits.insert(document.uri, pos, text);
						}
					}
					const action = new vscode.CodeAction('Mago: Apply suggestion', vscode.CodeActionKind.QuickFix);
					action.edit = edits;
					if (safety === 'Unsafe' && !getConfig().allowUnsafe) {continue;}
					if (safety === 'PotentiallyUnsafe' && !getConfig().allowPotentiallyUnsafe) {continue;}
					actions.push(action);
				}
			}
			return actions;
		}
	}));

	// Initial run on startup (workspace-wide for full symbol context)
	setTimeout(() => {
		vscode.commands.executeCommand('mago.analyzeWorkspace');
	}, 1000);
}

export function deactivate() { }
