import { MagoCommandConfig } from './types';

/**
 * Builds Mago command-line arguments for analysis
 * Handles argument construction and shell escaping
 */
export class MagoCommandBuilder {
    private _config: MagoCommandConfig;

    constructor(config: MagoCommandConfig) {
        this._config = config;
    }

    /**
     * Builds the complete command-line arguments array
     */
    public buildArguments(): string[] {
        const args: string[] = [this._config.command];
        
        // Add reporting format and target
        args.push('--reporting-format', this._config.reportingFormat);
        args.push('--reporting-target', this._config.reportingTarget);
        
        // Add minimum fail level if specified
        if (this._config.minimumFailLevel) {
            args.push('--minimum-fail-level', this._config.minimumFailLevel);
        }
        
        // Add additional analyzer arguments
        args.push(...this._config.analyzerArgs);
        
        return args;
    }

    /**
     * Builds a shell-quoted command string for logging
     * Useful for debugging and dry-run output
     */
    public buildShellCommand(magoBinary: string, targetPath?: string): string {
        const args = this.buildArguments();
        const allArgs = targetPath ? [...args, targetPath] : args;
        
        const shellQuote = (s: string) => this.shellQuote(s);
        const quotedArgs = [shellQuote(magoBinary), ...allArgs.map(shellQuote)];
        
        return quotedArgs.join(' ');
    }

    /**
     * Escapes a string for shell usage
     * Handles spaces, quotes, and backslashes
     */
    private shellQuote(str: string): string {
        // If the string contains special characters, wrap it in single quotes
        if (/[\s"'\\]/.test(str)) {
            // Escape single quotes by replacing ' with '\''
            return `'${str.replace(/'/g, "'\\''")}'`;
        }
        
        // No special characters, return as-is
        return str;
    }

    /**
     * Updates the command configuration
     */
    public updateConfig(config: Partial<MagoCommandConfig>): void {
        this._config = { ...this._config, ...config };
    }

    /**
     * Gets the current command configuration
     */
    public getConfig(): Readonly<MagoCommandConfig> {
        return { ...this._config };
    }
}

/**
 * Creates a Mago command builder with default configuration
 */
export function createMagoCommandBuilder(
    command: string = 'analyze',
    reportingFormat: string = 'json',
    reportingTarget: string = 'stdout'
): MagoCommandBuilder {
    return new MagoCommandBuilder({
        command,
        reportingFormat,
        reportingTarget,
        analyzerArgs: [],
    });
}
