/**
 * Safety levels for Mago code suggestions
 * - Safe: Suggestions that are guaranteed to be safe to apply
 * - PotentiallyUnsafe: Suggestions that might have side effects
 * - Unsafe: Suggestions that could break code or have significant side effects
 */
export type SuggestionSafetyLevel = 'Safe' | 'PotentiallyUnsafe' | 'Unsafe';

/**
 * Represents a code suggestion action with its safety classification
 */
export interface CodeSuggestionAction {
    /** The VS Code code action that can be applied */
    action: import('vscode').CodeAction;
    /** The safety level of this suggestion */
    safety: SuggestionSafetyLevel | undefined;
}
