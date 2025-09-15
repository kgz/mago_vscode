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
- Mago: Analyze Current File (`mago.analyzeFile`)

### Default Behavior

- On startup: runs workspace analysis once VS Code finishes loading (skipped when `mago.runOn` = `manual`)
- On save (default): runs workspace analysis; can switch to on type or manual
- Vendor reporting: diagnostics from `vendor/` and `vendor-bin/` are hidden from Problems by default (unless configured later via `mago.toml`); vendor is still analyzed internally for resolution
- If `mago.toml` exists at the workspace root, we let Mago discover paths (we don’t pass the workspace path to the CLI); otherwise we pass the workspace folder path

### Settings

- `mago.path`: absolute path to the Mago binary (optional)
- `mago.runOn`: `save` | `type` | `manual` (default: `save`)
- `mago.debounceMs`: debounce for on-type (default: 400)
- `mago.minimumFailLevel`: `note` | `help` | `warning` | `error` (default: `error`)
- `mago.fix.*`: flags for running with `--fix` (when executing analyzer directly)

### Debug settings

- `mago.debug.dryRun`: log the analyzer command instead of executing it (default: true)

### Requirements

- Mago CLI installed, or available at `vendor/bin/mago` in the workspace

### Notes

- Quick Fix currently applies suggestion insert operations only. More operation kinds can be added.
- Diagnostics show source `mago` and code from Mago (e.g., `missing-override-attribute`).

### Known issues / CLI caveats

- Fix mode omits JSON reporting and skips diagnostics parsing; use non-fix runs for diagnostics.

### Pre-run checks

- Requires `mago.toml` in the workspace root. If absent, the extension prompts to run `mago init`.
- Warns if `vendor/` exists but is not excluded in `mago.toml`.

### Roadmap / Next

- Warn on load when no `mago.toml` is present (explain default vendor reporting behavior and how to configure)
- Warn on load if `vendor/` is not excluded in `analyzer.excludes` in `mago.toml`
- Add “Format File with Mago” and “Format Workspace with Mago” commands
- Code action: open rule documentation from code
- Multi-root workspaces: prefer nearest `vendor/bin/mago` and `mago.toml`
- CI and tests (unit + integration)

