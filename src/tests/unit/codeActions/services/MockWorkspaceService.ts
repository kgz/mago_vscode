import { 
    IWorkspaceService, 
    IConfigurationSection, 
    IDocumentService, 
    IPosition, 
    IWorkspaceEditService, 
    ICodeActionService, 
    ICodeAction 
} from '../../../../codeActions/services/IWorkspaceService';

/**
 * Mock implementation of IConfigurationSection for testing
 */
export class MockConfigurationSection implements IConfigurationSection {
    private config: Record<string, any> = {};

    setConfig(key: string, value: any): void {
        this.config[key] = value;
    }

    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.config[key] ?? defaultValue;
    }
}

/**
 * Mock implementation of IWorkspaceService for testing
 */
export class MockWorkspaceService implements IWorkspaceService {
    private configSection = new MockConfigurationSection();

    getConfiguration(section: string): IConfigurationSection {
        return this.configSection;
    }

    setConfig(key: string, value: any): void {
        this.configSection.setConfig(key, value);
    }
}

/**
 * Mock implementation of IDocumentService for testing
 */
export class MockDocumentService implements IDocumentService {
    private mockPositions: Map<number, IPosition> = new Map();

    setPositionAt(offset: number, position: IPosition): void {
        this.mockPositions.set(offset, position);
    }

    positionAt(offset: number): IPosition {
        return this.mockPositions.get(offset) ?? { line: 0, character: offset };
    }
}

/**
 * Mock implementation of IWorkspaceEditService for testing
 */
export class MockWorkspaceEditService implements IWorkspaceEditService {
    private edits: Array<{ uri: string; position: IPosition; text: string }> = [];

    insert(uri: string, position: IPosition, text: string): void {
        this.edits.push({ uri, position, text });
    }

    getEdits(): Array<{ uri: string; position: IPosition; text: string }> {
        return [...this.edits];
    }

    clearEdits(): void {
        this.edits = [];
    }

    getEditCount(): number {
        return this.edits.length;
    }
}

/**
 * Mock implementation of ICodeActionService for testing
 */
export class MockCodeActionService implements ICodeActionService {
    createCodeAction(title: string, kind: string): ICodeAction {
        return {
            title,
            kind,
            edit: undefined
        };
    }
}
