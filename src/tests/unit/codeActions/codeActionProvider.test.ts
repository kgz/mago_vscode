import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
const { expect } = require('chai');
import { container } from 'tsyringe';
import { CodeSuggestionActionService } from '../../../codeActions/suggestionActions';
import { MockWorkspaceService, MockDocumentService, MockWorkspaceEditService, MockCodeActionService } from './services/MockWorkspaceService';
import { MockConfigurationService } from './services/MockConfigurationService';
import { IWorkspaceService, ICodeActionService } from '../../../codeActions/services/IWorkspaceService';
import { IConfigurationService } from '../../../codeActions/services/IConfigurationService';

describe('Code Action Provider Unit Tests', () => {
    let mockWorkspaceService: MockWorkspaceService;
    let mockDocumentService: MockDocumentService;
    let mockWorkspaceEditService: MockWorkspaceEditService;
    let mockCodeActionService: MockCodeActionService;
    let mockConfigService: MockConfigurationService;

    beforeEach(() => {
        // Clear container and register mock services
        container.clearInstances();
        
        mockWorkspaceService = new MockWorkspaceService();
        mockDocumentService = new MockDocumentService();
        mockWorkspaceEditService = new MockWorkspaceEditService();
        mockCodeActionService = new MockCodeActionService();
        mockConfigService = new MockConfigurationService();
        
        container.registerInstance('IWorkspaceService', mockWorkspaceService);
        container.registerInstance('ICodeActionService', mockCodeActionService);
        container.registerInstance('IConfigurationService', mockConfigService);
    });

    describe('provideCodeActions logic', () => {
        it('should process diagnostics with mago suggestions', () => {
            // Mock the core logic from provideCodeActions
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                // Process each diagnostic to create appropriate code actions
                for (const diagnostic of diagnostics) {
                    // Create suggestion actions from Mago's code suggestions
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            // Setup test data
            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const diagnostics = [
                {
                    message: 'Test diagnostic',
                    magoSuggestions: [
                        [
                            'test',
                            {
                                operations: [
                                    {
                                        type: 'Insert',
                                        value: {
                                            offset: 10,
                                            text: 'new code',
                                            safety_classification: { type: 'Safe' }
                                        }
                                    }
                                ]
                            }
                        ]
                    ]
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(1);
            expect(result[0].title).to.equal('Mago: Apply suggestion');
            expect(result[0].kind).to.equal('quickfix');
        });

        it('should handle diagnostics without mago suggestions', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            const diagnostics = [
                {
                    message: 'Test diagnostic without suggestions'
                    // No magoSuggestions property
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(0);
        });

        it('should handle multiple diagnostics with multiple suggestions', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const diagnostics = [
                {
                    message: 'First diagnostic',
                    magoSuggestions: [
                        [
                            'test1',
                            {
                                operations: [
                                    {
                                        type: 'Insert',
                                        value: {
                                            offset: 10,
                                            text: 'first suggestion',
                                            safety_classification: { type: 'Safe' }
                                        }
                                    }
                                ]
                            }
                        ]
                    ]
                },
                {
                    message: 'Second diagnostic',
                    magoSuggestions: [
                        [
                            'test2',
                            {
                                operations: [
                                    {
                                        type: 'Insert',
                                        value: {
                                            offset: 20,
                                            text: 'second suggestion',
                                            safety_classification: { type: 'Safe' }
                                        }
                                    }
                                ]
                            }
                        ]
                    ]
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(2);
            expect(result[0].title).to.equal('Mago: Apply suggestion');
            expect(result[1].title).to.equal('Mago: Apply suggestion');
        });

        it('should filter out disallowed suggestions', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            // Disable unsafe suggestions
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const diagnostics = [
                {
                    message: 'Unsafe diagnostic',
                    magoSuggestions: [
                        [
                            'test',
                            {
                                operations: [
                                    {
                                        type: 'Insert',
                                        value: {
                                            offset: 10,
                                            text: 'unsafe code',
                                            safety_classification: { type: 'Unsafe' }
                                        }
                                    }
                                ]
                            }
                        ]
                    ]
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(0); // Should be filtered out
        });

        it('should handle empty diagnostics array', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            const diagnostics: any[] = [];
            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(0);
        });
    });

    describe('diagnostic processing edge cases', () => {
        it('should handle diagnostics with null magoSuggestions', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            const diagnostics = [
                {
                    message: 'Test diagnostic',
                    magoSuggestions: null
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(0);
        });

        it('should handle diagnostics with undefined magoSuggestions', () => {
            function provideCodeActionsLogic(
                diagnostics: any[],
                document: any,
                suggestionActionService: CodeSuggestionActionService
            ): any[] {
                const availableActions: any[] = [];
                const documentService = new MockDocumentService();
                const workspaceEditService = new MockWorkspaceEditService();
                
                for (const diagnostic of diagnostics) {
                    const magoSuggestions = (diagnostic as any).magoSuggestions ?? [];
                    
                    for (const suggestionGroup of magoSuggestions) {
                        const suggestionAction = suggestionActionService.createCodeSuggestionAction(
                            suggestionGroup, 
                            documentService, 
                            workspaceEditService
                        );
                        
                        if (suggestionAction) {
                            availableActions.push(suggestionAction.action);
                        }
                    }
                }
                
                return availableActions;
            }

            const suggestionActionService = container.resolve(CodeSuggestionActionService);
            const diagnostics = [
                {
                    message: 'Test diagnostic'
                    // magoSuggestions is undefined
                }
            ];

            const document = { uri: { fsPath: '/test/file.php' } };

            const result = provideCodeActionsLogic(diagnostics, document, suggestionActionService);

            expect(result).to.have.length(0);
        });
    });
});
