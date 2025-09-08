import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Mago Extension - Activation', () => {
	test('activates successfully', async () => {
		const ext = vscode.extensions.getExtension('undefined_publisher.mago-problems');
		assert.ok(ext, 'Extension not found (undefined_publisher.mago-problems)');
		await ext!.activate();
		assert.ok(ext!.isActive, 'Extension failed to activate');
	});
});


