import { ChildProcess } from 'child_process';

/**
 * Represents the result of a Mago analysis
 */
export interface MagoAnalysisResult {
    /** Whether the analysis was successful */
    success: boolean;
    /** Exit code from the Mago process */
    exitCode: number;
    /** Standard output from Mago */
    stdout: string;
    /** Standard error output from Mago */
    stderr: string;
    /** Duration of the analysis in milliseconds */
    duration?: number;
    /** Number of issues found */
    issueCount?: number;
    /** Whether the analysis was slow (> 3000ms) */
    wasSlow?: boolean;
}

/**
 * Configuration for Mago CLI execution
 */
export interface MagoExecutionConfig {
    /** Working directory for the Mago process */
    workingDirectory: string;
    /** Additional command-line arguments */
    extraArgs: string[];
    /** Whether to run in dry-run mode */
    dryRun: boolean;
    /** Minimum fail level for analysis */
    minimumFailLevel?: string;
    /** Whether to save dirty documents before analysis */
    saveDirtyDocuments: boolean;
}

/**
 * Reference to the current workspace analysis process
 * Used for process management and cancellation
 */
export interface WorkspaceProcessReference {
    /** The current child process */
    child: ChildProcess | null;
}

/**
 * Analysis context for different analysis types
 */
export interface AnalysisContext {
    /** The target file or directory to analyze */
    target: string;
    /** The type of analysis being performed */
    type: 'file' | 'workspace';
    /** Whether to check for mago.toml existence */
    checkTomlExists: boolean;
    /** Whether to offer initialization if toml is missing */
    offerInitIfMissing: boolean;
}

/**
 * Mago command-line argument builder configuration
 */
export interface MagoCommandConfig {
    /** Base command (usually 'analyze') */
    command: string;
    /** Reporting format (usually 'json') */
    reportingFormat: string;
    /** Reporting target (usually 'stdout') */
    reportingTarget: string;
    /** Minimum fail level */
    minimumFailLevel?: string;
    /** Additional analyzer arguments */
    analyzerArgs: string[];
}
