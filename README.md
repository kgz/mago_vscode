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

### Known issues / CLI caveats

- `--fix` cannot be combined with `--reporting-format json` (Mago exits with code 2 and prints: `the argument '--reporting-format <REPORTING_FORMAT>' cannot be used with '--fix'`).
  - Workaround: when running fixes, omit reporting-format (use Mago defaults) or run a separate non-fix pass for JSON diagnostics.
  - In this extension, prefer non-fix analysis for diagnostics; add a separate “Fix” command that does not request JSON output.

### Roadmap / Next

- Warn on load when no `mago.toml` is present (explain default vendor reporting behavior and how to configure)
- Warn on load if `vendor/` is not excluded in `analyzer.excludes` in `mago.toml`
- Add “Format File with Mago” and “Format Workspace with Mago” commands
- Code action: open rule documentation from code
- Multi-root workspaces: prefer nearest `vendor/bin/mago` and `mago.toml`
- CI and tests (unit + integration)

