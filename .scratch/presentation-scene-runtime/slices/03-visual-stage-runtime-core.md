# Slice 03: Visual Stage Runtime Core

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation

## Purpose

Replace the character-specific runtime core with a long-lived **Visual Stage** runtime that can build, switch, update, render, animate, and dispose active **Presentation Scenes**.

## Scope

### In

- Create or refactor runtime modules around **Visual Stage** and **Presentation Scene** responsibilities.
- Reuse one renderer, canvas, and `THREE.Scene`.
- Build pending active-scene roots from validated definitions.
- Load GLB/glTF models through `GLTFLoader` directly.
- Build camera, supported lights, flat models, optional fit, and initial animation.
- Implement per-model mixer/action state and explicit `play(modelId, clipName)`.
- Implement right-side **Visual Stage** layout through generalized DOM layer behavior.
- Implement explicit object-tree resource disposal.

### Out

- No path-based `.r3dscene.json` fetch API.
- No MV plugin command routing.
- No plugin parameter migration.
- No local MV host script migration.
- No public `window.R3DVisualStage.scene` wiring unless needed for local testing.
- No fullscreen layout, preferred layout, AssetManager, timeline, nested graph, shadows, VRM, or postprocessing.

## Design References

- Requirements: REQ-05, REQ-06, REQ-07, REQ-08, REQ-09
- Decisions: long-lived renderer/canvas/scene; active root `THREE.Group`; direct `GLTFLoader`; transactional load; failed load preserves active scene; each model owns independent mixer/action; right layout only; explicit disposal
- Invariants: `R3D Scene File` validation before active mutation; scene load failure never disposes active scene; removing an object is not cleanup; Visual Stage must not block pointer input
- Completion Contract: OUT-02, OUT-03, OUT-04, OUT-05, OT-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/characterDisplay.ts`, `../../../../src/domLayer.ts`, Three.js 0.184.0 sources named in the design

## Code Context

`src/characterDisplay.ts` currently owns renderer, scene, camera, GLTFLoader, one model, one mixer, lights, frameModel, play, update, and disposal. `src/domLayer.ts` currently computes a right-side canvas based on `characterDisplayWidth`. Existing disposal handles geometry/material and stops the mixer but does not dispose material textures or uncache mixer roots.

## What To Build

Implement a scene-oriented runtime core with an API that can be used by later slices:

- show or load a validated definition into a pending root
- hide the canvas
- update the layout/render loop at target FPS
- play a clip by model ID
- dispose active scene and renderer on teardown

The runtime must build pending resources off to the side and promote them only after all model loads succeed. It must dispose pending resources on failure and active resources on successful replacement.

## Acceptance Criteria

- [ ] Runtime owns one long-lived renderer, canvas, and `THREE.Scene`.
- [ ] Active scene content is contained under one root `THREE.Group`.
- [ ] `loadDefinition()` or equivalent accepts a validated definition and atomically promotes only after all models load.
- [ ] Failed model loading preserves the previous active root.
- [ ] Camera config updates camera position, target, fov, aspect, and projection.
- [ ] Supported lights are constructed from definition data.
- [ ] Multiple flat models can load into one pending root.
- [ ] Optional fit behavior matches the design.
- [ ] Initial model animation starts when declared.
- [ ] `play(modelId, clipName)` targets one model and returns false with diagnostics for missing model or clip.
- [ ] Resource disposal traverses root and disposes geometries, materials, material textures, skeletons, mixers, and root references.
- [ ] Right-side layout remains aligned to MV `Graphics._canvas` and keeps pointer pass-through.
- [ ] No old `character` public API is introduced in this slice.

## Implementation Notes

Keep path fetching out of this slice if possible; use in-memory definitions to test the runtime core. Avoid calling `renderer.dispose()` on scene switches. Reserve renderer disposal for plugin teardown.

Use a load token or equivalent guard if this slice exposes asynchronous loading in a way that could overlap. If path loading is deferred to Slice 04, the concurrency guard may also be deferred there, but active-scene preservation must still be true for model-load failure.

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
