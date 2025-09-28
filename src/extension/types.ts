import * as vscode from 'vscode';
import { ChildProcess } from 'child_process';

/**
 * Represents the current state of workspace analysis
 */
export interface WorkspaceAnalysisState {
    /** Whether workspace analysis is currently running */
    isAnalyzing: boolean;
    /** Whether a re-run has been requested while analysis is in progress */
    rerunRequested: boolean;
    /** Reference to the current analysis process */
    currentProcess: ChildProcess | null;
}

/**
 * Configuration for extension activation
 */
export interface ExtensionActivationConfig {
    /** Whether to run initial workspace analysis on startup */
    runInitialAnalysis: boolean;
    /** Delay before running initial analysis (in milliseconds) */
    initialAnalysisDelay: number;
    /** Whether to show status bar item */
    showStatusBar: boolean;
    /** Whether to register code actions */
    registerCodeActions: boolean;
}

/**
 * Extension context with additional Mago-specific properties
 */
export interface MagoExtensionContext extends vscode.ExtensionContext {
    /** The Mago diagnostic collection */
    magoDiagnostics?: vscode.DiagnosticCollection;
    /** The Mago output channel */
    magoOutput?: vscode.OutputChannel;
    /** The Mago status bar item */
    magoStatusBar?: vscode.StatusBarItem;
}

/**
 * Analysis trigger types
 */
export type AnalysisTrigger = 'save' | 'type' | 'manual' | 'command';

/**
 * Analysis result information
 */
export interface AnalysisResult {
    /** Whether the analysis was successful */
    success: boolean;
    /** Number of issues found */
    issueCount: number;
    /** Error message if analysis failed */
    error?: string;
    /** Duration of the analysis in milliseconds */
    duration?: number;
}
