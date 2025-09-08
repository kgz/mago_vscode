## Mago for VS Code (Preview)

An extension that surfaces diagnostics from Mago (PHP analyzer) directly in VS Code with fast, workspace-wide analysis and inline quick fixes.

### Features

- Workspace-wide analysis on startup, on save, or on type (configurable)
- Vendor diagnostics filtered by default (still analyzed for symbol resolution)
- Auto-discovery of `vendor/bin/mago`; optional explicit `mago.path`
- Precise squiggles using byte-offset spans from Mago JSON
- Quick Fixes for Mago suggestions (insert operations) with safety gating
- Status bar indicator and detailed Output channel logs
- Performance diagnostics (elapsed ms, issue count)
- Aggressive re-run: cancels in-flight analysis on new saves/changes

### Commands

- Mago: Analyze Workspace (`mago.analyzeWorkspace`)
- Mago: Analyze Current File (`mago.analyzeFile`) [internally triggers workspace analysis]

### Default Behavior

- On startup: runs workspace analysis once VS Code finishes loading
- On save (default): runs workspace analysis; can switch to on type or manual
- Vendor reporting: diagnostics from `vendor/` and `vendor-bin/` are hidden from Problems by default (unless configured later via `mago.toml`); vendor is still analyzed internally for resolution
- If `mago.toml` exists at the workspace root, we let Mago discover paths (we don’t pass the workspace path to the CLI); otherwise we pass the workspace folder path

### Settings (partial)

- `mago.path`: absolute path to the Mago binary (optional)
- `mago.runOn`: `save` | `type` | `manual` (default: `save`)
- `mago.debounceMs`: debounce for on-type (default: 400)
- `mago.reporting.format`: Mago reporting format (default: `json`)
- `mago.reporting.target`: `stdout` | `stderr` (default: `stdout`)
- `mago.minimumFailLevel`: `note` | `help` | `warning` | `error` (default: `error`)
- `mago.fix.*`: flags for running with `--fix` (when executing analyzer directly)

### Requirements

- Mago CLI installed, or available at `vendor/bin/mago` in the workspace

### Notes

- Quick Fix currently applies suggestion insert operations only. More operation kinds can be added.
- Diagnostics show source `mago` and code from Mago (e.g., `missing-override-attribute`).

### Roadmap / Next

- Warn on load when no `mago.toml` is present (explain default vendor reporting behavior and how to configure)
- Warn on load if `vendor/` is not excluded in `analyzer.excludes` in `mago.toml`
- Add “Format File with Mago” and “Format Workspace with Mago” commands
- Code action: open rule documentation from code
- Multi-root workspaces: prefer nearest `vendor/bin/mago` and `mago.toml`
- CI and tests (unit + integration)

# mago-problems README

This is the README for your extension "mago-problems". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
