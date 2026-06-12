# Slice 01: Scene Definition Contract And Validation

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- None

## Purpose

Establish the first-version **Presentation Scene Definition** contract before any runtime mutation code depends on user-authored JSON. This slice unlocks safe scene loading, validation asset generation, runtime scene construction, and later path-based loading.

## Scope

### In

- Add TypeScript types for schema v1 **Presentation Scene Definitions**.
- Add a TypeScript runtime validator for unknown JSON values.
- Add minimal test infrastructure if needed.
- Cover validator boundary and error-path behavior.
- Keep validation errors structured enough for diagnostics.

### Out

- No JSON Schema artifact, generated validator, or external editor schema.
- No Three.js runtime scene construction.
- No GLB/glTF loading.
- No MV plugin command or public API changes.
- No layout schema, timeline, nested graph, script, physics, collision, AssetManager, or Visual Choreography.

## Design References

- Requirements: REQ-04, REQ-05
- Decisions: `schemaVersion: 1`; strict JSON runtime files; TypeScript runtime validator; `cameras[] + activeCamera`; perspective-only cameras; optional `lights`; optional `models`; namespaced camera/model IDs; optional light IDs; hex color strings; uniform model `scale`; optional `fit`; Three.js coordinates; no JSON Schema artifact
- Invariants: `R3D Scene File` parsing and validation must happen before active scene mutation; MV plugin command failures must log useful diagnostics without stopping the MV game loop
- Completion Contract: OUT-04, DOC-01
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../CONTEXT.md`, `../../../../docs/adr/0001-adopt-presentation-scene-definitions.md`

## Code Context

The repo currently has no dedicated test framework or `npm run test` command. `package.json` has `check`, `lint`, `format`, and `build`. Current config parsing in `src/config.ts` is character-display plugin configuration and should not be reused as the scene definition validator.

## What To Build

Define the first-version scene contract and validator. The validator must accept unknown runtime data and either return a typed v1 definition or fail with clear structured validation errors.

The validator must cover:

- required `schemaVersion: 1`
- required non-empty scene `id`
- required non-empty `cameras` array
- unique **Presentation Camera** IDs
- required `activeCamera` referencing an existing camera
- perspective-only cameras with `position`, `target`, `fov`, optional `near`, and optional `far`
- `fov` in degrees with `1 <= fov < 180`, warning for `fov > 120`
- `near > 0` and `far > near`
- Three.js `[x, y, z]` finite-number vectors
- optional `lights`, with ambient, hemisphere, directional, and point variants
- optional light IDs unique within `lights`
- light colors as `#rgb` or `#rrggbb` only
- light `intensity >= 0`
- optional `models`, including omitted and empty `models`
- unique model IDs when models are present
- non-empty model paths
- optional model `position` and `rotation` vectors
- optional positive finite uniform numeric `scale`; vector scale rejected
- optional exact animation string
- optional `fit` with positive finite `height` and origin `center` or `center-bottom`

## Acceptance Criteria

- [ ] Scene definition TypeScript types exist and reflect schema v1 only.
- [ ] Runtime validation accepts the validation scene shape from the design.
- [ ] Runtime validation rejects missing `schemaVersion`.
- [ ] Runtime validation rejects `schemaVersion !== 1`.
- [ ] Runtime validation rejects malformed `cameras`, duplicate camera IDs, and missing or invalid `activeCamera`.
- [ ] Runtime validation rejects invalid vectors and non-finite numeric values.
- [ ] Runtime validation rejects invalid camera `fov`, `near`, and `far`, and surfaces high-`fov` warnings.
- [ ] Runtime validation accepts omitted or empty `lights` and omitted or empty `models`.
- [ ] Runtime validation rejects unsupported light types, invalid light colors, and invalid light intensity.
- [ ] Runtime validation rejects duplicate model IDs.
- [ ] Runtime validation rejects empty model paths.
- [ ] Runtime validation rejects vector scale and non-positive scale.
- [ ] Runtime validation rejects invalid fit heights and invalid fit origins.
- [ ] Runtime validation does not introduce layout, timeline, nested graph, script, physics, collision, Visual Choreography, or AssetManager concepts.
- [ ] A test command exists and runs validator tests.

## Implementation Notes

Prefer a small hand-written validator over adding a schema validation dependency. Do not generate or maintain a `.schema.json` file in this slice. Keep validation diagnostics structured with a path, message, and reason where practical.

If adding a test runner, keep the dependency and config minimal. The current project is TypeScript-first and Vite-based, so a lightweight Node-compatible TypeScript test setup is preferable.

## Suggested Task Plan

1. Add minimal test infrastructure and validator tests.
2. Add scene definition types and the validator.
3. Run focused validator verification.
4. Run static checks.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run test
npm run check
npm run lint
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
