// Export all types and interfaces
export * from './types';

// Export diagnostic collection management functions
export { 
    createMagoDiagnosticCollection,
    clearAllDiagnostics,
    setDiagnosticsForFile,
    removeDiagnosticsForFile,
    getDiagnosticsForFile
} from './diagnosticCollection';

// Export JSON parsing functions
export { 
    parseMagoJsonOutput,
    countIssuesInJsonOutput,
    isValidMagoJsonOutput
} from './jsonParser';

// Export diagnostic conversion functions
export { convertMagoIssueToDiagnostic } from './diagnosticConverter';

// Export file filtering functions
export { 
    isVendorFilePath,
    shouldIncludeFileInDiagnostics,
    hasMagoConfigurationFile,
    getWorkspaceRoot,
    isFileInWorkspace
} from './fileFilter';

// Export diagnostic publishing functions
export { 
    publishDiagnosticsForFile,
    publishWorkspaceDiagnostics
} from './diagnosticPublisher';

// Export the main diagnostics manager
export { 
    MagoDiagnosticsManager,
    magoDiagnosticsManager,
    publishDiagnosticsFromJson,
    publishWorkspaceDiagnosticsFromJson,
    countIssues,
    createDiagnosticsCollection
} from './diagnosticsManager';
