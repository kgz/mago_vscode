import * as vscode from 'vscode';
import { getConfig, resolveMagoBinary } from '../config';
import { publishDiagnosticsFromJson, publishWorkspaceDiagnostics, countIssues } from '../diagnostics';
import { magoTemplateManager } from '../template';
import { MagoCommandBuilder, createMagoCommandBuilder } from './commandBuilder';
import { magoProcessExecutor } from './processExecutor';
import { magoAnalysisValidator } from './analysisValidator';
import { MagoExecutionConfig, WorkspaceProcessReference, AnalysisContext } from './types';

/**
 * Main analysis runner for the Mago extension
 * Coordinates file and workspace analysis with proper validation and error handling
 */
export class MagoAnalysisRunner {
    private _commandBuilder: MagoCommandBuilder;

    constructor() {
        this._commandBuilder = createMagoCommandBuilder();
    }

    /**
     * Analyzes the currently active file
     * Validates prerequisites and runs Mago analysis
     */
    public async analyzeActiveFile(
        output: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection | undefined
    ): Promise<void> {
        // Validate active editor
        const editorValidation = magoAnalysisValidator.validateActiveEditor();
        if (!editorValidation.valid) {
            vscode.window.showWarningMessage(editorValidation.message!);
            return;
        }

        const editor = vscode.window.activeTextEditor!;
        const document = editor.document;

        // Validate workspace and mago.toml
        const workspaceValidation = magoAnalysisValidator.validateWorkspaceFolder();
        if (!workspaceValidation.valid) {
            vscode.window.showWarningMessage(workspaceValidation.message!);
            return;
        }

        const tomlValidation = magoAnalysisValidator.validateMagoTomlExists(workspaceValidation.folderPath!);
        if (!tomlValidation.valid) {
            await magoTemplateManager.offerInitialization(workspaceValidation.folderPath!);
            return;
        }

        // Resolve Mago binary
        const magoBinary = await resolveMagoBinary();
        const binaryValidation = magoAnalysisValidator.validateMagoBinary(magoBinary);
        if (!binaryValidation.valid) {
            vscode.window.showErrorMessage(binaryValidation.message!);
            return;
        }

        // Save document if dirty
        const fileValidation = magoAnalysisValidator.validateFileAnalysis(document);
        if (fileValidation.requiresSave) {
            await document.save();
        }

        // Run analysis
        await this.runFileAnalysis(
            magoBinary!,
            document.uri.fsPath,
            workspaceValidation.folderPath!,
            output,
            diagnosticCollection
        );
    }

    /**
     * Analyzes the entire workspace
     * Validates prerequisites and runs Mago analysis
     */
    public async analyzeWorkspace(
        output: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection | undefined,
        processReference: WorkspaceProcessReference
    ): Promise<void> {
        // Validate workspace
        const workspaceValidation = magoAnalysisValidator.validateWorkspaceFolder();
        if (!workspaceValidation.valid) {
            vscode.window.showWarningMessage(workspaceValidation.message!);
            return;
        }

        // Validate mago.toml
        const tomlValidation = magoAnalysisValidator.validateMagoTomlExists(workspaceValidation.folderPath!);
        if (!tomlValidation.valid) {
            await magoTemplateManager.offerInitialization(workspaceValidation.folderPath!);
            return;
        }

        // Resolve Mago binary
        const magoBinary = await resolveMagoBinary();
        const binaryValidation = magoAnalysisValidator.validateMagoBinary(magoBinary);
        if (!binaryValidation.valid) {
            vscode.window.showErrorMessage(binaryValidation.message!);
            return;
        }

        // Set process reference for cancellation
        magoProcessExecutor.setWorkspaceProcessReference(processReference);

        // Run workspace analysis
        await this.runWorkspaceAnalysis(
            magoBinary!,
            workspaceValidation.folderPath!,
            output,
            diagnosticCollection
        );
    }

