import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function createDiagnosticsCollection(): vscode.DiagnosticCollection {
	return vscode.languages.createDiagnosticCollection('mago');
}

export async function publishDiagnosticsFromJson(jsonText: string, analyzedFilePath: string, output: vscode.OutputChannel, magoDiagnostics: vscode.DiagnosticCollection | undefined) {
	if (!magoDiagnostics) {return;}
	let payload: any;
	try { payload = JSON.parse(jsonText); } catch { output.appendLine('[mago] failed to parse JSON output'); return; }
	const fileDiags: vscode.Diagnostic[] = [];
	const issues: any[] = Array.isArray(payload?.issues) ? payload.issues : [];
	for (const issue of issues) {
		const level = String(issue.level || 'error').toLowerCase();
		const severity = level === 'error' ? vscode.DiagnosticSeverity.Error : level === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information;
		const code = issue.code ? String(issue.code) : undefined;
		const category: string | undefined = issue.category ? String(issue.category) : undefined;
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
		if (category) { (diag as any).magoCategory = category; }
		const notes: string[] = Array.isArray(issue.notes) ? issue.notes.map((n: any) => String(n)) : [];
		if (notes.length) {
			const uri = vscode.Uri.file(filePath);
			const relatedAt = range.start;
			diag.relatedInformation = notes.map((note) => new vscode.DiagnosticRelatedInformation(new vscode.Location(uri, relatedAt), note));
		}
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

export async function publishWorkspaceDiagnostics(jsonText: string, output: vscode.OutputChannel, magoDiagnostics: vscode.DiagnosticCollection | undefined) {
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
		const severity = level === 'error' ? vscode.DiagnosticSeverity.Error : level === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information;
		const code = issue.code ? String(issue.code) : undefined;
		const message = String(issue.message || '');
		const ann = Array.isArray(issue.annotations) ? issue.annotations[0] : undefined;
		const filePath: string | undefined = ann?.span?.file_id?.path || ann?.span?.file?.path || undefined;
		if (!filePath) {continue;}
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
		const suggestions: any[] = Array.isArray(issue.suggestions) ? issue.suggestions : [];
		(diag as typeof diag & { magoSuggestions: any[] }).magoSuggestions = suggestions;
		(byFile.get(filePath) ?? byFile.set(filePath, []).get(filePath)!).push(diag);
		try {
			const start = `${range.start.line + 1}:${range.start.character + 1}`;
			void start; // keep variable referenced to avoid eslint warning
		} catch { }
	}
	// Clear all and replace to remove stale diagnostics
	magoDiagnostics.clear();
	for (const [file, diags] of byFile) {
		magoDiagnostics.set(vscode.Uri.file(file), diags);
	}
}

export function countIssues(jsonText: string): number {
	try {
		const payload = JSON.parse(jsonText);
		return Array.isArray(payload?.issues) ? payload.issues.length : 0;
	} catch { return 0; }
}


