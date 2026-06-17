# Slice 04: Visual Stage Runtime Core

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
- Slice 03: Scene Resource Disposal And Build Helpers

## Purpose

Replace the character-specific runtime core with a long-lived **Visual Stage** runtime that can build, switch, update, render, animate, and dispose active **Presentation Scenes** from in-memory definitions.

## Result

- Added the long-lived scene-oriented **Visual Stage** runtime.
- Runtime reuses one renderer, canvas, and Three.js scene across active **Presentation Scene** switches.
- Active content is represented by one root `THREE.Group` plus camera and model records.
- In-memory scene definition loading is transactional and uses latest-load-wins semantics.
- Failed and stale loads preserve the active root, active **Presentation Camera**, and visibility state.
- Runtime builds perspective **Presentation Cameras**, supported lights, flat GLB/glTF models, optional fit, and per-model animation mixers/actions.
- Runtime implements `show()`, `hide()`, `setCamera(cameraId)`, `play(modelId, clipName)`, `update(nowMs)`, and terminal `dispose()`.
- Runtime uses the Slice 03 disposal and model-build helpers.
- Tests cover runtime promotion, failure preservation, stale load handling, camera switching, animation playback, disposal, and layout behavior.

## Scope

### In

- Create or refactor runtime modules around **Visual Stage** and **Presentation Scene** responsibilities.
- Reuse one renderer, canvas, and `THREE.Scene`.
- Build pending active-scene roots from validated definitions.
- Build named **Presentation Cameras** and active camera selection.
- Build supported lights, flat models, optional fit, and initial animation.
- Load GLB/glTF models through `GLTFLoader` directly.
- Implement per-model mixer/action state and explicit `play(modelId, clipName)`.
- Implement `setCamera(cameraId)`.
- Implement `show()`, `hide()`, update/render loop, and terminal `dispose()`.
- Implement right-side **Visual Stage** layout through generalized DOM layer behavior.
- Use Slice 03 disposal and model-build helpers.

### Out

- No path-based `.r3dscene.json` loading.
- No MV plugin command routing.
- No plugin parameter migration.
- No local MV host script migration.
- No public `window.R3DVisualStage.scene` wiring unless needed for local testing.
- No fullscreen layout, preferred layout, AssetManager, timeline, nested graph, shadows, VRM, postprocessing, camera blending, or simultaneous multi-camera rendering.

## Design References

- Requirements: REQ-05, REQ-06, REQ-07, REQ-08, REQ-09
- Decisions: long-lived renderer/canvas/scene; active root `THREE.Group`; `cameras[] + activeCamera`; instant camera switching; direct `GLTFLoader`; transactional load; latest-load-wins; failed/stale load preserves active scene/camera/visibility; successful load auto-shows; each model owns independent mixer/action; right layout only; explicit disposal; terminal `dispose()`
- Invariants: validation before active mutation; scene load failure never disposes active scene; stale load never mutates latest active scene; failed/stale load never mutates active **Presentation Camera**; Visual Stage must not block pointer input
- Completion Contract: OUT-02, OUT-03, OUT-04, OUT-05, OT-04, OT-05
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../src/characterDisplay.ts`, `../../../../src/domLayer.ts`, Three.js 0.184.0 sources named in the design

## Code Context

`src/characterDisplay.ts` currently owns renderer, scene, camera, `GLTFLoader`, one model, one mixer, fixed lights, hard-coded model framing, play, update, and disposal. `src/domLayer.ts` currently computes a right-side canvas based on `characterDisplayWidth` and uses the `R3DCharacterDisplayCanvas` id. Existing runtime responds to MV `ok` input as a demo behavior; that behavior must not survive as a hidden scene feature in later public wiring.

## What To Build

Implement a scene-oriented runtime core with an API usable by later slices:

- `loadDefinition(definition)` or equivalent for already validated in-memory definitions
- `show()`
- `hide()`
- `setCamera(cameraId)`
- `play(modelId, clipName)`
- `update(nowMs)`
- `dispose()`

The runtime must build pending resources off to the side and promote them only after all declared model loads complete successfully and the load token is still current. It must dispose pending resources on failure or stale completion and preserve the active scene, active **Presentation Camera**, and visibility.

## Acceptance Criteria

- [x] Runtime owns one long-lived renderer, canvas, and `THREE.Scene`.
- [x] Active scene content is contained under one root `THREE.Group`.
- [x] Active scene state includes camera map, active camera ID, model records, and root.
- [x] `loadDefinition()` or equivalent accepts a validated definition and atomically promotes only after all declared models load.
- [x] Scene definitions with omitted or empty `models` are valid runtime inputs.
- [x] Scene definitions with omitted or empty `lights` receive no runtime fallback lights.
- [x] Failed model loading preserves the previous active root, active camera, and visibility.
- [x] Stale load completion cannot replace newer active scene state.
- [x] Promotion order adds pending root and replaces active state before disposing old state.
- [x] Successful loads automatically show the Visual Stage.
- [x] Failed or stale loads do not change visibility.
- [x] Named **Presentation Cameras** are built as perspective cameras, and `setCamera(cameraId)` switches instantly.
- [x] Layout updates active camera aspect before rendering.
- [x] Supported lights are constructed from definition data.
- [x] Multiple flat models can load into one pending root.
- [x] Optional fit behavior uses Slice 03 helper behavior.
- [x] Initial model animation starts when declared and exactly found; missing initial animation is non-fatal.
- [x] `play(modelId, clipName)` targets one model and returns false with diagnostics for missing model or exact clip.
- [x] Resource disposal uses Slice 03 helper behavior.
- [x] `dispose()` is terminal and repeated dispose calls are no-ops.
- [x] Right-side layout remains aligned to MV `Graphics._canvas` and keeps pointer pass-through.
- [x] No old `character` public API is introduced in this slice.

## Implementation Notes

Keep path loading out of this slice; use in-memory definitions to test the runtime core. Avoid calling `renderer.dispose()` on scene switches. Reserve renderer disposal for terminal plugin teardown.

Use a load token or equivalent guard for asynchronous model loading even before path loading exists, because `loadDefinition()` can still overlap through GLB loads.

## Suggested Task Plan

1. Add runtime-focused tests with mocked or controlled GLB loading where practical.
2. Implement scene-oriented runtime modules and generalized DOM layer/config consumption.
3. Integrate Slice 03 helper modules.
4. Run focused verification.
5. Report changed files and verification result.

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
