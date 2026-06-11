# Slice 04: Scene Path Loading And Public Control Surface

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 03: Visual Stage Runtime Core

## Purpose

Expose the scene-oriented runtime through the public JavaScript API and RPG Maker MV plugin commands, while explicitly removing the old `character` API and `R3DStage Character ...` command surface.

## Scope

### In

- Add path-based **R3D Scene File** loading.
- Expose `window.R3DVisualStage.scene`.
- Route MV commands through `R3DStage Scene ...`.
- Auto-load `Default Scene Path` through the scene runtime when configured.
- Remove public `window.R3DVisualStage.character`.
- Remove `R3DStage Character ...` command routing.
- Guard concurrent loads so stale slow loads cannot replace newer loads.

### Out

- No plugin header/parameter text migration unless needed for compilation.
- No local MV copy/enable script migration.
- No documentation migration.
- No compatibility wrapper for old `character` API or commands.

## Design References

- Requirements: REQ-01, REQ-02, REQ-03
- Decisions: JS API supports object and path; MV plugin command supports path only; old `Character` API and commands are explicitly deleted; command animation playback requires `modelId + clipName`
- Invariants: MV plugin command failures must log diagnostics without stopping MV game loop; runtime compatibility installs before Three.js loading paths need it; failed load preserves active scene
- Completion Contract: OT-01, OT-02, OT-03, OUT-01, OUT-02
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/mvPlugin.ts`, `../../../../src/mvTypes.ts`, `../../../../src/main.ts`

## Code Context

`src/mvPlugin.ts` currently creates `CharacterDisplay`, exposes `window.R3DVisualStage.character`, routes only the `character` command domain, and reacts to MV `ok` input by playing `Wave`. `src/mvTypes.ts` defines only `R3DVisualStageCharacterApi`.

## What To Build

Refactor plugin installation around the scene runtime. The target API is:

```ts
window.R3DVisualStage.scene.load(path: string): Promise<boolean>;
window.R3DVisualStage.scene.loadDefinition(definition: unknown): Promise<boolean>;
window.R3DVisualStage.scene.hide(): void;
window.R3DVisualStage.scene.play(modelId: string, clipName: string): boolean;
window.R3DVisualStage.dispose(): void;
```

MV commands:

```text
R3DStage Scene Load scenes/r3d-validation-scene.r3dscene.json
R3DStage Scene Hide
R3DStage Scene Play character Wave
```

Path loading must fetch JSON, parse it, validate it, and delegate to the runtime. Handled validation or load failures should resolve `false` and log diagnostics.

## Acceptance Criteria

- [ ] `window.R3DVisualStage.scene` exists with `load`, `loadDefinition`, `hide`, and `play`.
- [ ] `window.R3DVisualStage.character` is not exposed.
- [ ] `R3DStage Scene Load <path>` loads a scene path.
- [ ] `R3DStage Scene Hide` hides the Visual Stage.
- [ ] `R3DStage Scene Play <modelId> <clipName>` plays a model animation.
- [ ] `R3DStage Character ...` is not routed as a supported command.
- [ ] Auto-load uses scene config and calls scene path loading.
- [ ] MV `ok` input demo behavior is removed unless explicitly documented as scene behavior.
- [ ] Handled load failures log errors and preserve the active scene.
- [ ] Concurrent load calls cannot let an older pending load replace a newer successful scene.
- [ ] Type declarations reflect the scene API and no longer expose the old character API.

## Implementation Notes

Use `fetch` for `.r3dscene.json` path loading unless current MV target constraints force a Three.js loader path. If using `fetch`, keep errors explicit for HTTP failure, invalid JSON, and validation failure.

Plugin command routing should continue to call the original MV `pluginCommand` before handling `R3DStage`, matching current behavior.

## Suggested Task Plan

1. Add or update tests.
2. Implement the smallest production change.
3. Run focused verification.
4. Update docs if required.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run test
npm run check
npm run lint
npm run build
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
