import { MagoJsonPayload, MagoIssue } from './types';

/**
 * Parses Mago JSON output and extracts issues
 * Returns an empty array if parsing fails
 */
export function parseMagoJsonOutput(jsonText: string): MagoIssue[] {
    try {
        const payload: unknown = JSON.parse(jsonText);
        const magoPayload = payload as MagoJsonPayload;
        
        if (!Array.isArray(magoPayload?.issues)) {
            return [];
        }
        
        return magoPayload.issues;
    } catch {
        return [];
    }
}

/**
 * Counts the number of issues in Mago JSON output
 * Returns 0 if parsing fails
 */
export function countIssuesInJsonOutput(jsonText: string): number {
    const issues = parseMagoJsonOutput(jsonText);
    return issues.length;
}

/**
 * Validates that the JSON text is valid Mago output
 * Checks for required structure and fields
 */
export function isValidMagoJsonOutput(jsonText: string): boolean {
    try {
        const payload: unknown = JSON.parse(jsonText);
        
        // Check if it's an object
        if (typeof payload !== 'object' || payload === null) {
            return false;
        }
        
        // Check if it has an issues array
        const magoPayload = payload as MagoJsonPayload;
        return Array.isArray(magoPayload.issues);
    } catch {
        return false;
    }
}
