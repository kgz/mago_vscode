import * as vscode from 'vscode';
import { getConfig } from './config';
import { analyzeActiveFile, analyzeWorkspace } from './magoCli';
import { createDiagnosticsCollection } from './diagnostics';
import { registerCodeActions } from './codeActions';

let magoDiagnostics: vscode.DiagnosticCollection | undefined;
let isWorkspaceAnalyzing = false;
let workspaceRerunRequested = false;
const currentWorkspaceChildRef: { child: import('child_process').ChildProcess | null } = { child: null };

async function runWorkspaceSingleFlight(output: vscode.OutputChannel) {
	if (isWorkspaceAnalyzing) {
		workspaceRerunRequested = true;
		try {
			currentWorkspaceChildRef.child?.kill('SIGTERM');
		} catch {}
		return;
	}
	isWorkspaceAnalyzing = true;
	try {
		do {
			workspaceRerunRequested = false;
			await analyzeWorkspace(output, magoDiagnostics, currentWorkspaceChildRef);
		} while (workspaceRerunRequested);
	} finally {
		isWorkspaceAnalyzing = false;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('Mago');
	context.subscriptions.push(output);

	magoDiagnostics = createDiagnosticsCollection();
	context.subscriptions.push(magoDiagnostics);

	console.log('Mago extension activated');

	// Hello World sample
	context.subscriptions.push(vscode.commands.registerCommand('mago-problems.helloWorld', () => {
		vscode.window.showInformationMessage('Hello from Mago extension');
	}));

	// Analyze current file
	const status = vscode.window.createStatusBarItem('mago.status', vscode.StatusBarAlignment.Left, 100);
	const runFileWithStatus = async () => {
		status.text = 'Mago: Analyzing file…';
		try {
			await analyzeActiveFile(output, magoDiagnostics);
		} catch (e: any) {
			vscode.window.showErrorMessage(`Mago file analyze failed: ${e?.message || e}`);
			output.appendLine(String(e));
		} finally {
			status.text = 'Mago: Idle';
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand('mago.analyzeFile', runFileWithStatus));

	// Analyze workspace
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

	// Triggers
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

	// Status bar
	status.text = 'Mago: Idle';
	status.tooltip = 'Run Mago analysis for current file';
	status.command = 'mago.analyzeFile';
	status.show();
	context.subscriptions.push(status);

	// Code actions
	registerCodeActions(context);

	// Initial run on startup (workspace-wide) unless manual
	setTimeout(() => {
		const cfg = getConfig();
		if (cfg.runOn !== 'manual') {
			vscode.commands.executeCommand('mago.analyzeWorkspace');
		}
	}, 1000);
}

export function deactivate() {}
