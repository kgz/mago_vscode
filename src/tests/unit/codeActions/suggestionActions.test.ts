import 'reflect-metadata';
import { describe, it, beforeEach } from 'mocha';
const { expect } = require('chai');
import { container } from 'tsyringe';
import { SuggestionActionsService } from '../../../codeActions/suggestionSafetyService';
import { MockConfigurationService } from './services/MockConfigurationService';
import { IConfigurationService } from '../../../codeActions/services/IConfigurationService';

describe('Suggestion Actions Unit Tests (with DI)', () => {
    let service: SuggestionActionsService;
    let mockConfig: MockConfigurationService;

    beforeEach(() => {
        // Clear container and register mock service
        container.clearInstances();
        mockConfig = new MockConfigurationService();
        container.registerInstance('IConfigurationService', mockConfig);
        
        // Get the service from DI container
        service = container.resolve(SuggestionActionsService);
    });

    describe('isSuggestionAllowedByUserSettings', () => {
        it('should always allow safe suggestions', () => {
            const result = service.isSuggestionAllowedByUserSettings('Safe');
            expect(result).to.be.true;
        });

        it('should allow potentially unsafe suggestions when enabled', () => {
            mockConfig.setConfig('analysis.apply.allowPotentiallyUnsafe', true);
            
            const result = service.isSuggestionAllowedByUserSettings('PotentiallyUnsafe');
            expect(result).to.be.true;
        });

        it('should deny potentially unsafe suggestions when disabled', () => {
            mockConfig.setConfig('analysis.apply.allowPotentiallyUnsafe', false);
            
            const result = service.isSuggestionAllowedByUserSettings('PotentiallyUnsafe');
            expect(result).to.be.false;
        });

        it('should allow unsafe suggestions when explicitly enabled', () => {
            mockConfig.setConfig('analysis.apply.allowUnsafe', true);
            
            const result = service.isSuggestionAllowedByUserSettings('Unsafe');
            expect(result).to.be.true;
        });

        it('should deny unsafe suggestions when disabled', () => {
            mockConfig.setConfig('analysis.apply.allowUnsafe', false);
            
            const result = service.isSuggestionAllowedByUserSettings('Unsafe');
            expect(result).to.be.false;
        });

        it('should allow unknown safety levels by default', () => {
            const result = service.isSuggestionAllowedByUserSettings('Unknown' as any);
            expect(result).to.be.true;
        });

        it('should handle undefined safety level', () => {
            const result = service.isSuggestionAllowedByUserSettings(undefined);
            expect(result).to.be.true;
        });

        it('should use default values when config is not set', () => {
            // Don't set any config values
            const resultUnsafe = service.isSuggestionAllowedByUserSettings('Unsafe');
            const resultPotentiallyUnsafe = service.isSuggestionAllowedByUserSettings('PotentiallyUnsafe');
            
            expect(resultUnsafe).to.be.false; // Default is false
            expect(resultPotentiallyUnsafe).to.be.false; // Default is false
        });

        it('should handle complex configuration scenarios', () => {
            // Test multiple settings together
            mockConfig.setConfig('analysis.apply.allowUnsafe', true);
            mockConfig.setConfig('analysis.apply.allowPotentiallyUnsafe', false);
            
            expect(service.isSuggestionAllowedByUserSettings('Safe')).to.be.true;
            expect(service.isSuggestionAllowedByUserSettings('PotentiallyUnsafe')).to.be.false;
            expect(service.isSuggestionAllowedByUserSettings('Unsafe')).to.be.true;
        });
    });
});