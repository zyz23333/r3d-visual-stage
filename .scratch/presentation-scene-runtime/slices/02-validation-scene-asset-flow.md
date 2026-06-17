# Slice 02: Validation Scene Asset Flow

## Status

Completed

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation

## Purpose

Make the default validation path exercise **R3D Scene File** loading instead of only GLB loading. This slice gives later runtime, public API, and MV host slices a real generated `.r3dscene.json` file to load.

## Result

- Updated the validation asset generation flow to produce both the validation GLB and validation **R3D Scene File**.
- The generated scene lives at `public/r3d/scenes/r3d-validation-scene.r3dscene.json`.
- The generated model lives at `public/r3d/models/r3d-validation-character.glb`.
- The generated scene references the validation model with the MV project-root-relative path `r3d/models/r3d-validation-character.glb`.
- The generated scene validates against the schema v1 runtime validator and includes cameras, lights, model fit, and the initial `Idle` animation.

## Scope

### In

- Generate `public/r3d/scenes/r3d-validation-scene.r3dscene.json`.
- Keep generating `public/r3d/models/r3d-validation-character.glb`.
- Validate the generated scene definition using the Slice 01 validator.
- Ensure the validation scene exercises cameras, lights, one GLB model, fit, and initial animation.

### Out

- No MV plugin command changes.
- No runtime scene loading.
- No local MV host copy/enable script migration.
- No new asset formats, production asset pipeline, JSONC/JSON5, or JSON Schema artifact.

## Design References

- Requirements: REQ-03, REQ-04
- Decisions: `.r3dscene.json`; strict JSON; default `r3d/` namespace with `r3d/scenes/` and `r3d/models/`; normalized project-root-relative paths; path validation rejects empty, absolute, drive-letter, URL, protocol-relative, and parent-directory traversal; `cameras[] + activeCamera`; generated validation scene must include GLB and lights; model paths are MV project-root-relative
- Invariants: default validation flow remains local-only and must not require repository-local MV runtime files
- Completion Contract: OT-01, DOC-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../scripts/generate-validation-asset.mjs`, `../../../../public/r3d/models/r3d-validation-character.glb`

## Code Context

`scripts/generate-validation-asset.mjs` currently writes only `public/models/r3d-validation-character.glb`. The generated GLB has exact `Idle` and `Wave` animation clips. There is no generated `public/r3d/scenes/r3d-validation-scene.r3dscene.json` yet.

## What To Build

Extend the validation generation flow so the same command creates:

```text
public/r3d/models/r3d-validation-character.glb
public/r3d/scenes/r3d-validation-scene.r3dscene.json
```

The generated scene should include:

- `schemaVersion: 1`
- `id: "r3d-validation-scene"`
- `cameras` with one perspective **Presentation Camera** using `id: "portrait"`
- `activeCamera: "portrait"`
- explicit hemisphere and directional lights with hex colors
- `models` with one model using `id: "character"`
- `path: "r3d/models/r3d-validation-character.glb"`
- optional `fit` with `height: 2.4` and `origin: "center-bottom"`
- initial animation `"Idle"`

## Acceptance Criteria

- [x] `npm run generate:validation-asset` produces the validation GLB and validation **R3D Scene File**.
- [x] Generated scene file path is `public/r3d/scenes/r3d-validation-scene.r3dscene.json`.
- [x] Generated scene JSON is stable, readable, strict JSON.
- [x] Generated scene passes the Slice 01 validator.
- [x] Generated scene uses `cameras[] + activeCamera`.
- [x] Generated scene declares lights explicitly.
- [x] Generated scene references `r3d/models/r3d-validation-character.glb`.
- [x] Generated scene uses model ID `character` and initial animation `Idle`.
- [x] Existing GLB generation behavior remains intact.

## Implementation Notes

Prefer generating the scene JSON next to the GLB in the existing validation script unless the file becomes large enough to justify a separate generator. Create `public/r3d/scenes/` and `public/r3d/models/` recursively.

The model path in the scene JSON must be relative to the MV project root after copy, not relative to the repository file location.

## Suggested Task Plan

1. Add or update tests around generated scene validity if useful.
2. Extend validation asset generation.
3. Run the generator and validator tests.
4. Run static checks.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run generate:validation-asset
npm run test
npm run check
npm run lint
```

## Verification Result

Passed:

- `npm run generate:validation-asset`
- `npm run test`
- `npm run check`
- `npm run lint`

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
