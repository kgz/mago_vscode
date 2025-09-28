import * as vscode from 'vscode';
import { analyzeWorkspace } from '../magoCli';
import { WorkspaceAnalysisState } from './types';

/**
 * Manages workspace analysis with single-flight pattern
 * Ensures only one workspace analysis runs at a time
 */
export class WorkspaceAnalysisManager {
    private _state: WorkspaceAnalysisState = {
        isAnalyzing: false,
        rerunRequested: false,
        currentProcess: null,
    };

    /**
     * Runs workspace analysis with single-flight pattern
     * If analysis is already running, requests a re-run instead
     */
    public async runWorkspaceAnalysis(
        output: vscode.OutputChannel,
        diagnosticCollection: vscode.DiagnosticCollection | undefined
    ): Promise<void> {
        if (this._state.isAnalyzing) {
            this._state.rerunRequested = true;
            this.terminateCurrentAnalysis();
            return;
        }

        this._state.isAnalyzing = true;
        
        try {
            do {
                this._state.rerunRequested = false;
                await analyzeWorkspace(output, diagnosticCollection, { child: this._state.currentProcess });
            } while (this._state.rerunRequested);
        } finally {
            this._state.isAnalyzing = false;
        }
    }

    /**
     * Terminates the current analysis process
     */
    private terminateCurrentAnalysis(): void {
        try {
            this._state.currentProcess?.kill('SIGTERM');
        } catch {
            // If termination fails, continue silently
        }
    }

    /**
     * Checks if workspace analysis is currently running
     */
    public isAnalyzing(): boolean {
        return this._state.isAnalyzing;
    }

    /**
     * Checks if a re-run has been requested
     */
    public hasRerunRequested(): boolean {
        return this._state.rerunRequested;
    }

    /**
     * Gets the current analysis state
     */
    public getState(): Readonly<WorkspaceAnalysisState> {
        return { ...this._state };
    }

    /**
     * Resets the analysis state
     * Useful for cleanup or when restarting the extension
     */
    public reset(): void {
        this.terminateCurrentAnalysis();
        this._state = {
            isAnalyzing: false,
            rerunRequested: false,
            currentProcess: null,
        };
    }
}

// Create a singleton instance for easy access throughout the extension
export const workspaceAnalysisManager = new WorkspaceAnalysisManager();
