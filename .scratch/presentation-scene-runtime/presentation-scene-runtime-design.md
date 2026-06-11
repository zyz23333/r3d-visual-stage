# Presentation Scene Runtime Design

## Status

Draft

## Change Slug

`presentation-scene-runtime`

## Context

R3D Visual Stage currently implements a **3D Character Display** first slice for the **RPG Maker MV Target**. The current runtime creates one `CharacterDisplay` instance that owns a Three.js renderer, scene, camera, `GLTFLoader`, one loaded model, one `AnimationMixer`, a right-side DOM canvas, `R3DStage Character ...` plugin commands, and `window.R3DVisualStage.character`.

The project direction has now shifted toward **Presentation Scene Definitions** and **R3D Scene Files** as the primary authoring and loading model. This is recorded in `CONTEXT.md` and ADR-0001. The **3D Character Display** remains a valid product use case, but it should become a default **Presentation Scene** example rather than the long-term runtime architecture.

This design exists because the change crosses runtime architecture, public API, plugin commands, plugin parameters, validation assets, documentation, Three.js resource lifecycle, and local MV test-host scripts.

## Problem

The existing implementation is too character-specific to support bounded **Presentation Scenes**. Model loading, lighting, camera setup, animation playback, rendering, DOM layout, plugin command routing, and public API are all coupled to a single character model. Adding scene loading directly onto this structure would either create parallel runtimes or preserve a public `Character` control surface that the project no longer needs.

Three.js cleanup also needs to become explicit before scene switching is introduced. Removing an object or `THREE.Group` from a scene does not release GPU resources. A failed load must not clear the current visible scene.

## Goals

- Make **Presentation Scene Definitions** the primary runtime and API model.
- Load `.r3dscene.json` **R3D Scene Files** from MV project-relative paths.
- Support JS API loading from both a path and an in-memory definition.
- Replace long-term `Character` plugin commands and public API with `Scene` commands and API.
- Preserve the current visible **Presentation Scene** when a new scene fails to load.
- Reuse one renderer, canvas, and Three.js scene across scene switches.
- Represent the active **Presentation Scene** as a replaceable root `THREE.Group`.
- Support first-version scene content: one camera config, flat models, lights, and initial model animation.
- Keep the existing right-side **Visual Stage** layout as the default plugin-level layout.
- Update validation assets and documentation so the default startup path validates scene loading, not just GLB loading.

## Non-Goals

- No general AssetManager, AssetRegistry, or cross-scene asset cache.
- No nested Unity-like scene graph.
- No scripting, components, physics, gameplay collision, pathfinding, or authoritative 3D actor.
- No **Visual Choreography** timeline, camera cuts, delays, MV switch/variable triggers, or animation sequences.
- No VRM, MToon, expressions, LookAt, spring bones, KTX2, Draco, Meshopt, or postprocessing.
- No shadow rendering or shadow authoring parameters.
- No fullscreen layout in this first version.
- No preservation of `R3DStage Character ...` commands as a long-term compatibility surface.

## Scope

### In

- Runtime modules under `src/` that install the plugin, expose public API, route MV plugin commands, manage DOM layout, load GLB/glTF models, validate scene definitions, render Three.js, and dispose resources.
- Plugin header and plugin parameters in `src/mv-plugin-header.js`.
- Type declarations in `src/mvTypes.ts`.
- Validation asset generation and local MV copy/enable scripts.
- Documentation currently centered on `docs/r3d-character-display.md`.
- Default validation model and new default validation scene file under `public/`.

### Out

- Full production asset pipeline.
- MV editor tooling beyond normal plugin parameters and plugin commands.
- Multiple simultaneous **Presentation Scenes**.
- Runtime layout switching beyond the first-version right-side layout.
- Any issue tracker publication or implementation slice files.

## Canonical References