    /**
     * Runs analysis for a specific file
     */
    private async runFileAnalysis(
        magoBinary: string,
        filePath: string,
        workingDirectory: string,
        output: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection | undefined
    ): Promise<void> {
        const config = getConfig();
        
        // Update command builder with current config
        this._commandBuilder.updateConfig({
            minimumFailLevel: config.minimumFailLevel,
            analyzerArgs: config.analyzerArgs,
        });

        // Build command arguments
        const args = this._commandBuilder.buildArguments();
        args.push(filePath);

        // Create execution config
        const executionConfig: MagoExecutionConfig = {
            workingDirectory,
            extraArgs: config.analyzerArgs,
            dryRun: config.dryRun,
            minimumFailLevel: config.minimumFailLevel,
            saveDirtyDocuments: true,
        };

        // Log command
        const shellCommand = this._commandBuilder.buildShellCommand(magoBinary, filePath);
        output.appendLine(`[mago] cwd=${workingDirectory}`);
        output.appendLine(`[mago] ${config.dryRun ? 'would run' : 'running'}: ${shellCommand}`);

        if (config.dryRun) {
            vscode.window.showInformationMessage('Mago: logged analyze command (no execution).');
            return;
        }

        // Execute analysis
        const result = await magoProcessExecutor.executeMagoCommand(magoBinary, args, executionConfig);

        // Log results
        output.appendLine(`[mago] exit=${result.exitCode}`);
        if (result.stderr) {
            output.appendLine(`[mago][stderr] ${result.stderr}`);
        }

        // Process results
        if (result.stdout) {
            await publishDiagnosticsFromJson(result.stdout, filePath, output, diagnosticCollection);
        } else if (result.exitCode === 0 && diagnosticCollection) {
            // Clear diagnostics for successful analysis with no output
            diagnosticCollection.set(vscode.Uri.file(filePath), []);
        }
    }

    /**
     * Runs analysis for the entire workspace
     */
    private async runWorkspaceAnalysis(
        magoBinary: string,
        workingDirectory: string,
        output: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection | undefined
    ): Promise<void> {
        const config = getConfig();
        
        // Update command builder with current config
        this._commandBuilder.updateConfig({
            minimumFailLevel: config.minimumFailLevel,
            analyzerArgs: config.analyzerArgs,
        });

        // Build command arguments
        const args = this._commandBuilder.buildArguments();

        // Create execution config
        const executionConfig: MagoExecutionConfig = {
            workingDirectory,
            extraArgs: config.analyzerArgs,
            dryRun: config.dryRun,
            minimumFailLevel: config.minimumFailLevel,
            saveDirtyDocuments: false,
        };

        // Log command
        const shellCommand = this._commandBuilder.buildShellCommand(magoBinary);
        output.appendLine(`[mago] workspace cwd=${workingDirectory}`);
        output.appendLine(`[mago] ${config.dryRun ? 'would run' : 'running'}: ${shellCommand}`);

        if (config.dryRun) {
            return;
        }

        // Execute analysis
        const startTime = Date.now();
        const result = await magoProcessExecutor.executeMagoCommand(magoBinary, args, executionConfig, startTime);

        // Log results
        output.appendLine(`[mago] exit=${result.exitCode}`);
        if (result.stderr) {
            output.appendLine(`[mago][stderr] ${result.stderr}`);
        }

        // Process results
        if (result.stdout) {
            await publishWorkspaceDiagnostics(result.stdout, output, diagnosticCollection);
            
            // Log performance metrics
            try {
                const issueCount = countIssues(result.stdout);
                const slowWarning = result.wasSlow ? ' [slow]' : '';
                output.appendLine(`[mago][perf] elapsedMs=${result.duration} issues=${issueCount}${slowWarning}`);
            } catch {
                // If performance logging fails, continue silently
            }
        } else {
            // Clear all diagnostics for successful analysis with no output
            if (diagnosticCollection) {
                diagnosticCollection.clear();
            }
        }
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoAnalysisRunner = new MagoAnalysisRunner();
