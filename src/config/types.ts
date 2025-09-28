/**
 * Defines when Mago analysis should be triggered
 * - save: Run analysis when files are saved
 * - type: Run analysis as the user types (with debouncing)
 * - manual: Only run analysis when manually triggered
 */
export type AnalysisTriggerMode = 'save' | 'type' | 'manual';

/**
 * Complete configuration for the Mago VS Code extension
 * Contains all settings that control how Mago analysis behaves
 */
export interface MagoExtensionConfig {
    /** Path to the Mago binary (empty string means auto-detect) */
    magoPath: string;
    
    /** Additional command-line arguments to pass to Mago */
    analyzerArgs: string[];
    
    /** When to trigger analysis */
    runOn: AnalysisTriggerMode;
    
    /** Minimum issue level that causes non-zero exit code */
    minimumFailLevel: string;
    
    /** Whether to run in dry-run mode (for debugging) */
    dryRun: boolean;
    
    /** Debounce delay in milliseconds for on-type analysis */
    debounceMs: number;
    
    /** Whether to allow unsafe code suggestions */
    allowUnsafe: boolean;
    
    /** Whether to allow potentially unsafe code suggestions */
    allowPotentiallyUnsafe: boolean;
}
