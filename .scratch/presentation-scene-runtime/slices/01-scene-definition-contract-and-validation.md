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

Establish the first-version **Presentation Scene Definition** contract before any runtime mutation code depends on user-authored JSON. This slice unlocks safe scene loading, validation asset generation, and later transactional runtime work.

## Scope

### In

- Add TypeScript types for schema v1 **Presentation Scene Definitions**.
- Add a runtime validator for unknown JSON values.
- Add test infrastructure if needed.
- Cover validator boundary and error-path behavior.

### Out

- No Three.js runtime scene construction.
- No GLB loading.
- No MV plugin command or public API changes.
- No AssetManager, nested graph, timeline, scripting, physics, collision, or layout schema.

## Design References

- Requirements: REQ-04, REQ-05
- Decisions: `schemaVersion: 1` required; flat camera/lights/models schema; rotations use radians; lights are ambient/hemisphere/directional/point; `fit` is optional; `fit.origin` supports `center` and `center-bottom`
- Invariants: `R3D Scene File` parsing and validation must happen before active scene mutation; MV failures must log useful diagnostics without stopping the game loop
- Completion Contract: OUT-04, DOC-01
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../CONTEXT.md`, `../../../../docs/adr/0001-adopt-presentation-scene-definitions.md`

## Code Context

The repo currently has no test framework. `tsconfig.json` includes `src`, `scripts`, `vite.config.ts`, and `eslint.config.js`. `package.json` has `check`, `lint`, `format`, and `build` scripts but no test command. Current config parsing in `src/config.ts` is character-specific and should not be reused as the scene definition validator.

## What To Build

Define the first-version scene contract and validator. The validator must accept unknown runtime data and either return a typed definition with structured validation success or fail with clear validation errors. It must cover the fields described in the design:

- required `schemaVersion: 1`
- required non-empty `id`
- camera position/target number triples and reasonable `fov`
- lights array with ambient, hemisphere, directional, and point variants
- models array with unique non-empty IDs
- model path as non-empty string
- model position/rotation as number triples when present
- scale as number or number triple when present
- optional animation string
- optional fit with positive height and supported origin

## Acceptance Criteria

- [ ] Scene definition TypeScript types exist and reflect schema v1 only.
- [ ] Runtime validation accepts the validation scene shape from the design.
- [ ] Runtime validation rejects missing `schemaVersion`.
- [ ] Runtime validation rejects `schemaVersion !== 1`.
- [ ] Runtime validation rejects invalid vector lengths and non-number vector entries.
- [ ] Runtime validation rejects duplicate model IDs.
- [ ] Runtime validation rejects unsupported light types.
- [ ] Runtime validation rejects invalid scale and invalid fit origin.
- [ ] Runtime validation does not introduce layout, timeline, nested graph, script, physics, or AssetManager concepts.
- [ ] A test command exists and runs the validator tests.

## Implementation Notes

Prefer a small hand-written validator over adding a schema validation dependency. Keep errors useful enough for diagnostics and tests. Do not silently coerce invalid fields into valid definitions except where the design explicitly permits implementation discretion.

If adding a test runner, keep the dependency and config minimal. The current project is TypeScript-first and Vite-based, so a lightweight Node-compatible TypeScript test setup is preferable.

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
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