- `CONTEXT.md`
- `docs/adr/0001-adopt-presentation-scene-definitions.md`
- `docs/r3d-character-display.md`
- `src/main.ts`
- `src/mvPlugin.ts`
- `src/characterDisplay.ts`
- `src/domLayer.ts`
- `src/config.ts`
- `src/mvTypes.ts`
- `src/mv-plugin-header.js`
- `src/runtimeCompat.ts`
- `src/fileLogger.ts`
- `scripts/generate-validation-asset.mjs`
- `scripts/copy-to-mv-host.mjs`
- `scripts/enable-mv-test-host.mjs`
- `vite.config.ts`
- Three.js 0.184.0 sources for `Group`, `Object3D`, `WebGLRenderer.dispose`, `Material.dispose`, `Texture.dispose`, and `BufferGeometry.dispose`.

## Current Behavior

The plugin installs a character-display runtime. `readCharacterDisplayConfig()` reads `Default Character Path`, `Auto Show Character`, and `Character Display Width`. `installR3DVisualStage()` creates `CharacterDisplay`, exposes `window.R3DVisualStage.character`, routes only the `Character` command domain, and auto-shows the character when configured.

`CharacterDisplay` creates a transparent renderer and right-side canvas, installs fixed lights, loads one GLB path via `GLTFLoader`, frames that model with hard-coded character-display behavior, plays `Idle` by default, responds to MV `ok` input by attempting `Wave`, and renders at the configured target FPS.

The validation flow generates only `public/models/r3d-validation-character.glb`, copies only the plugin and model into a local MV host, and documents `R3DStage Character ...` commands.

## Target Behavior

The plugin installs a scene-oriented **Visual Stage** runtime. The public API is centered on `window.R3DVisualStage.scene`, and MV plugin commands use the `Scene` command domain. Startup loads `Default Scene Path`, which points at a generated validation `.r3dscene.json` file, when `Auto Show Scene` is enabled.

The runtime keeps one renderer, one DOM canvas, and one Three.js scene alive for the plugin lifetime. Each loaded **Presentation Scene** is built into a pending root `THREE.Group`. The pending root is atomically swapped into the Three.js scene only after the **R3D Scene File** is fetched, parsed, validated, and all referenced GLB/glTF models load successfully. Failed scene loads log errors, dispose pending resources, and leave the current active scene visible.

The right-side **Visual Stage** layout remains the only implemented layout. Layout is plugin configuration, not camera configuration and not part of the first-version **Presentation Scene Definition** schema.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |
| REQ-01 | Public API is `window.R3DVisualStage.character`. | Public API is `window.R3DVisualStage.scene`. | API supports `load(path)`, `loadDefinition(definition)`, `hide()`, `play(modelId, clipName)`, and `dispose()`. |
| REQ-02 | MV commands use `R3DStage Character ...`. | MV commands use `R3DStage Scene ...`. | `R3DStage Scene Load <path>`, `R3DStage Scene Hide`, and `R3DStage Scene Play <modelId> <clipName>` route to the scene runtime. |
| REQ-03 | Startup loads `Default Character Path`. | Startup loads `Default Scene Path`. | With defaults, enabling the plugin auto-loads and renders the validation **R3D Scene File**. |
| REQ-04 | Validation asset is only a GLB model. | Validation includes a GLB model and `.r3dscene.json` scene file. | Build/generation flow produces both files under `public/`, and copy/enable scripts install both into the MV host. |
| REQ-05 | One model is loaded directly into the Three.js scene. | A complete pending `THREE.Group` is built before active scene replacement. | A failed JSON parse, validation error, or GLB load failure leaves the current active scene visible. |
| REQ-06 | `CharacterDisplay` owns fixed camera, fixed lights, and one mixer. | Scene definitions own camera config, lights, flat models, and per-model animation state. | Multiple model entries can load into one active scene; each model can play animation independently by `modelId`. |
| REQ-07 | Model fit is always character-specific. | Model fit is optional per model. | Models without `fit` keep loaded dimensions plus declared transform; models with `fit` are resized by `height` and `origin`. |
| REQ-08 | DOM layout is named character display width. | DOM layout is Visual Stage layout. | Config uses `Stage Placement = right` and `Stage Width = 280`; layout remains right-side only for this change. |
| REQ-09 | Resource cleanup disposes geometry/material and stops mixer. | Scene cleanup disposes object-tree GPU resources more completely. | Cleanup disposes geometries, materials, material textures, skeletons where present, stops mixers, uncaches mixer roots, and removes root references. |
| REQ-10 | Documentation is centered on Character Display. | Documentation is centered on Presentation Scenes. | Primary docs describe **R3D Scene Files**, scene commands, scene API, validation scene, and known limits. |

