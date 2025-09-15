import * as vscode from 'vscode';

export function registerCodeActions(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('php', {
		provideCodeActions(document, range, ctx, token) {
			const actions: vscode.CodeAction[] = [];
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
					const allowUnsafe = vscode.workspace.getConfiguration('mago').get<boolean>('apply.allowUnsafe') ?? false;
					const allowPotentiallyUnsafe = vscode.workspace.getConfiguration('mago').get<boolean>('apply.allowPotentiallyUnsafe') ?? false;
					if (safety === 'Unsafe' && !allowUnsafe) { continue; }
					if (safety === 'PotentiallyUnsafe' && !allowPotentiallyUnsafe) { continue; }
					actions.push(action);
				}
			}
			return actions;
		}
	}));
}


