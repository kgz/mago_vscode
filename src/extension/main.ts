// Export all types and interfaces
export * from './types';

// Export workspace analysis management
export { 
    WorkspaceAnalysisManager,
    workspaceAnalysisManager
} from './workspaceAnalysisManager';

// Export command registry
export { 
    MagoCommandRegistry,
    magoCommandRegistry
} from './commandRegistry';

// Export event handlers
export { 
    MagoEventHandlers,
    magoEventHandlers
} from './eventHandlers';

// Export status bar management
export { 
    MagoStatusBarManager,
    magoStatusBarManager
} from './statusBarManager';

// Export main extension manager
export { 
    MagoExtensionManager,
    magoExtensionManager
} from './extensionManager';

// Export main activation functions
export { activate, deactivate } from './index';