## Locked Decisions

- The change slug is `presentation-scene-runtime`.
- **Presentation Scene Definition** is the canonical term; avoid "Unity-like scene".
- **R3D Scene File** is the canonical term for `.r3dscene.json`.
- First-version **R3D Scene Files** must explicitly use `schemaVersion: 1`.
- Only `schemaVersion === 1` is accepted.
- First-version scene content is camera, lights, flat models, and initial animation.
- No nested scene graph, scripting, physics, collision, or timeline.
- No AssetManager or AssetRegistry in this change.
- GLB/glTF loading uses `GLTFLoader` directly.
- Runtime reuses one renderer, canvas, and Three.js scene.
- Active **Presentation Scene** is represented by one root `THREE.Group`.
- New scene loads are transactional and atomically swap only after full preload succeeds.
- Failed loads preserve the current active scene.
- Scene command/API animation playback requires `modelId + clipName`.
- Each model owns independent animation mixer/action state.
- Coordinates use Three.js-style world units.
- Rotations use radians.
- Layout is plugin-level **Visual Stage** configuration, not camera config and not part of first-version scene schema.
- First-version layout supports `Stage Placement = right` and `Stage Width = 280`.
- Lights support ambient, hemisphere, directional, and point.
- Shadows are out of scope.
- Model `fit` is optional; no `fit` means preserve loaded dimensions and apply declared transform.
- `fit.origin` supports `center` and `center-bottom`.
- The default startup path uses `Default Scene Path` and generated validation scene JSON.
- The project is early; explicitly remove the old `Character` API and `R3DStage Character ...` commands instead of preserving compatibility wrappers.

## Agent Discretion

- Exact module names may vary if they preserve the locked boundaries. Acceptable names include `VisualStageRuntime`, `PresentationSceneRuntime`, `presentationSceneDefinition`, `sceneValidation`, and `sceneDisposal`.
- The validator may return structured errors or throw typed errors, as long as caller behavior and logs remain clear.
- The implementation may keep a small compatibility shim internally during migration if it is not exposed as public API and is removed before completion.
- The generated validation **R3D Scene File** may be written by the existing validation asset script or a new script, as long as npm scripts remain coherent.
- Test file layout and helper names are discretionary.

## Invariants

- The **2D Tilemap** remains authoritative for movement, events, collision, menus, and game state.
- The **Visual Stage** must not block MV pointer input.
- The plugin must continue targeting RPG Maker MV only.
- The Vite build target must remain compatible with MV 1.6.x playtest unless explicitly revalidated.
- Runtime compatibility installed by `src/runtimeCompat.ts` must run before Three.js loading paths need it.
- A scene load failure must never dispose or hide the currently active valid scene.
- Removing a Three.js object from the scene graph must never be treated as resource cleanup by itself.
- `R3D Scene File` parsing and validation must happen before any active scene mutation.
- MV plugin command failures must log useful diagnostics without stopping the MV game loop.
- The default validation flow must remain local-only and must not require repository-local MV runtime files.

## Design

The new runtime should split the current `CharacterDisplay` responsibilities into scene-oriented responsibilities while keeping the same MV integration shape.

`installR3DVisualStage()` remains the plugin installation entry point. It reads scene-oriented config, installs file logging, creates the long-lived **Visual Stage** runtime, exposes `window.R3DVisualStage.scene`, installs MV plugin command routing, hooks `SceneManager.updateMain`, and auto-loads `Default Scene Path` when configured.

The long-lived **Visual Stage** runtime owns:

- `THREE.WebGLRenderer`
- transparent renderer canvas
- `DomLayer`
- one `THREE.Scene`
- one active camera
- one active root `THREE.Group`
- target FPS throttling
- render/update loop
- active-scene disposal

The **Presentation Scene** loading path is transactional:

