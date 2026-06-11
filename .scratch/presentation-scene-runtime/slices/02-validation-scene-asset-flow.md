# Slice 02: Validation Scene Asset Flow

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation

## Purpose

Make the default validation path exercise **R3D Scene File** loading instead of only GLB loading. This slice gives later runtime and MV host slices a real generated `.r3dscene.json` file to load.

## Scope

### In

- Generate `public/scenes/r3d-validation-scene.r3dscene.json`.
- Keep generating `public/models/r3d-validation-character.glb`.
- Validate the generated scene definition using the Slice 01 validator.
- Ensure the validation scene references the generated GLB and uses `modelId` `character`.

### Out

- No MV plugin command changes.
- No runtime scene loading.
- No local MV host copy/enable script changes beyond what is required to keep generation coherent.
- No new asset formats or production asset pipeline.

## Design References

- Requirements: REQ-03, REQ-04
- Decisions: `.r3dscene.json`; required `schemaVersion: 1`; default startup path uses generated validation scene JSON; first-version schema is camera/lights/flat models/initial animation
- Invariants: default validation flow remains local-only and must not require repository-local MV runtime files
- Completion Contract: OT-01, DOC-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../scripts/generate-validation-asset.mjs`, `../../../../public/models/r3d-validation-character.glb`

## Code Context

`scripts/generate-validation-asset.mjs` currently writes only `public/models/r3d-validation-character.glb`. The generated GLB has `Idle` and `Wave` animation clips. There is no `public/scenes/` directory yet.

## What To Build

Extend the validation generation flow so the same command creates a scene JSON file:

```text
public/scenes/r3d-validation-scene.r3dscene.json
```

The generated scene should include:

- `schemaVersion: 1`
- `id: "r3d-validation-scene"`
- camera matching the existing character display framing
- ambient or hemisphere plus directional lighting sufficient to match current visibility
- one model with `id: "character"`
- `path: "models/r3d-validation-character.glb"`
- optional fit with height `2.4` and `origin: "center-bottom"`
- initial animation `"Idle"`

## Acceptance Criteria

- [ ] `npm run generate:validation-asset` produces the validation GLB and validation **R3D Scene File**.
- [ ] Generated scene file path is `public/scenes/r3d-validation-scene.r3dscene.json`.
- [ ] Generated scene JSON is stable, readable, and valid JSON.
- [ ] Generated scene passes the Slice 01 validator.
- [ ] Generated scene references `models/r3d-validation-character.glb`.
- [ ] Generated scene uses model ID `character` and initial animation `Idle`.
- [ ] Existing GLB generation behavior remains intact.

## Implementation Notes

Prefer generating the scene JSON next to the GLB in the existing validation script unless the file becomes large enough to justify a separate generator. Create `public/scenes/` recursively.

The scene path in the JSON must be relative to the MV project root after copy, not relative to the repository file location.

## Suggested Task Plan

1. Add or update tests.
2. Implement the smallest production change.
3. Run focused verification.
4. Update docs if required.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run generate:validation-asset
npm run test
npm run check
npm run lint
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
