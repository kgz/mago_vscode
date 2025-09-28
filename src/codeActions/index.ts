// Export all types and interfaces
export * from './types';

// Export suggestion action functions
export { createCodeSuggestionAction, isSuggestionAllowedByUserSettings } from './suggestionActions';

// Export suppression action functions
export { createIssueSuppressionActions, getUserSuppressionSettings } from './suppressionActions';

// Export diagnostic utility functions
export { extractIssueCodeFromDiagnostic, determineIssueCategory } from './diagnosticUtils';

// Export workspace action functions
export { createLinePragmaEdit, createWorkspaceIgnoreAction } from './workspaceActions';

// Export the main provider registration function
export { registerCodeActions } from './codeActionProvider';
