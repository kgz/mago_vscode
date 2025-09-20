import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function registerCodeActions(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('php', {
		provideCodeActions(document, range, ctx, token) {
			const actions: vscode.CodeAction[] = [];
            const addEditAction = (title: string, edit: vscode.WorkspaceEdit): vscode.CodeAction => {
                const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
                action.edit = edit;
                return action;
            };

            const getIssueCode = (diag: vscode.Diagnostic): string | undefined => {
                const codeVal = diag.code;
                if (!codeVal) { return undefined; }
                if (typeof codeVal === 'string') { return codeVal; }
                if (typeof codeVal === 'number') { return String(codeVal); }
                // VS Code DiagnosticCode can be object-like
                try { return (codeVal as any).value ?? (codeVal as any).target?.toString(); } catch { return undefined; }
            };

            const getIssueCategory = (diag: vscode.Diagnostic): 'lint' | 'analysis' | undefined => {
                const cat = (diag as any).magoCategory as string | undefined;
                if (!cat) { return undefined; }
                const lowered = cat.toLowerCase();
                if (lowered.startsWith('lint')) { return 'lint'; }
                if (lowered.startsWith('analysis') || lowered.startsWith('analyzer') || lowered.startsWith('analyser')) { return 'analysis'; }
                return undefined;
            };

            const makeLinePragmaEdit = (doc: vscode.TextDocument, line: number, pragma: string): vscode.WorkspaceEdit => {
                const edits = new vscode.WorkspaceEdit();
                const lineStart = doc.lineAt(Math.max(0, line)).range.start;
                const indentText = (() => {
                    try {
                        const currentLine = doc.lineAt(Math.max(0, line)).text;
                        const match = currentLine.match(/^[\t ]*/);
                        return match ? match[0] : '';
                    } catch { return ''; }
                })();
                edits.insert(doc.uri, lineStart, `${indentText}// ${pragma}\n`);
                return edits;
            };

            type TomlEditResult = { edit: vscode.WorkspaceEdit; uri: vscode.Uri };
            const makeWorkspaceTomlIgnoreEdit = (issueCode: string): TomlEditResult | undefined => {
                const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!folder) { return undefined; }
                const tomlPath = path.join(folder, 'mago.toml');
                try {
                    if (!fs.existsSync(tomlPath)) { return undefined; }
                    const uri = vscode.Uri.file(tomlPath);
                    const text = fs.readFileSync(tomlPath, 'utf8');
                    const edits = new vscode.WorkspaceEdit();

                    const analyzerSectionIdx = text.indexOf('\n[analyzer]');
                    const analyzerStart = analyzerSectionIdx >= 0 ? analyzerSectionIdx + 1 : text.indexOf('[analyzer]');
                    const hasAnalyzer = analyzerStart >= 0;

                    if (hasAnalyzer) {
                        // Try to locate existing ignore array within analyzer section
                        const rest = text.slice(analyzerStart);
                        const nextSection = rest.search(/\n\[[^\]]+\]/);
                        const analyzerBody = nextSection >= 0 ? rest.slice(0, nextSection) : rest;
                        const globalStartOffset = analyzerStart;
                        const ignoreMatch = analyzerBody.match(/(^|\n)\s*ignore\s*=\s*\[/);
                        if (ignoreMatch) {
                            // Find the closing bracket of the ignore array starting at match index
                            const matchIdx = globalStartOffset + (ignoreMatch.index ?? 0) + ignoreMatch[0].length - 1; // position at '['
                            // naive: find matching ']' from this point
                            const closingIdx = text.indexOf(']', matchIdx);
                            if (closingIdx > matchIdx) {
                                const before = text.slice(0, closingIdx);
                                const inside = text.slice(matchIdx + 1, closingIdx).trim();
                                const already = new RegExp(`"${issueCode.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}"`).test(inside);
                                if (already) { return undefined; }
                                const needsComma = inside.length > 0 && !/[,\s]$/.test(inside);
                                const insertion = `${inside.length ? '\n    ' : ''}"${issueCode}"`;
                                const insertText = `${needsComma ? ',' : ''}${inside.length ? '' : '\n    '}${insertion}\n`;
                                // placeholder position created earlier is unused; we compute using targetDoc below
                                // Compute position at closing bracket
                                const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === tomlPath);
                                const targetDoc = doc;
                                if (targetDoc) {
                                    const closingPos = targetDoc.positionAt(closingIdx);
                                    edits.insert(uri, closingPos, insertText);
                                } else {
                                    // Fallback approximate: insert by range using offset via TextEdit is not available without document; request opening
                                    // As a fallback, append at end of file
                                    edits.insert(uri, new vscode.Position(Number.MAX_SAFE_INTEGER, 0), `\n# Added by Mago VS Code\n[analyzer]\nignore = [\n    "${issueCode}"\n]\n`);
                                }
                                return { edit: edits, uri };
                            }
                        }
                        // No ignore array: add one at the end of analyzer section
                        const insertAt = analyzerStart + analyzerBody.length;
                        const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === tomlPath);
                        if (doc) {
                            const insertPos = doc.positionAt(insertAt);
                            edits.insert(uri, insertPos, `\nignore = [\n    "${issueCode}"\n]\n`);
                            return { edit: edits, uri };
                        }
                        // Fallback: append
                        edits.insert(uri, new vscode.Position(Number.MAX_SAFE_INTEGER, 0), `\nignore = [\n    "${issueCode}"\n]\n`);
                        return { edit: edits, uri };
                    }
                    // No analyzer section: append one
                    edits.insert(uri, new vscode.Position(Number.MAX_SAFE_INTEGER, 0), `\n[analyzer]\nignore = [\n    "${issueCode}"\n]\n`);
                    return { edit: edits, uri };
                } catch {
                    return undefined;
                }
            };
            for (const diag of ctx.diagnostics) {
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
					const allowUnsafe = vscode.workspace.getConfiguration('mago').get<boolean>('analysis.apply.allowUnsafe') ?? false;
					const allowPotentiallyUnsafe = vscode.workspace.getConfiguration('mago').get<boolean>('analysis.apply.allowPotentiallyUnsafe') ?? false;
					if (safety === 'Unsafe' && !allowUnsafe) { continue; }
					if (safety === 'PotentiallyUnsafe' && !allowPotentiallyUnsafe) { continue; }
					actions.push(action);
				}

                // Suppression actions
                const rawCode = getIssueCode(diag);
                const category = getIssueCategory(diag) ?? 'analysis';
                const issueCode = rawCode ? `${category}:${rawCode}` : undefined;
                if (issueCode) {
                    const startLine = diag.range.start.line;
                    const isBlock = diag.range.end.line > diag.range.start.line;
                    const pragmaCodeExpect = `@mago-expect ${issueCode}`;
                    const pragmaCodeIgnore = `@mago-ignore ${issueCode}`;

                    // Get suppression settings
                    const config = vscode.workspace.getConfiguration('mago');
                    const showLineExpect = config.get<boolean>('analysis.suppress.showLineExpect') ?? true;
                    const showLineIgnore = config.get<boolean>('analysis.suppress.showLineIgnore') ?? true;
                    const showBlockIgnore = config.get<boolean>('analysis.suppress.showBlockIgnore') ?? true;
                    const showBlockExpect = config.get<boolean>('analysis.suppress.showBlockExpect') ?? true;
                    const showWorkspaceIgnore = config.get<boolean>('analysis.suppress.showWorkspaceIgnore') ?? true;

                    // Line-level
                    if (showLineExpect) {
                        actions.push(addEditAction(`Mago: Suppress with ${pragmaCodeExpect} (next line)`, makeLinePragmaEdit(document, startLine, pragmaCodeExpect)));
                    }
                    if (showLineIgnore) {
                        actions.push(addEditAction(`Mago: Suppress with ${pragmaCodeIgnore} (next line)`, makeLinePragmaEdit(document, startLine, pragmaCodeIgnore)));
                    }

                    // Block-level (insert before start line)
                    if (isBlock) {
                        const insertLine = Math.max(0, startLine); // before block line is same line; pragma applies to following block
                        if (showBlockIgnore) {
                            actions.push(addEditAction(`Mago: Suppress block with ${pragmaCodeIgnore}`, makeLinePragmaEdit(document, insertLine, pragmaCodeIgnore)));
                        }
                        if (showBlockExpect) {
                            actions.push(addEditAction(`Mago: Expect issue for block with ${pragmaCodeExpect}`, makeLinePragmaEdit(document, insertLine, pragmaCodeExpect)));
                        }
                    }

                    // Workspace-level via mago.toml
                    if (showWorkspaceIgnore) {
                        const tomlResult = makeWorkspaceTomlIgnoreEdit(rawCode!);
                        if (tomlResult) {
                            const action = addEditAction(`Mago: Ignore ${rawCode} in workspace (mago.toml)`, tomlResult.edit);
                            action.command = {
                                title: 'Reanalyze workspace',
                                command: 'mago.reanalyzeAfterTomlChange',
                                arguments: [tomlResult.uri]
                            };
                            actions.push(action);
                        }
                    }
                }
			}
			return actions;
		}
	}));
}


