// Export all types and interfaces
export * from './types';

// Export composer parsing functions
export { 
    parseComposerConfig,
    extractProjectName,
    extractPhpVersionConstraint,
    derivePhpVersionFromConstraint,
    getPhpVersionForTemplate
} from './composerParser';

// Export template generation functions
export { 
    generateTomlHeader,
    generateMagoTomlTemplate,
    generateCompleteTomlContent
} from './templateGenerator';

// Export file operations functions
export { 
    checkTomlExists,
    createTomlFile,
    showTomlCreationError,
    showTomlAlreadyExistsMessage
} from './fileOperations';

// Export the main template manager
export { 
    MagoTemplateManager,
    magoTemplateManager
} from './templateManager';