1. Resolve and load the **R3D Scene File** from a path, or accept an in-memory definition.
2. Validate the definition at runtime.
3. Create a pending `THREE.Group`.
4. Build pending lights from the definition.
5. Build pending model entries by loading each GLB/glTF through `GLTFLoader`.
6. Apply optional fit and declared transforms.
7. Create one `AnimationMixer` per model that has animation clips.
8. Start the model's initial animation when declared.
9. If all pending work succeeds, dispose the current active root and promote the pending root.
10. If any pending work fails, dispose pending resources and preserve the active root.

The first-version **Presentation Scene Definition** shape is intentionally flat:

```json
{
  "schemaVersion": 1,
  "id": "r3d-validation-scene",
  "camera": {
    "position": [0, 1.35, 4.5],
    "target": [0, 1.1, 0],
    "fov": 30
  },
  "lights": [
    {
      "id": "hemi",
      "type": "hemisphere",
      "skyColor": "#ffffff",
      "groundColor": "#404050",
      "intensity": 2.4
    },
    {
      "id": "key",
      "type": "directional",
      "color": "#ffffff",
      "intensity": 2.8,
      "position": [2, 4, 4]
    }
  ],
  "models": [
    {
      "id": "character",
      "path": "models/r3d-validation-character.glb",
      "position": [0, 0, 0],
      "rotation": [0, -0.2, 0],
      "scale": 1,
      "fit": {
        "height": 2.4,
        "origin": "center-bottom"
      },
      "animation": "Idle"
    }
  ]
}
```

The schema shown here is authoritative for design intent but not a full JSON Schema artifact. Implementation agents may refine TypeScript type names and validator internals without changing behavior.

Model fit applies before declared transform. Without `fit`, loaded GLB dimensions are preserved. With `fit`, the model's bounding box is used to scale to the requested height and align by origin. Declared `position`, `rotation`, and `scale` are then applied.

Scene playback uses explicit model IDs. `scene.play("character", "Wave")` looks up the active model entry by ID, finds the clip by exact case-insensitive name or a conservative contains match, fades in the requested action, fades out that model's previous action, and returns `false` with a warning when the model or clip is missing.

Resource disposal must traverse a root object tree and release owned GPU resources. It must dispose geometries, all materials, textures reachable from material properties, and skeletons where present. It must stop all mixers for the root and uncache their roots. It must then sever references to model records, clip maps, actions, and the active root. `renderer.dispose()` is reserved for plugin teardown, not scene switching.

`DomLayer` should be renamed or generalized around **Visual Stage** layout. The first version still computes a right-side canvas based on MV `Graphics._canvas`, `Stage Width`, and browser scaling. It must keep `pointer-events: none`, transparent background, and placement above MV canvases.

## Conditional Modules

### UX / Product Behavior

The plugin's default user-visible behavior changes from "show a character from a GLB path" to "load a validation **R3D Scene File**." On first enable with defaults, the user should still see the validation character on the right side of the MV canvas.

The MV plugin command surface becomes:

```text
R3DStage Scene Load scenes/r3d-validation-scene.r3dscene.json
R3DStage Scene Hide
R3DStage Scene Play character Wave
```

The command surface does not support inline JSON. Long-form scene authoring belongs in `.r3dscene.json` files.

### Domain Model

**Presentation Scene Definition** is the source document for bounded visual staging content. An **R3D Scene File** stores one **Presentation Scene Definition**. A **Presentation Scene** can include camera configuration, lights, models, and initial animation, but does not define 3D gameplay.

**Visual Stage** layout is distinct from camera configuration. The camera controls composition inside the rendered 3D view. Layout controls where the transparent WebGL canvas appears relative to the MV canvas.

### API / Contract Changes

The public API target is:

```ts
window.R3DVisualStage.scene.load(path: string): Promise<boolean>;
window.R3DVisualStage.scene.loadDefinition(definition: unknown): Promise<boolean>;
window.R3DVisualStage.scene.hide(): void;
window.R3DVisualStage.scene.play(modelId: string, clipName: string): boolean;
window.R3DVisualStage.dispose(): void;
```

`load` and `loadDefinition` should resolve to `true` only when the scene is active after a successful atomic switch. They should resolve to `false` for handled validation or asset-load failures after logging diagnostics. Unexpected programmer errors may still reject if not safely recoverable, but plugin command routing should not let them stop MV's game loop.

