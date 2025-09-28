import * as vscode from 'vscode';

/**
 * Extracts the issue code from a VS Code diagnostic
 * Handles different formats: string, number, or complex objects
 */
export function extractIssueCodeFromDiagnostic(diagnostic: vscode.Diagnostic): string | undefined {
    const codeValue = diagnostic.code;
    
    // No code provided
    if (!codeValue) {
        return undefined;
    }
    
    // Simple string or number codes
    if (typeof codeValue === 'string') {
        return codeValue;
    }
    
    if (typeof codeValue === 'number') {
        return String(codeValue);
    }
    
    // Complex object codes (VS Code DiagnosticCode)
    try {
        const complexCode = codeValue as { 
            value?: string; 
            target?: { toString(): string } 
        };
        
        // Try to get the value property first
        if (complexCode.value) {
            return complexCode.value;
        }
        
        // Fall back to target.toString()
        if (complexCode.target) {
            return complexCode.target.toString();
        }
        
        return undefined;
    } catch {
        // If anything goes wrong, return undefined
        return undefined;
    }
}

/**
 * Determines the category of a diagnostic issue
 * Returns 'lint' for linting issues, 'analysis' for analysis issues, or undefined
 */
export function determineIssueCategory(diagnostic: vscode.Diagnostic): 'lint' | 'analysis' | undefined {
    // Extract the custom mago category from the diagnostic
    const customCategory = (diagnostic as vscode.Diagnostic & { magoCategory?: string }).magoCategory;
    
    if (!customCategory) {
        return undefined;
    }
    
    const categoryLowercase = customCategory.toLowerCase();
    
    // Check for linting-related categories
    if (categoryLowercase.startsWith('lint')) {
        return 'lint';
    }
    
    // Check for analysis-related categories
    const analysisKeywords = ['analysis', 'analyzer', 'analyser'];
    if (analysisKeywords.some(keyword => categoryLowercase.startsWith(keyword))) {
        return 'analysis';
    }
    
    // Unknown category
    return undefined;
}
