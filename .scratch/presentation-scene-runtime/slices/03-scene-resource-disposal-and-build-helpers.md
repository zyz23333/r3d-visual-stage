# Slice 03: Scene Resource Disposal And Build Helpers

## Status

Completed

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation

## Purpose

Extract and test the high-risk Three.js resource lifecycle and model build behavior before integrating the full **Visual Stage** runtime. This slice reduces risk around scene switching, disposal, model fitting, and exact animation lookup.

## Result

- Added reusable scene disposal helpers for owned Three.js object trees.
- Disposal now deduplicates geometries, materials, textures, and skeletons before disposal.
- Disposal best-effort closes ImageBitmap-backed texture data and continues after close/dispose warnings.
- Added helpers for model fit and transform preparation using bounding-box Y height.
- Added exact, case-sensitive animation clip lookup.
- Added focused tests for disposal deduplication, ImageBitmap close behavior, model fit behavior, impossible fit failures, and exact clip lookup.

## Scope

### In

- Add helper(s) for disposing owned Three.js scene resources.
- Add helper(s) for model fit and transform preparation.
- Add helper(s) or conventions for exact case-sensitive animation clip lookup.
- Add focused tests for disposal, fit, and clip lookup behavior.

### Out

- No long-lived **Visual Stage** runtime.
- No renderer/canvas ownership changes.
- No path-based **R3D Scene File** loading.
- No MV plugin command or public API changes.
- No AssetManager, cache, reference-counting, nested graph, timeline, shadows, VRM, or postprocessing.

## Design References

- Requirements: REQ-05, REQ-07, REQ-09
- Decisions: removing an object is not cleanup; disposal deduplicates geometries/materials/textures/skeletons; best-effort ImageBitmap close; mixer stop and uncache root; `fit.height` uses bounding box Y size; `fit.origin` supports `center` and `center-bottom`; animation lookup is exact case-sensitive only
- Invariants: scene load failure must never dispose active scene; removing an object from the scene graph must never be treated as resource cleanup by itself
- Completion Contract: OUT-03, OUT-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/characterDisplay.ts`, Three.js 0.184.0 sources named in the design

## Code Context

`src/characterDisplay.ts` currently disposes geometry/material only, does not dispose material textures, does not close ImageBitmap-backed texture data, does not dispose skeleton bone textures, and does not call `AnimationMixer.uncacheRoot`. Its `frameModel()` uses max-axis scaling, while the new design requires `fit.height` to use bounding box Y size. Current animation lookup lowercases names and allows substring matches; the new design requires exact case-sensitive matching.

## What To Build

Create reusable helpers that later runtime code can call:

- dispose a root object tree's owned resources with deduplication
- stop and uncache mixers tied to model roots
- best-effort close ImageBitmap-backed texture image data
- apply optional model-space `fit` before declared transform
- locate animation clips by exact case-sensitive name only

## Acceptance Criteria

- [x] Disposal helper traverses an object tree and disposes unique geometries.
- [x] Disposal helper disposes unique materials.
- [x] Disposal helper discovers and disposes unique material textures.
- [x] Disposal helper best-effort closes `texture.source?.data?.close` and `texture.image?.close` when present.
- [x] Disposal helper handles skeleton disposal where present.
- [x] Disposal helper stops mixers and uncaches mixer roots.
- [x] Disposal continues after individual close/dispose warnings where practical.
- [x] Fit helper scales by bounding box Y size, not longest axis.
- [x] Fit helper supports `center` and `center-bottom`.
- [x] Impossible fit calculations fail clearly.
- [x] Clip lookup is exact case-sensitive and does not use fuzzy, substring, or case-insensitive matching.
- [x] Tests cover shared resource deduplication and ImageBitmap close behavior.

## Implementation Notes

Keep helpers independent from MV plugin installation and public API. They may live in modules such as `sceneDisposal.ts`, `sceneModelBuild.ts`, or similar names matching the design's discretion.

Do not add an AssetManager, cache, or reference counting. This slice is about owned resources inside one loaded scene.

## Suggested Task Plan

1. Add focused tests for disposal, fit, and clip lookup.
2. Implement helper modules.
3. Run focused tests.
4. Run static checks.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run test
npm run check
npm run lint
```

## Verification Result

Passed:

- `npm run test`
- `npm run check`
- `npm run lint`

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
