# Slice 06: Plugin Parameters And MV Host Integration

## Status

Ready

## Type

migration

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 02: Validation Scene Asset Flow
- Slice 05: Scene Path Loading And Public Control Surface

## Purpose

Migrate plugin parameters, plugin help text, and local MV host scripts from character-display defaults to scene-oriented defaults.

## Scope

### In

- Replace character-specific plugin parameters with scene-oriented parameters.
- Update config parsing and defaults.
- Update `src/mv-plugin-header.js`.
- Update local MV copy/enable scripts to install the generated scene JSON.
- Update package formatting paths if documentation files change as part of this migration.

### Out

- No runtime core redesign beyond what is needed to consume scene config.
- No preservation of old character parameter names as compatibility aliases.
- No external issue publication.
- No fullscreen layout support.
- No change to the default `r3d/` namespace decision.

## Design References

- Requirements: REQ-03, REQ-04, REQ-08
- Decisions: `Default Scene Path`; `Auto Show Scene`; `Stage Placement = right`; `Stage Width = 280`; default **R3D Scene File** namespace is `r3d/` with `r3d/scenes/` and `r3d/models/`; old Character API/commands/parameters are explicitly removed
- Invariants: default validation flow is local-only; Vite target remains MV-compatible; Visual Stage must not block pointer input
- Completion Contract: OT-01, DOC-02, DOC-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/config.ts`, `../../../../src/mv-plugin-header.js`, `../../../../scripts/copy-to-mv-host.mjs`, `../../../../scripts/enable-mv-test-host.mjs`, `../../../../package.json`

## Code Context

`src/config.ts` currently defines `CharacterDisplayConfig` with `defaultCharacterPath`, `autoShowCharacter`, and `characterDisplayWidth`. `src/mv-plugin-header.js` documents `Default Character Path`, `Auto Show Character`, `Character Display Width`, and `R3DStage Character ...`. `scripts/copy-to-mv-host.mjs` and `scripts/enable-mv-test-host.mjs` copy only the plugin, source map, and GLB model.

## What To Build

Replace config and plugin metadata with scene-oriented names:

- `Default Scene Path`, default `r3d/scenes/r3d-validation-scene.r3dscene.json`
- `Auto Show Scene`, default `true`
- `Stage Placement`, default `right`
- `Stage Width`, default `280`
- existing target FPS, max pixel ratio, and logging params remain

Update scripts so the generated scene JSON and validation model are copied to:

```text
<MV project>/r3d/scenes/r3d-validation-scene.r3dscene.json
<MV project>/r3d/models/r3d-validation-character.glb
```

and `enable:mv-test-host` writes the new parameters to `js/plugins.js`.

## Acceptance Criteria

- [ ] Config type and parser use scene-oriented names.
- [ ] Old character parameter names are not preserved as compatibility aliases.
- [ ] Plugin header documents scene-oriented parameters and Scene commands only.
- [ ] `Default Scene Path` default is `r3d/scenes/r3d-validation-scene.r3dscene.json`.
- [ ] `Stage Placement` accepts only `right` or falls back to `right` with diagnostics.
- [ ] Copy script installs the generated scene JSON into `<MV project>/r3d/scenes/`.
- [ ] Copy script installs the generated validation model into `<MV project>/r3d/models/`.
- [ ] Enable script writes scene-oriented plugin parameters and copies the scene JSON and validation model.
- [ ] Script error messages reference the current scene-centered documentation path when available.
- [ ] `package.json` formatting command includes current docs and source/script paths.

## Implementation Notes

Because the project has no external users yet, do not add migration compatibility for old plugin parameter names. If an implementation agent finds old names still referenced in source or docs, remove or rename them as part of this slice.

## Suggested Task Plan

1. Add or update focused tests for config parsing if the project test setup supports them.
2. Update config parsing and plugin header metadata.
3. Update MV host copy/enable scripts.
4. Run generation and static checks.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run generate:validation-asset
npm run check
npm run lint
npm run build
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
