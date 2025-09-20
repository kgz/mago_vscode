# Change Log

All notable changes to the "Mago (Unofficial)" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2024-12-20

### Added
- **Extension Rebranding**: Renamed from "mago problems" to "Mago (Unofficial)" for better clarity
- **Custom Logo**: Added professional 128x128 PNG logo with "MAGO" branding
- **Analysis Settings Organization**: Grouped all analysis-related settings under `mago.analysis.*` namespace
- **Suppress Command Settings**: Added 5 new configurable settings to show/hide ignore commands:
  - `mago.analysis.suppress.showLineExpect` - Show 'Suppress with @mago-expect (next line)' action
  - `mago.analysis.suppress.showLineIgnore` - Show 'Suppress with @mago-ignore (next line)' action
  - `mago.analysis.suppress.showBlockIgnore` - Show 'Suppress block with @mago-ignore' action
  - `mago.analysis.suppress.showBlockExpect` - Show 'Expect issue for block with @mago-expect' action
  - `mago.analysis.suppress.showWorkspaceIgnore` - Show 'Ignore in workspace (mago.toml)' action
- **Repository Field**: Added repository information to package.json
- **VS Code Ignore File**: Added .vscodeignore to exclude unnecessary files from packaging

### Changed
- **Settings Structure**: Reorganized settings for better user experience and future extensibility
- **Version Number**: Bumped to 0.1.0 to reflect significant changes
- **Package Name**: Changed from `mago-problems` to `mago-unofficial`

### Fixed
- **Publishing Issues**: Resolved secretlint scanning problems that were blocking publication
- **Settings UI**: All settings now display properly in VS Code settings interface

## [0.0.2] - 2024-12-19

### Added
- Initial release with basic Mago PHP analyzer integration
- Code action suggestions from Mago
- Workspace and file-level analysis
- Basic suppression commands

## [Unreleased]

- Future linting and formatting features planned