Plugin parameters become scene-oriented:

- `Default Scene Path`, default `scenes/r3d-validation-scene.r3dscene.json`
- `Auto Show Scene`, default `true`
- `Stage Placement`, default `right`
- `Stage Width`, default `280`
- `Target FPS`, default `30`
- `Max Pixel Ratio`, default `1.5`
- `File Logging`, default `false`
- `Log File Path`, default `r3d-logs/R3DVisualStage.log`
- `Timestamp Log File`, default `false`

`Stage Placement` only accepts `right` in this change. Invalid values should fall back to `right` with a warning or be clamped by config parsing.

### Side Effects / Integrations

Local MV test-host scripts must copy the generated `.r3dscene.json` file into `<MV project>/scenes/` in addition to copying the plugin and validation GLB. The enable script must write scene-oriented plugin parameters into `<MV project>/js/plugins.js`.

The validation generation flow must produce:

- `public/models/r3d-validation-character.glb`
- `public/scenes/r3d-validation-scene.r3dscene.json`

### Execution / Concurrency Semantics

Scene loading must be treated as a transaction. The active scene remains authoritative until a pending scene has fully loaded. If multiple `load` calls are made concurrently, the implementation must avoid older slow loads replacing newer successful loads. Acceptable behavior includes a monotonically increasing load token where only the latest token may promote a pending scene.

`hide()` hides the **Visual Stage** canvas but does not need to dispose the active scene. Plugin teardown through `dispose()` must dispose the active scene and renderer.

### Frontend State / Interaction Model

The transparent canvas must continue following MV `Graphics._canvas` layout on resize and playtest window changes. Layout updates should continue to happen during the render loop before renderer size and camera aspect are updated.

The existing MV `ok` input demo behavior should not remain as a hidden scene feature unless it is explicitly re-expressed as documented scene command behavior. First-version scene animation should be driven by initial animation and explicit `Scene Play`.

### Observability / Operations

Diagnostics should identify scene-loading milestones and failure causes:

- plugin installed
- scene load started
- scene definition fetched
- scene definition validation failed
- model load started
- model load failed
- scene promoted
- first layout ready
- first render completed

File logging remains NW.js-only and should continue serializing useful error details. Diagnostics should include scene ID, path, model IDs, missing clip names, and available clips where relevant.

### Research / Dependency Findings

Three.js 0.184.0 `Group` is a semantic `Object3D` container. It is appropriate for an active **Presentation Scene** root, but removing it from the scene graph does not release GPU resources.

`BufferGeometry.dispose()`, `Material.dispose()`, and `Texture.dispose()` dispatch dispose events consumed by the renderer. Material disposal does not automatically dispose textures referenced by the material. `WebGLRenderer.dispose()` releases renderer-owned GPU resources and removes context listeners, so it should only run when the plugin is no longer used, not on every scene switch.

### Rollout / Migration / Cleanup

Because the project has no external users yet, this change may replace `Character` public API and MV commands rather than maintain compatibility wrappers. Documentation and plugin help text must stop advertising `R3DStage Character ...`.

The old `docs/r3d-character-display.md` should be replaced or superseded by scene-centered documentation, likely `docs/r3d-presentation-scenes.md`. Any package formatting script must be updated to include the new docs path.

