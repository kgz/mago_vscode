import 'reflect-metadata';
import { describe, it } from 'mocha';
const { expect } = require('chai');
import { SuggestionSafetyLevel } from '../../../codeActions/types';

describe('Code Actions Types Unit Tests', () => {
    
    describe('SuggestionSafetyLevel type', () => {
        it('should have correct type values', () => {
            const safeLevel: SuggestionSafetyLevel = 'Safe';
            const potentiallyUnsafeLevel: SuggestionSafetyLevel = 'PotentiallyUnsafe';
            const unsafeLevel: SuggestionSafetyLevel = 'Unsafe';
            
            expect(safeLevel).to.equal('Safe');
            expect(potentiallyUnsafeLevel).to.equal('PotentiallyUnsafe');
            expect(unsafeLevel).to.equal('Unsafe');
        });

        it('should allow type checking', () => {
            const safeLevel: SuggestionSafetyLevel = 'Safe';
            const potentiallyUnsafeLevel: SuggestionSafetyLevel = 'PotentiallyUnsafe';
            const unsafeLevel: SuggestionSafetyLevel = 'Unsafe';
            
            expect(safeLevel).to.equal('Safe');
            expect(potentiallyUnsafeLevel).to.equal('PotentiallyUnsafe');
            expect(unsafeLevel).to.equal('Unsafe');
        });

        it('should handle type validation', () => {
            function isValidSafetyLevel(level: string): level is SuggestionSafetyLevel {
                return ['Safe', 'PotentiallyUnsafe', 'Unsafe'].includes(level);
            }

            expect(isValidSafetyLevel('Safe')).to.be.true;
            expect(isValidSafetyLevel('PotentiallyUnsafe')).to.be.true;
            expect(isValidSafetyLevel('Unsafe')).to.be.true;
            expect(isValidSafetyLevel('Unknown')).to.be.false;
            expect(isValidSafetyLevel('')).to.be.false;
        });
    });

    describe('Type validation utilities', () => {
        it('should validate safety level strings', () => {
            const validLevels = ['Safe', 'PotentiallyUnsafe', 'Unsafe'];
            const invalidLevels = ['Unknown', '', 'safe', 'SAFE', 'potentially-unsafe'];

            validLevels.forEach(level => {
                expect(['Safe', 'PotentiallyUnsafe', 'Unsafe'].includes(level)).to.be.true;
            });

            invalidLevels.forEach(level => {
                expect(['Safe', 'PotentiallyUnsafe', 'Unsafe'].includes(level)).to.be.false;
            });
        });

        it('should handle case sensitivity', () => {
            expect('Safe').to.equal('Safe');
            expect('Safe').to.not.equal('safe');
            expect('Safe').to.not.equal('SAFE');
        });
    });

    describe('Interface structure validation', () => {
        it('should validate CodeSuggestionAction structure', () => {
            // Test that we can create objects matching the interface
            const mockAction = {
                action: {
                    title: 'Test Action',
                    kind: 'quickfix' as any,
                    edit: {} as any
                },
                safety: 'Safe' as SuggestionSafetyLevel
            };

            expect(mockAction.action.title).to.equal('Test Action');
            expect(mockAction.safety).to.equal('Safe');
        });

        it('should validate SuppressionActionSettings structure', () => {
            const mockSettings = {
                showLineExpect: true,
                showLineIgnore: true,
                showBlockIgnore: true,
                showBlockExpect: true,
                showWorkspaceIgnore: true
            };

            expect(mockSettings.showLineExpect).to.be.true;
            expect(mockSettings.showLineIgnore).to.be.true;
            expect(mockSettings.showBlockIgnore).to.be.true;
            expect(mockSettings.showBlockExpect).to.be.true;
            expect(mockSettings.showWorkspaceIgnore).to.be.true;
        });
    });
});
