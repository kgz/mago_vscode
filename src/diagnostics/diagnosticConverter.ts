import * as vscode from 'vscode';
import { MagoIssue, MagoAnnotation, MagoSeverityLevel, MagoDiagnostic } from './types';

/**
 * Converts a Mago issue to a VS Code diagnostic
 * Handles all the complex type conversions and range calculations
 */
export async function convertMagoIssueToDiagnostic(
    issue: MagoIssue, 
    targetFilePath: string
): Promise<vscode.Diagnostic | null> {
    // Extract basic issue information
    const severity = convertMagoLevelToVSCodeSeverity(issue.level);
    const code = issue.code ? String(issue.code) : undefined;
    const message = String(issue.message ?? '');
    const category = issue.category ? String(issue.category) : undefined;
    
    // Extract annotation information
    const annotation = extractAnnotationFromIssue(issue);
    if (!annotation) {
        return null;
    }
    
    // Get file path from annotation
    const filePath = extractFilePathFromAnnotation(annotation);
    if (!filePath) {
        return null;
    }
    
    // Calculate the diagnostic range
    const range = await calculateDiagnosticRange(annotation, filePath);
    if (!range) {
        return null;
    }
    
    // Create the VS Code diagnostic
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'mago';
    
    if (code) {
        diagnostic.code = code;
    }
    
    // Add Mago-specific properties
    const magoDiagnostic = diagnostic as MagoDiagnostic;
    if (category) {
        magoDiagnostic.magoCategory = category;
    }
    
    // Add related information from notes
    const relatedInfo = createRelatedInformation(issue.notes, filePath, range.start);
    if (relatedInfo.length > 0) {
        diagnostic.relatedInformation = relatedInfo;
    }
    
    // Add suggestions
    if (Array.isArray(issue.suggestions)) {
        magoDiagnostic.magoSuggestions = issue.suggestions;
    }
    
    return diagnostic;
}

/**
 * Converts Mago severity level to VS Code diagnostic severity
 */
function convertMagoLevelToVSCodeSeverity(level?: string): vscode.DiagnosticSeverity {
    const normalizedLevel = String(level ?? 'error').toLowerCase() as MagoSeverityLevel;
    
    switch (normalizedLevel) {
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'warning':
            return vscode.DiagnosticSeverity.Warning;
        case 'note':
        case 'help':
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}

/**
 * Extracts the first annotation from a Mago issue
 */
function extractAnnotationFromIssue(issue: MagoIssue): MagoAnnotation | null {
    if (!Array.isArray(issue.annotations) || issue.annotations.length === 0) {
        return null;
    }
    
    return issue.annotations[0] as MagoAnnotation;
}

/**
 * Extracts the file path from a Mago annotation
 */
function extractFilePathFromAnnotation(annotation: MagoAnnotation): string | null {
    const span = annotation.span;
    if (!span) {
        return null;
    }
    
    // Try file_id.path first, then file.path
    return span.file_id?.path ?? span.file?.path ?? null;
}

/**
 * Calculates the diagnostic range from annotation information
 * Tries offset-based positioning first, falls back to line-based
 */
async function calculateDiagnosticRange(
    annotation: MagoAnnotation, 
    filePath: string
): Promise<vscode.Range | null> {
    const span = annotation.span;
    if (!span) {
        return null;
    }
    
    // Try offset-based positioning (more accurate)
    const offsetRange = await calculateRangeFromOffsets(span, filePath);
    if (offsetRange) {
        return offsetRange;
    }
    
    // Fall back to line-based positioning
    return calculateRangeFromLines(span);
}

/**
 * Calculates range using character offsets (most accurate)
 */
async function calculateRangeFromOffsets(
    span: MagoAnnotation['span'], 
    filePath: string
): Promise<vscode.Range | null> {
    const startOffset = span?.start?.offset;
    const endOffset = span?.end?.offset;
    
    if (typeof startOffset !== 'number' || typeof endOffset !== 'number') {
        return null;
    }
    
    try {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        const startPosition = document.positionAt(startOffset);
        const endPosition = document.positionAt(Math.max(startOffset, endOffset));
        
        return new vscode.Range(startPosition, endPosition);
    } catch {
        return null;
    }
}

/**
 * Calculates range using line numbers (fallback method)
 */
function calculateRangeFromLines(span: MagoAnnotation['span']): vscode.Range | null {
    const startLine = span?.start?.line ?? 0;
    const endLine = span?.end?.line ?? startLine;
    
    return new vscode.Range(
        Math.max(0, startLine), 
        0, 
        Math.max(0, endLine), 
        1e9 // Large number to cover the entire line
    );
}

/**
 * Creates related information from issue notes
 */
function createRelatedInformation(
    notes: unknown[] | undefined, 
    filePath: string, 
    position: vscode.Position
): vscode.DiagnosticRelatedInformation[] {
    if (!Array.isArray(notes)) {
        return [];
    }
    
    const uri = vscode.Uri.file(filePath);
    const location = new vscode.Location(uri, position);
    
    return notes.map(note => new vscode.DiagnosticRelatedInformation(
        location, 
        String(note)
    ));
}
