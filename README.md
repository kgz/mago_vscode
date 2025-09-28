# Mago (Unofficial) - VS Code Extension

> **Unofficial VS Code extension for Mago PHP analyzer** - Get instant code analysis, quick fixes, and intelligent diagnostics directly in your editor.

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/kgz/mago_vscode/HEAD/package.json&query=version&label=version&color=blue)](https://marketplace.visualstudio.com/items?itemName=kgz.mago-unofficial)
[![Downloads](https://img.shields.io/vscode-marketplace/d/kgz.mago-unofficial.svg)](https://marketplace.visualstudio.com/items?itemName=kgz.mago-unofficial)

## 🚀 Features

### ⚡ **Real-time Analysis**
- **Workspace-wide analysis** on startup, save, or as you type
- **Instant diagnostics** with precise error highlighting
- **Auto-discovery** of Mago binary from Composer
- **Performance optimized** with smart re-analysis

### 🔧 **Smart Quick Fixes**
- **One-click fixes** for common issues
- **Safety gating** for potentially unsafe suggestions
- **Configurable safety levels** (Safe, Potentially Unsafe, Unsafe)
- **Intelligent code suggestions** from Mago

### 🎯 **Issue Suppression**
- **Line-level suppression** with `@mago-expect` and `@mago-ignore`
- **Block-level suppression** for code blocks
- **Workspace-wide suppression** via `mago.toml`
- **Configurable visibility** for each suppression type

## 🛠️ Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Mago: Analyze Workspace` | Run analysis on entire workspace | - |
| `Mago: Analyze Current File` | Run analysis on current file | - |

## ⚙️ Configuration

### Core Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `mago.path` | Path to Mago binary (blank = auto-detect) | `""` |
| `mago.runOn` | When to run analysis | `save` |
| `mago.debounceMs` | Debounce delay for on-type analysis | `400` |
| `mago.minimumFailLevel` | Minimum issue level to show | `error` |

### Analysis Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `mago.analysis.apply.allowUnsafe` | Allow unsafe suggestions | `false` |
| `mago.analysis.apply.allowPotentiallyUnsafe` | Allow potentially unsafe suggestions | `false` |

### Suppression Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `mago.analysis.suppress.showLineExpect` | Show line-level expect actions | `true` |
| `mago.analysis.suppress.showLineIgnore` | Show line-level ignore actions | `true` |
| `mago.analysis.suppress.showBlockIgnore` | Show block-level ignore actions | `true` |
| `mago.analysis.suppress.showBlockExpect` | Show block-level expect actions | `true` |
| `mago.analysis.suppress.showWorkspaceIgnore` | Show workspace ignore actions | `true` |

## 📋 Requirements

- **Mago CLI** installed and available
- **PHP project** with Composer (recommended)
- **VS Code** 1.103.0 or higher

## 🚀 Quick Start

1. **Install the extension** from the VS Code Marketplace
2. **Ensure Mago is installed** in your project:
   ```bash
   composer require --dev mago/mago
   ```
3. **Create a `mago.toml`** file in your project root (extension will help you create one)
   - Use the provided [schema](mago.toml.schema.json) for IntelliSense and validation
   - See [mago.toml.example](mago.toml.example) for a complete configuration example
4. **Start coding!** The extension will automatically analyze your PHP files

## 📁 Project Structure

```
your-project/
├── mago.toml              # Mago configuration
├── mago.toml.schema.json  # JSON schema for IntelliSense (optional)
├── vendor/
│   └── bin/
│       └── mago           # Mago binary (auto-detected)
└── src/
    └── your-php-files.php
```

## 📋 Configuration Schema

The extension includes a comprehensive JSON schema for `mago.toml` files that matches the official Mago configuration format:

- **IntelliSense support** - Auto-completion and validation in VS Code
- **Type checking** - Validates PHP versions, paths, and configuration options
- **Documentation** - Inline help for all configuration options
- **Examples** - Real-world configuration examples

### Configuration Structure:
```toml
# Global Options
php-version = "8.4"
threads = 8
stack-size = 8388608

[source]
paths = ["src", "tests"]
excludes = ["vendor/", "cache/"]
extensions = ["php", "php8"]

[linter]
# Linter-specific options

[formatter] 
# Formatter-specific options

[analyzer]
# Analyzer-specific options
```

To use the schema, add this to your `mago.toml` file:
```toml
# @schema https://raw.githubusercontent.com/kgz/mago_vscode/main/mago.toml.schema.json
```

## 🔍 How It Works

1. **Analysis Trigger**: Extension runs Mago analysis based on your `mago.runOn` setting
2. **Issue Detection**: Mago scans your PHP code for issues and violations
3. **Diagnostic Display**: Issues appear as squiggles in the editor and in the Problems panel
4. **Quick Fixes**: Click the lightbulb icon to apply suggested fixes
5. **Suppression**: Use code actions to suppress specific issues

## 🎛️ Analysis Modes

- **On Save** (default): Analyzes when you save files
- **On Type**: Analyzes as you type (with debouncing)
- **Manual**: Only analyzes when you run commands

## 🛡️ Safety Features

- **Vendor Filtering**: Third-party code is analyzed but not shown in Problems
- **Safety Gating**: Unsafe suggestions are disabled by default
- **Configurable Levels**: Choose which safety levels to allow

## 🐛 Troubleshooting

### Common Issues

**Extension not working?**
- Check if Mago is installed: `composer show mago/mago`
- Verify `mago.toml` exists in project root
- Check the Output panel for error messages

**Analysis not running?**
- Ensure `mago.runOn` is set correctly
- Check if Mago binary path is correct
- Try running "Mago: Analyze Workspace" manually

**Too many issues?**
- Adjust `mago.minimumFailLevel` setting
- Use suppression actions to hide specific issues
- Configure `mago.toml` to exclude directories

## 📚 Learn More

- [Mago Documentation](https://github.com/mago/mago) - Official Mago analyzer docs
- [VS Code Extension API](https://code.visualstudio.com/api) - VS Code extension development
- [PHP Best Practices](https://www.php.net/manual/en/) - PHP coding standards

## 🤝 Contributing

This is an unofficial extension. For issues and feature requests, please visit the [GitHub repository](https://github.com/kgz/mago_vscode).

## 📄 License

This extension is licensed under the **MIT License**. The Mago PHP analyzer is also licensed under the MIT License.

See [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the PHP community**

