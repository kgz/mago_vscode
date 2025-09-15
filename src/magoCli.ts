import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { getConfig, resolveMagoBinary } from './config';
import { countIssues, publishDiagnosticsFromJson, publishWorkspaceDiagnostics } from './diagnostics';
import { maybeOfferInit } from './initTemplate';

export async function analyzeActiveFile(output: vscode.OutputChannel, magoDiagnostics: vscode.DiagnosticCollection | undefined): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { vscode.window.showWarningMessage('No active editor to analyze.'); return; }
	const doc = editor.document;
	if (doc.languageId !== 'php') { vscode.window.showWarningMessage('Current file is not a PHP file.'); return; }
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (workspaceFolder) {
		const tomlPath = path.join(workspaceFolder, 'mago.toml');
		if (!fs.existsSync(tomlPath)) { await maybeOfferInit(workspaceFolder); return; }
	}
	const mago = await resolveMagoBinary();
	if (!mago) { vscode.window.showErrorMessage('Could not resolve mago binary.'); return; }
	if (doc.isDirty) { await doc.save(); }
	const cfg = getConfig();
	const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || path.dirname(doc.uri.fsPath);
	const args: string[] = ['analyze'];
	args.push('--reporting-format', 'json', '--reporting-target', 'stdout');
	if (cfg.minimumFailLevel) { args.push('--minimum-fail-level', cfg.minimumFailLevel); }
	if (cfg.minimumFailLevel) { /* keep */ }
	args.push(doc.uri.fsPath);
	const extra = cfg.analyzerArgs;
	const shellQuote = (s: string) => /[\s"'\\]/.test(s) ? `'${s.replace(/'/g, "'\\''")}'` : s;
	const fullCmd = [shellQuote(mago), ...[...args, ...extra].map(shellQuote)].join(' ');
	output.appendLine(`[mago] cwd=${cwd}`);
	output.appendLine(`[mago] ${cfg.dryRun ? 'would run' : 'running'}: ${fullCmd}`);
	if (cfg.dryRun) { vscode.window.showInformationMessage('Mago: logged analyze command (no execution).'); return; }
	const child = spawn(mago, [...args, ...extra], { cwd });
	let stdout = ''; let stderr = '';
	child.stdout.on('data', (d) => { stdout += d.toString(); });
	child.stderr.on('data', (d) => { stderr += d.toString(); });
	const exit = await new Promise<number>((resolve) => child.on('close', resolve));
	output.appendLine(`[mago] exit=${exit}`);
	if (stderr.trim()) { output.appendLine(`[mago][stderr] ${stderr.trim()}`); }
	if (stdout.trim()) {
		await publishDiagnosticsFromJson(stdout.trim(), doc.uri.fsPath, output, magoDiagnostics);
	} else if (exit === 0 && magoDiagnostics) {
		magoDiagnostics.set(vscode.Uri.file(doc.uri.fsPath), []);
	}
}

export async function analyzeWorkspace(output: vscode.OutputChannel, magoDiagnostics: vscode.DiagnosticCollection | undefined, currentWorkspaceChildRef: { child: import('child_process').ChildProcess | null }) {
	const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!folder) { vscode.window.showWarningMessage('No workspace folder to analyze.'); return; }
	const tomlPath = path.join(folder, 'mago.toml');
	if (!fs.existsSync(tomlPath)) { await maybeOfferInit(folder); return; }
	const mago = await resolveMagoBinary();
	if (!mago) { vscode.window.showErrorMessage('Could not resolve mago binary.'); return; }
	const cfg = getConfig();
	const args: string[] = ['analyze'];
	args.push('--reporting-format', 'json', '--reporting-target', 'stdout');
	if (cfg.minimumFailLevel) { args.push('--minimum-fail-level', cfg.minimumFailLevel); }
	if (cfg.minimumFailLevel) { /* keep */ }
	if (!fs.existsSync(path.join(folder, 'mago.toml'))) { args.push(folder); }
	const extra = cfg.analyzerArgs;
	const shellQuote = (s: string) => /[\s"'\\]/.test(s) ? `'${s.replace(/'/g, "'\\''")}'` : s;
	const fullCmd = [mago, ...args, ...extra].map(shellQuote).join(' ');
	output.appendLine(`[mago] workspace cwd=${folder}`);
	output.appendLine(`[mago] ${cfg.dryRun ? 'would run' : 'running'}: ${fullCmd}`);
	if (cfg.dryRun) { return; }
	const startedAt = Date.now();
	const child = spawn(mago, [...args, ...extra], { cwd: folder });
	currentWorkspaceChildRef.child = child;
	let stdout = ''; let stderr = '';
	child.stdout.on('data', (d) => { stdout += d.toString(); });
	child.stderr.on('data', (d) => { stderr += d.toString(); });
	const exit = await new Promise<number>((resolve) => child.on('close', resolve));
	currentWorkspaceChildRef.child = null;
	output.appendLine(`[mago] exit=${exit}`);
	if (stderr.trim()) { output.appendLine(`[mago][stderr] ${stderr.trim()}`); }
	if (stdout.trim()) {
		await publishWorkspaceDiagnostics(stdout.trim(), output, magoDiagnostics);
		try {
			const elapsedMs = Date.now() - startedAt;
			const issues = countIssues(stdout.trim());
			const warn = elapsedMs > 3000 ? ' [slow]' : '';
			output.appendLine(`[mago][perf] elapsedMs=${elapsedMs} issues=${issues}${warn}`);
		} catch { }
	} else {
		if (magoDiagnostics) { magoDiagnostics.clear(); }
	}
}


