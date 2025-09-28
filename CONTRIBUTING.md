# Contributing to Mago (Unofficial)

Hey! Thanks for wanting to help out with this little VS Code extension. It's just a side project to make PHP development a bit nicer, so don't worry about being super formal.

## Getting Started

You'll need:
- Node.js (v18+)
- pnpm 
- VS Code
- Mago CLI installed somewhere

To get it running:

1. Fork and clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mago_vscode.git
   cd mago_vscode
   ```

2. Install stuff:
   ```bash
   pnpm install
   ```

3. Build it:
   ```bash
   pnpm run compile
   ```

4. Test it:
   ```bash
   pnpm test
   ```

## Development Workflow

The code is organized into focused modules:

```
src/
├── extension.ts          # Main entry point (re-exports from extension/)
├── extension/            # Extension lifecycle and coordination
│   ├── extensionManager.ts    # Main extension coordinator
│   ├── commandRegistry.ts      # VS Code command registration
│   ├── eventHandlers.ts        # File save/change event handling
│   ├── statusBarManager.ts     # Status bar item management
│   └── workspaceAnalysisManager.ts # Single-flight analysis management
├── config/               # Configuration management
│   ├── configManager.ts        # Main config coordinator
│   ├── configReader.ts         # VS Code settings reading
│   ├── magoBinaryResolver.ts   # Mago binary path resolution
│   └── configValidator.ts      # Configuration validation
├── diagnostics/          # Diagnostic management
│   ├── diagnosticsManager.ts   # Main diagnostics coordinator
│   ├── diagnosticConverter.ts   # Mago issue to VS Code diagnostic conversion
│   ├── diagnosticPublisher.ts  # Publishing diagnostics to VS Code
│   ├── jsonParser.ts           # Mago JSON output parsing
│   └── fileFilter.ts           # File filtering utilities
├── codeActions/          # Code action management
│   ├── codeActionProvider.ts   # Main code action provider
│   ├── suggestionActions.ts    # Code suggestion handling
│   ├── suppressionActions.ts  # Issue suppression actions
│   ├── workspaceActions.ts     # Workspace-level actions
│   └── diagnosticUtils.ts      # Diagnostic utility functions
├── template/             # Template management
│   ├── templateManager.ts      # Main template coordinator
│   ├── composerParser.ts       # Composer.json parsing
│   ├── templateGenerator.ts    # Mago.toml template generation
│   └── fileOperations.ts        # File creation utilities
├── magoCli.ts           # Mago CLI integration
└── initTemplate.ts      # Backward compatibility (re-exports from template/)
```

Handy commands:
- `pnpm run compile` - Build it
- `pnpm run watch` - Watch for changes
- `pnpm run test` - Run tests
- `pnpm run lint` - Check code style
- `pnpm run package` - Make a VSIX

To test your changes:
1. Open this project in VS Code
2. Hit F5 to open a new window
3. Test your stuff in that window
4. Check the Output panel if things break

## Making Changes

### Code Style

The project follows these patterns:
- **Modular Design**: Each folder has a single responsibility
- **Singleton Pattern**: Managers use singleton instances for easy access
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Error Handling**: Graceful error handling with user-friendly messages
- **Resource Management**: Proper disposal of VS Code resources

Run `pnpm run lint` to check code style. The project uses ESLint with TypeScript rules.

### Development Patterns

- **Manager Classes**: Each module has a main manager class that coordinates functionality
- **Utility Functions**: Pure functions for specific tasks (parsing, conversion, etc.)
- **Type Definitions**: All interfaces and types are documented with JSDoc
- **Backward Compatibility**: Old APIs are maintained through re-exports
- **Comprehensive Logging**: Debug information goes to VS Code output channels

### Testing Guidelines

When testing:
- Try it with some real PHP projects that use Mago
- Test different configuration settings
- Verify error handling when things go wrong
- Check that diagnostics appear correctly
- Test code actions (quick fixes, suppressions)
- Verify template generation works with different composer.json files

### Commit Messages

Use conventional commit format:
```
feat: add custom mago binary path support
fix: workspace analysis timing issue
docs: update README config options
refactor: split diagnostics into modular structure
test: add unit tests for config validation
```

## Reporting Issues

Before you report something:
- Check if someone else already reported it
- Make sure you're using the latest version
- Try running Mago CLI directly to see if it works
- Check the VS Code Output panel for errors

When reporting, it helps to include:
- VS Code version
- Extension version  
- Mago version (`mago --version`)
- PHP version
- What OS you're on
- Steps to reproduce the problem
- What you expected vs what actually happened

## Feature Requests

If you want something added:
- Check if it's already been asked for
- Think about whether it makes sense for this extension
- Consider how much work it would be

Just describe what you want and why it would be useful. If you have ideas about how to implement it, that's cool too.

## Pull Requests

Before you submit:
- Make a branch from the latest main branch
- Write some tests if you're adding new stuff
- Update docs if needed
- Make sure tests pass
- Test it manually in VS Code

Keep PRs simple - one feature or fix per PR. Write a clear description of what you changed and why. If you changed the UI, screenshots are helpful.

I'll review it and test it out. The automated checks need to pass (linting, tests) and then I'll give it a look.

## How It Works

The extension follows a modular architecture:

1. **Extension Lifecycle**: The `extensionManager` coordinates all components during activation/deactivation
2. **Configuration**: The `configManager` handles VS Code settings and Mago binary resolution
3. **Analysis**: The `workspaceAnalysisManager` runs Mago CLI with single-flight pattern
4. **Diagnostics**: The `diagnosticsManager` converts Mago output to VS Code diagnostics
5. **Code Actions**: The `codeActionProvider` offers quick fixes and suppressions
6. **Templates**: The `templateManager` creates mago.toml from composer.json

### Key Components:

- **Extension Manager**: Coordinates activation, deactivation, and component lifecycle
- **Command Registry**: Registers VS Code commands with proper error handling
- **Event Handlers**: Manages file save/change events with debouncing
- **Status Bar Manager**: Handles status bar item creation and updates
- **Workspace Analysis Manager**: Prevents concurrent analysis runs
- **Config Manager**: Reads settings, validates configuration, resolves Mago binary
- **Diagnostics Manager**: Parses JSON, converts issues, publishes diagnostics
- **Code Action Provider**: Creates suggestions and suppression actions
- **Template Manager**: Generates mago.toml with project-specific settings

### Data Flow:

1. User triggers analysis (save, type, command)
2. `workspaceAnalysisManager` ensures single-flight execution
3. `magoCli` runs Mago with resolved binary path
4. `diagnosticsManager` parses JSON output and converts to VS Code diagnostics
5. `codeActionProvider` creates quick fixes and suppression actions
6. VS Code displays diagnostics and code actions to user

## Recent Improvements

The codebase has been refactored into a modular architecture with these improvements:

### Enhanced Features
- **Single-Flight Analysis**: Prevents multiple concurrent workspace analyses
- **Comprehensive Error Handling**: Better error reporting and user feedback
- **Type Safety**: Full TypeScript interfaces for all data structures
- **Resource Management**: Proper cleanup of VS Code resources
- **Configuration Validation**: Validates settings and provides helpful error messages
- **Enhanced Template Generation**: Smart detection of PHP version from composer.json

### Code Quality
- **Modular Design**: Clear separation of concerns with focused modules
- **Singleton Pattern**: Easy access to managers throughout the extension
- **Comprehensive Documentation**: JSDoc comments for all public APIs
- **Backward Compatibility**: Existing APIs maintained through re-exports
- **Consistent Error Handling**: Graceful fallbacks and user-friendly messages

### Developer Experience
- **Easy Testing**: Individual components can be tested in isolation
- **Clear Interfaces**: Well-defined boundaries between modules
- **Extensible Design**: Easy to add new features without breaking existing code
- **Comprehensive Logging**: Debug information in VS Code output channels

## Useful Links

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Mago Documentation](https://github.com/mago/mago)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)

## Be Nice

Just be respectful and helpful. Ask questions if you're stuck.

## License

Your contributions will be under the same MIT License as the rest of the project.

---

Thanks for helping make PHP development a bit nicer! 🚀