## Phase Slices

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish the first-version **Presentation Scene Definition** contract and runtime validator. | None | REQ-04, REQ-05 | Types, validation behavior, and test infrastructure exist; invalid definitions fail before runtime mutation. | Slice 01: Scene Definition Contract And Validation |
| 2 | Generate a default validation **R3D Scene File** that exercises the schema. | Phase 1 | REQ-03, REQ-04 | `public/scenes/r3d-validation-scene.r3dscene.json` is generated and validates against schema v1. | Slice 02: Validation Scene Asset Flow |
| 3 | Build the long-lived **Visual Stage** runtime and transactional active-scene switching. | Phase 1 | REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 | Renderer/canvas/scene are reused; active root swaps atomically; resources are explicitly disposed. | Slice 03: Visual Stage Runtime Core |
| 4 | Replace public control with scene-oriented API and MV commands. | Phase 3 | REQ-01, REQ-02, REQ-03 | `window.R3DVisualStage.scene` and `R3DStage Scene ...` work; old `character` API and `R3DStage Character ...` commands are removed. | Slice 04: Scene Path Loading And Public Control Surface |
| 5 | Migrate plugin parameters and local MV host integration to scene defaults. | Phases 2, 4 | REQ-03, REQ-04, REQ-08 | Defaults load the generated scene file; copy/enable scripts install scene JSON and scene-oriented plugin parameters. | Slice 05: Plugin Parameters And MV Host Integration |
| 6 | Update documentation and complete end-to-end verification. | Phases 1-5 | REQ-10 | Docs are scene-centered and verification covers default startup, scene play, failed load preservation, layout, and checks. | Slice 06: Scene Documentation And End-To-End Verification |

## Completion Contract

### Observable Truths

- [ ] OT-01: With default plugin parameters, enabling `R3DVisualStage` in an MV test host loads `scenes/r3d-validation-scene.r3dscene.json` and renders the validation character on the right side of the MV canvas.
- [ ] OT-02: `R3DStage Scene Play character Wave` plays the validation character's `Wave` animation without blocking MV gameplay.
- [ ] OT-03: Loading an invalid **R3D Scene File** logs a useful error and leaves the previous active scene visible.
- [ ] OT-04: The transparent **Visual Stage** canvas remains aligned with MV `Graphics._canvas` and does not intercept pointer input.

### Required Design Outcomes

- [ ] OUT-01: The runtime is scene-oriented and does not expose long-term `Character` commands or `window.R3DVisualStage.character`.
- [ ] OUT-02: Scene loading is transactional and only promotes fully loaded, validated scenes.
- [ ] OUT-03: Scene switching uses a root `THREE.Group` and explicit Three.js resource disposal.
- [ ] OUT-04: The first-version schema supports only camera, lights, flat models, optional fit, and initial animation.
- [ ] OUT-05: **Visual Stage** layout remains plugin-level right-side layout and is not encoded in camera config.

### Required Canonical Updates

- [ ] DOC-01: `CONTEXT.md` remains aligned with **Presentation Scene Definition** and **R3D Scene File** terminology.
- [ ] DOC-02: `src/mv-plugin-header.js` documents scene-oriented parameters and commands.
- [ ] DOC-03: Primary user documentation is scene-centered and no longer presents Character Display as the runtime core.
- [ ] DOC-04: Local validation instructions mention both the GLB model and `.r3dscene.json` scene file.

## Test Strategy

Unit-level tests should cover runtime validation of **Presentation Scene Definitions**, including missing `schemaVersion`, unsupported versions, invalid vectors, duplicate model IDs, unsupported light types, invalid scale, invalid fit origins, empty paths, and missing required camera/model fields.

Runtime tests should cover successful definition loading, successful path loading with mocked or controlled fetch, model-load failure preserving the active scene, validation failure preserving the active scene, explicit `play(modelId, clipName)`, missing model ID, missing clip, and per-model independent animation state.

Resource cleanup tests should verify that disposal traverses object trees and calls `dispose()` on geometries, materials, textures, and skeletons where present, and that mixers are stopped and uncached.

Integration or manual MV verification should cover default startup, scene commands, resize alignment, pointer pass-through, file logging in playtest, and the `chrome61` bundle target constraint.

Build-quality checks must include type checking, linting, formatting, and `npm run build`.

## Deferred Ideas

- General AssetManager or AssetRegistry with caching, reference counts, and shared resources.
- Fullscreen or rectangular **Visual Stage** layouts.
- Per-scene preferred layout and layout override precedence.
- Nested scene graph and reusable node hierarchies.
- **Visual Choreography** timelines, camera cuts, delays, and named actions.
- MV switch/variable/event-triggered scene behavior.
- VRM, MToon, expressions, LookAt, and spring bones.
- Draco, Meshopt, KTX2, and other optimized asset pipelines.
- Shadows, postprocessing, environment maps, and advanced lighting.
- Material overrides and outfit switching.

## Open Questions

None. This design is ready for slice planning.
