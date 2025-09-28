// Export all types and interfaces
export * from './types';

// Export configuration reading functions
export { readMagoConfiguration, getMagoSetting } from './configReader';

// Export Mago binary resolution functions
export { 
    resolveMagoBinaryPath, 
    validateMagoBinary, 
    getMagoBinaryDirectory 
} from './magoBinaryResolver';

// Export configuration validation functions
export { 
    validateMagoConfiguration, 
    describeConfiguration,
    type ConfigValidationResult 
} from './configValidator';

// Export the main configuration manager
export { 
    MagoConfigManager, 
    magoConfigManager,
    getConfig,
    resolveMagoBinary 
} from './configManager';
