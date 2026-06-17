# Slice 05: Scene Path Loading And Public Control Surface

## Status

Completed

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 04: Visual Stage Runtime Core

## Purpose

Expose the scene-oriented runtime through the public JavaScript API and RPG Maker MV plugin commands, add path-based **R3D Scene File** loading, and explicitly remove the old `character` API and `R3DStage Character ...` command surface.

## Result

- Added path-based **R3D Scene File** loading through an MV-compatible `XMLHttpRequest` text loader.
- Scene file loading uses strict `JSON.parse`, runtime validation, and handled diagnostics before delegating to the runtime.
- Added path normalization and rejection for empty, absolute, drive-letter, URL, protocol-relative, and parent-directory traversal paths.
- Exposed `window.R3DVisualStage.scene` with `load`, `loadDefinition`, `show`, `hide`, `setCamera`, and `play`.
- Exposed `window.R3DVisualStage.dispose()` for terminal runtime disposal.
- Routed `R3DStage Scene Load`, `Show`, `Hide`, `Camera`, and `Play` commands.
- Removed the old public `character` API, old `R3DStage Character ...` command surface, and hidden MV `ok` input demo behavior.
- Tests cover public API exposure, command routing, path loading, validation failures, and scene update integration.

## Scope

### In

- Add path-based **R3D Scene File** loading using an MV-compatible `XMLHttpRequest` text loader.
- Parse strict JSON with native `JSON.parse`.
- Validate loaded scene definitions before active mutation.
- Expose `window.R3DVisualStage.scene`.
- Route MV commands through `R3DStage Scene ...`.
- Auto-load `Default Scene Path` through the scene runtime when configured.
- Remove public `window.R3DVisualStage.character`.
- Remove `R3DStage Character ...` command routing.
- Remove the hidden MV `ok` input demo behavior.

### Out

- No plugin header/parameter text migration unless needed for compilation.
- No local MV copy/enable script migration.
- No documentation migration.
- No compatibility wrapper for old `character` API or commands.
- No inline JSON plugin command support.

## Design References

- Requirements: REQ-01, REQ-02, REQ-03
- Decisions: JS API supports path and in-memory definition; MV plugin command supports path only; XHR scene text loader; strict JSON; scene file load/parse/validation diagnostics; default `r3d/` resource namespace; normalized project-root-relative paths with backslash normalization; path validation rejects empty, absolute, drive-letter, URL, protocol-relative, and parent-directory traversal; `show`, `hide`, `setCamera`, `play`; old `Character` API and commands are explicitly deleted; command animation playback requires `modelId + clipName`
- Invariants: MV plugin command failures must log diagnostics without stopping MV game loop; runtime compatibility installs before Three.js loading paths need it; failed load preserves active scene; failed/stale load never changes visibility
- Completion Contract: OT-01, OT-02, OT-03, OT-04, OUT-01, OUT-02
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/mvPlugin.ts`, `../../../../src/mvTypes.ts`, `../../../../src/main.ts`, `../../../../references/corescript/js/rpg_managers/DataManager.js`

## Code Context

`src/mvPlugin.ts` currently creates `CharacterDisplay`, exposes `window.R3DVisualStage.character`, routes only the `character` command domain, and reacts to MV `ok` input by playing `Wave`. `src/mvTypes.ts` defines only `R3DVisualStageCharacterApi`. RPG Maker MV's `DataManager.loadDataFile` uses `XMLHttpRequest`, `overrideMimeType('application/json')`, and `JSON.parse(xhr.responseText)`.

## What To Build

Refactor plugin installation around the scene runtime. The target API is:

```ts
window.R3DVisualStage.scene.load(path: string): Promise<boolean>;
window.R3DVisualStage.scene.loadDefinition(definition: unknown): Promise<boolean>;
window.R3DVisualStage.scene.show(): void;
window.R3DVisualStage.scene.hide(): void;
window.R3DVisualStage.scene.setCamera(cameraId: string): boolean;
window.R3DVisualStage.scene.play(modelId: string, clipName: string): boolean;
window.R3DVisualStage.dispose(): void;
```

MV commands:

```text
R3DStage Scene Load r3d/scenes/r3d-validation-scene.r3dscene.json
R3DStage Scene Show
R3DStage Scene Hide
R3DStage Scene Camera portrait
R3DStage Scene Play character Wave
```

Path loading must normalize backslashes to forward slashes, reject unsafe paths, load JSON text with XHR, parse strict JSON, validate it, and delegate to the runtime. Handled path validation, load, parse, validation, or asset failures should resolve `false` and log diagnostics.

## Acceptance Criteria

- [x] `window.R3DVisualStage.scene` exists with `load`, `loadDefinition`, `show`, `hide`, `setCamera`, and `play`.
- [x] `window.R3DVisualStage.dispose()` delegates to terminal runtime disposal.
- [x] `window.R3DVisualStage.character` is not exposed.
- [x] `R3DStage Scene Load <path>` loads a scene path.
- [x] `R3DStage Scene Show` shows the Visual Stage.
- [x] `R3DStage Scene Hide` hides the Visual Stage.
- [x] `R3DStage Scene Camera <cameraId>` switches the active **Presentation Camera**.
- [x] `R3DStage Scene Play <modelId> <clipName>` plays a model animation.
- [x] `R3DStage Character ...` is not routed as a supported command.
- [x] `load(path)` uses an MV-compatible `XMLHttpRequest` text loader, not `fetch`.
- [x] `load(path)` normalizes backslashes and rejects empty paths, absolute paths, drive-letter paths, `file://` URLs, remote URLs, protocol-relative URLs, and parent-directory traversal.
- [x] Scene file load failure, JSON parse failure, validation failure, and asset-load failure are logged distinctly.
- [x] Auto-load uses scene config and calls scene path loading.
- [x] MV `ok` input demo behavior is removed.
- [x] Handled load failures log errors and preserve active scene, active camera, and visibility.
- [x] Concurrent load calls cannot let an older pending load replace a newer successful scene.
- [x] Type declarations reflect the scene API and no longer expose the old character API.

## Implementation Notes

Plugin command routing should continue to call the original MV `pluginCommand` before handling `R3DStage`, matching current behavior.

Keep inline JSON out of plugin commands. Long-form scene authoring belongs in `.r3dscene.json` files.

## Suggested Task Plan

1. Add or update API and command routing tests if feasible.
2. Implement XHR scene text loading and path load diagnostics.
3. Refactor plugin installation to expose scene API and commands.
4. Remove character public API, command route, and `ok` demo behavior.
5. Run focused verification.

## Verification Commands

```bash
npm run test
npm run check
npm run lint
npm run build
```

## Verification Result

Passed:

- `npm run test`
- `npm run check`
- `npm run lint`
- `npm run build`

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
