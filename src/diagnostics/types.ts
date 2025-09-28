import * as vscode from 'vscode';

/**
 * Represents a Mago issue from the JSON output
 */
export interface MagoIssue {
    level?: string;
    code?: unknown;
    category?: unknown;
    message?: string;
    annotations?: unknown[];
    notes?: unknown[];
    suggestions?: unknown[];
}

/**
 * Represents a Mago annotation with span information
 */
export interface MagoAnnotation {
    span?: {
        file_id?: { path?: string };
        file?: { path?: string };
        start?: { 
            offset?: number; 
            line?: number; 
        };
        end?: { 
            offset?: number; 
            line?: number; 
        };
    };
}

/**
 * Represents the complete Mago JSON output payload
 */
export interface MagoJsonPayload {
    issues?: MagoIssue[];
}

/**
 * Extended VS Code diagnostic with Mago-specific properties
 */
export interface MagoDiagnostic extends vscode.Diagnostic {
    magoCategory?: string;
    magoSuggestions?: unknown[];
}

/**
 * Severity levels that Mago can report
 */
export type MagoSeverityLevel = 'error' | 'warning' | 'note' | 'help';

/**
 * Configuration for diagnostic processing
 */
export interface DiagnosticProcessingConfig {
    /** Whether to include vendor files in diagnostics */
    includeVendorFiles: boolean;
    /** Whether to log diagnostic information to output channel */
    enableLogging: boolean;
    /** Maximum number of diagnostics to process per file */
    maxDiagnosticsPerFile: number;
}
