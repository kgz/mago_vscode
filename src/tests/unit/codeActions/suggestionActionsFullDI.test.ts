import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
const { expect } = require('chai');
import { container } from 'tsyringe';
import { CodeSuggestionActionService } from '../../../codeActions/suggestionActions';
import { SuggestionActionsService } from '../../../codeActions/suggestionSafetyService';
import { MockWorkspaceService, MockDocumentService, MockWorkspaceEditService, MockCodeActionService } from './services/MockWorkspaceService';
import { MockConfigurationService } from './services/MockConfigurationService';
import { IWorkspaceService, ICodeActionService } from '../../../codeActions/services/IWorkspaceService';
import { IConfigurationService } from '../../../codeActions/services/IConfigurationService';

describe('Code Suggestion Action Service (Full DI) Unit Tests', () => {
    let service: CodeSuggestionActionService;
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
        
        // Get the service from DI container
        service = container.resolve(CodeSuggestionActionService);
    });

    describe('createCodeSuggestionAction', () => {
        it('should create suggestion action for safe operation', () => {
            // Setup mock data
            const suggestionGroup = [
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
            ];

            mockDocumentService.setPositionAt(10, { line: 1, character: 10 });
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.not.be.undefined;
            expect(result!.action.title).to.equal('Mago: Apply suggestion');
            expect(result!.action.kind).to.equal('quickfix');
            expect(result!.safety).to.equal('Safe');
            expect(mockWorkspaceEditService.getEditCount()).to.equal(1);
        });

        it('should create suggestion action for potentially unsafe operation when enabled', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Insert',
                            value: {
                                offset: 5,
                                text: 'potentially unsafe code',
                                safety_classification: { type: 'PotentiallyUnsafe' }
                            }
                        }
                    ]
                }
            ];

            mockDocumentService.setPositionAt(5, { line: 0, character: 5 });
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', true);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.not.be.undefined;
            expect(result!.safety).to.equal('PotentiallyUnsafe');
        });

        it('should reject potentially unsafe operation when disabled', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Insert',
                            value: {
                                offset: 5,
                                text: 'potentially unsafe code',
                                safety_classification: { type: 'PotentiallyUnsafe' }
                            }
                        }
                    ]
                }
            ];

            mockDocumentService.setPositionAt(5, { line: 0, character: 5 });
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.be.undefined;
        });

        it('should create suggestion action for unsafe operation when enabled', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Insert',
                            value: {
                                offset: 0,
                                text: 'unsafe code',
                                safety_classification: { type: 'Unsafe' }
                            }
                        }
                    ]
                }
            ];

            mockDocumentService.setPositionAt(0, { line: 0, character: 0 });
            mockConfigService.setConfig('analysis.apply.allowUnsafe', true);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.not.be.undefined;
            expect(result!.safety).to.equal('Unsafe');
        });

        it('should reject unsafe operation when disabled', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Insert',
                            value: {
                                offset: 0,
                                text: 'unsafe code',
                                safety_classification: { type: 'Unsafe' }
                            }
                        }
                    ]
                }
            ];

            mockDocumentService.setPositionAt(0, { line: 0, character: 0 });
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.be.undefined;
        });

        it('should handle multiple operations', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Insert',
                            value: {
                                offset: 10,
                                text: 'first edit',
                                safety_classification: { type: 'Safe' }
                            }
                        },
                        {
                            type: 'Insert',
                            value: {
                                offset: 20,
                                text: 'second edit',
                                safety_classification: { type: 'Safe' }
                            }
                        }
                    ]
                }
            ];

            mockDocumentService.setPositionAt(10, { line: 1, character: 10 });
            mockDocumentService.setPositionAt(20, { line: 2, character: 0 });
            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.not.be.undefined;
            expect(mockWorkspaceEditService.getEditCount()).to.equal(2);
        });

        it('should handle operations without Insert type', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: [
                        {
                            type: 'Delete',
                            value: {
                                offset: 10,
                                text: 'code to delete'
                            }
                        }
                    ]
                }
            ];

            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.be.undefined;
            expect(mockWorkspaceEditService.getEditCount()).to.equal(0);
        });

        it('should handle empty operations array', () => {
            const suggestionGroup = [
                'test',
                {
                    operations: []
                }
            ];

            mockConfigService.setConfig('analysis.apply.allowUnsafe', false);
            mockConfigService.setConfig('analysis.apply.allowPotentiallyUnsafe', false);

            const result = service.createCodeSuggestionAction(
                suggestionGroup,
                mockDocumentService,
                mockWorkspaceEditService
            );

            expect(result).to.be.undefined;
            expect(mockWorkspaceEditService.getEditCount()).to.equal(0);
        });
    });
});
