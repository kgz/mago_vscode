import { spawn, ChildProcess } from 'child_process';
import { MagoAnalysisResult, MagoExecutionConfig, WorkspaceProcessReference } from './types';

/**
 * Executes Mago CLI processes with proper error handling and output collection
 * Manages process lifecycle and provides comprehensive result information
 */
export class MagoProcessExecutor {
    private _processReference: WorkspaceProcessReference | null = null;

    /**
     * Sets the workspace process reference for cancellation support
     */
    public setWorkspaceProcessReference(reference: WorkspaceProcessReference): void {
        this._processReference = reference;
    }

    /**
     * Executes a Mago CLI command and returns the analysis result
     */
    public async executeMagoCommand(
        magoBinary: string,
        args: string[],
        config: MagoExecutionConfig,
        startTime?: number
    ): Promise<MagoAnalysisResult> {
        const startTimestamp = startTime ?? Date.now();
        
        // Create and configure the child process
        const child = spawn(magoBinary, args, { 
            cwd: config.workingDirectory 
        });

        // Set the process reference for cancellation
        if (this._processReference) {
            this._processReference.child = child;
        }

        // Collect output
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Wait for process completion
        const exitCode = await new Promise<number>((resolve) => {
            child.on('close', resolve);
        });

        // Clear the process reference
        if (this._processReference) {
            this._processReference.child = null;
        }

        // Calculate duration and performance metrics
        const duration = Date.now() - startTimestamp;
        const wasSlow = duration > 3000;

        return {
            success: exitCode === 0,
            exitCode,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration,
            wasSlow,
        };
    }

    /**
     * Terminates the current workspace analysis process
     * Used for cancellation when a new analysis is requested
     */
    public terminateCurrentProcess(): void {
        if (this._processReference?.child) {
            try {
                this._processReference.child.kill('SIGTERM');
            } catch {
                // If termination fails, continue silently
            }
        }
    }

    /**
     * Checks if a process is currently running
     */
    public isProcessRunning(): boolean {
        return this._processReference?.child !== null;
    }
}

// Create a singleton instance for easy access throughout the extension
export const magoProcessExecutor = new MagoProcessExecutor();
