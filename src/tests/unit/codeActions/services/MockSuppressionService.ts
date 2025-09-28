import { 
    IWorkspaceConfiguration, 
    IConfiguration, 
    ITextDocument, 
    ITextLine, 
    IDiagnostic, 
    IRange, 
    IPosition 
} from '../../../../codeActions/services/ISuppressionService';

/**
 * Mock implementation of IConfiguration for testing
 */
export class MockConfiguration implements IConfiguration {
    private settings: Map<string, any> = new Map();

    constructor(initialSettings?: Record<string, any>) {
        if (initialSettings) {
            for (const key in initialSettings) {
                this.settings.set(key, initialSettings[key]);
            }
        }
    }

    get<T>(key: string, defaultValue?: T): T | undefined {
        if (this.settings.has(key)) {
            return this.settings.get(key) as T;
        }
        return defaultValue;
    }

    set(key: string, value: any): void {
        this.settings.set(key, value);
    }
}

/**
 * Mock implementation of IWorkspaceConfiguration for testing
 */
export class MockWorkspaceConfiguration implements IWorkspaceConfiguration {
    private configurations: Map<string, MockConfiguration> = new Map();

    getConfiguration(section: string): IConfiguration {
        if (!this.configurations.has(section)) {
            this.configurations.set(section, new MockConfiguration());
        }
        return this.configurations.get(section)!;
    }

    setConfiguration(section: string, key: string, value: any): void {
        let config = this.configurations.get(section);
        if (!config) {
            config = new MockConfiguration();
            this.configurations.set(section, config);
        }
        config.set(key, value);
    }
}

/**
 * Mock implementation of ITextDocument for testing
 */
export class MockTextDocument implements ITextDocument {
    constructor(
        public uri: { fsPath: string } = { fsPath: '/test/file.php' },
        public lineCount: number = 10,
        private lines: string[] = []
    ) {
        if (lines.length === 0) {
            // Create some default lines
            for (let i = 0; i < lineCount; i++) {
                this.lines.push(`Line ${i + 1}`);
            }
        }
    }

    lineAt(line: number): ITextLine {
        return {
            text: this.lines[line] || '',
            lineNumber: line
        };
    }

    setLine(line: number, text: string): void {
        this.lines[line] = text;
    }
}

/**
 * Mock implementation of IDiagnostic for testing
 */
export class MockDiagnostic implements IDiagnostic {
    public message: string;
    public range: IRange;
    public code?: string | number | { value: string | number; target: any };
    public source?: string;
    public severity?: number;
    public tags?: number[];
    public relatedInformation?: any[];
    public magoCategory?: string;

    constructor(
        message: string = 'Test diagnostic',
        range: IRange = { 
            start: { line: 0, character: 0 }, 
            end: { line: 0, character: 10 } 
        },
        code?: string | number | { value: string | number; target: any },
        source?: string,
        severity?: number,
        tags?: number[],
        relatedInformation?: any[],
        magoCategory?: string
    ) {
        this.message = message;
        this.range = range;
        this.code = code;
        this.source = source || 'mago';
        this.severity = severity || 1;
        this.tags = tags;
        this.relatedInformation = relatedInformation;
        this.magoCategory = magoCategory || 'analysis';
    }
}

/**
 * Helper function to create mock diagnostics with different configurations
 */
export function createMockDiagnostic(overrides: Partial<IDiagnostic> = {}): MockDiagnostic {
    return new MockDiagnostic(
        overrides.message,
        overrides.range,
        overrides.code,
        overrides.source,
        overrides.severity,
        overrides.tags,
        overrides.relatedInformation,
        overrides.magoCategory
    );
}

/**
 * Helper function to create mock documents with different configurations
 */
export function createMockDocument(overrides: Partial<ITextDocument> = {}): MockTextDocument {
    return new MockTextDocument(
        overrides.uri,
        overrides.lineCount,
        []
    );
}
