import { describe, it } from 'mocha';
const { expect } = require('chai');

// Import the functions we want to test
import { 
    extractProjectName, 
    extractPhpVersionConstraint,
    derivePhpVersionFromConstraint,
    getPhpVersionForTemplate
} from '../../../template/composerParser';
import { ComposerConfig } from '../../../template/types';

describe('Composer Parser Unit Tests', () => {
    
    describe('extractProjectName', () => {
        it('should extract valid project name', () => {
            const composerConfig: ComposerConfig = { name: 'vendor/package' };
            const result = extractProjectName(composerConfig);
            expect(result).to.equal('vendor/package');
        });

        it('should return undefined for missing name', () => {
            const composerConfig: ComposerConfig = {};
            const result = extractProjectName(composerConfig);
            expect(result).to.be.undefined;
        });

        it('should return undefined for invalid name type', () => {
            const composerConfig = { name: 123 as any };
            const result = extractProjectName(composerConfig);
            expect(result).to.be.undefined;
        });

        it('should return undefined for undefined config', () => {
            const result = extractProjectName(undefined);
            expect(result).to.be.undefined;
        });

        it('should handle empty string name', () => {
            const composerConfig: ComposerConfig = { name: '' };
            const result = extractProjectName(composerConfig);
            expect(result).to.be.undefined; // Empty string is treated as invalid
        });
    });

    describe('extractPhpVersionConstraint', () => {
        it('should extract PHP version from require', () => {
            const composerConfig: ComposerConfig = { 
                require: { php: '^8.1' } 
            };
            const result = extractPhpVersionConstraint(composerConfig);
            expect(result).to.equal('^8.1');
        });

        it('should extract PHP version from platform config', () => {
            const composerConfig: ComposerConfig = { 
                config: { 
                    platform: { php: '8.2' } 
                } 
            };
            const result = extractPhpVersionConstraint(composerConfig);
            expect(result).to.equal('8.2');
        });

        it('should prioritize platform over require', () => {
            const composerConfig: ComposerConfig = { 
                require: { php: '^8.1' },
                config: { 
                    platform: { php: '8.2' } 
                } 
            };
            const result = extractPhpVersionConstraint(composerConfig);
            expect(result).to.equal('8.2');
        });

        it('should return undefined for missing PHP requirement', () => {
            const composerConfig: ComposerConfig = { 
                require: { 'some/package': '^1.0' } 
            };
            const result = extractPhpVersionConstraint(composerConfig);
            expect(result).to.be.undefined;
        });

        it('should return undefined for undefined config', () => {
            const result = extractPhpVersionConstraint(undefined);
            expect(result).to.be.undefined;
        });
    });

    describe('derivePhpVersionFromConstraint', () => {
        it('should derive version from caret constraint', () => {
            const result = derivePhpVersionFromConstraint('^8.1');
            expect(result).to.equal('8.1.0');
        });

        it('should derive version from tilde constraint', () => {
            const result = derivePhpVersionFromConstraint('~8.1.0');
            expect(result).to.equal('8.1.0');
        });

        it('should derive version from greater than constraint', () => {
            const result = derivePhpVersionFromConstraint('>=8.0');
            expect(result).to.equal('8.0.0');
        });

        it('should derive version from exact version', () => {
            const result = derivePhpVersionFromConstraint('8.2.0');
            expect(result).to.equal('8.2.0');
        });

        it('should handle complex constraints', () => {
            const result = derivePhpVersionFromConstraint('>=8.0 <9.0');
            expect(result).to.equal('9.0.0'); // Function returns the higher bound
        });

        it('should return undefined for invalid constraint', () => {
            const result = derivePhpVersionFromConstraint('invalid');
            expect(result).to.be.undefined;
        });

        it('should return undefined for empty constraint', () => {
            const result = derivePhpVersionFromConstraint('');
            expect(result).to.be.undefined;
        });
    });

    describe('getPhpVersionForTemplate', () => {
        it('should return PHP version from workspace path', () => {
            const result = getPhpVersionForTemplate('/test/workspace');
            expect(result).to.be.a('string');
            expect(result.length).to.be.greaterThan(0);
        });

        it('should return default version when no composer found', () => {
            const result = getPhpVersionForTemplate('/nonexistent/path');
            expect(result).to.equal('8.4.0'); // Default version
        });

        it('should use custom default version', () => {
            const result = getPhpVersionForTemplate('/nonexistent/path', '8.1.0');
            expect(result).to.equal('8.1.0');
        });
    });
});
