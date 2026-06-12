# Presentation Scene Runtime Design

## Status

Ready for slice planning

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
- Load `.r3dscene.json` **R3D Scene Files** from RPG Maker MV project-root-relative paths.
- Support JS API loading from both a path and an in-memory definition.
- Replace long-term `Character` plugin commands and public API with `Scene` commands and API.
- Preserve the current visible **Presentation Scene** when a new scene fails to load.
- Reuse one renderer, canvas, and Three.js scene across scene switches.
- Represent the active **Presentation Scene** as a replaceable root `THREE.Group`.
- Support first-version scene content: named **Presentation Cameras**, one active camera selection, flat models, lights, and initial model animation.
- Keep the existing right-side **Visual Stage** layout as the default plugin-level layout.
- Update validation assets and documentation so the default startup path validates scene loading, not just GLB loading.

## Non-Goals

- No general AssetManager, AssetRegistry, or cross-scene asset cache.
- No nested Unity-like scene graph.
- No scripting, components, physics, gameplay collision, pathfinding, or authoritative 3D actor.
- No **Visual Choreography** timeline, camera cuts, camera blending, delays, MV switch/variable triggers, or animation sequences.
- No VRM, MToon, expressions, LookAt, spring bones, KTX2, Draco, Meshopt, or postprocessing.
- No shadow rendering or shadow authoring parameters.
- No Unity-style camera depth, camera stacking, viewport rects, render targets, camera components, simultaneous multi-camera rendering, or camera blending in this version.
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

The runtime keeps one renderer, one DOM canvas, and one Three.js scene alive for the plugin lifetime. Each loaded **Presentation Scene** is built into a pending root `THREE.Group`. The pending root is atomically swapped into the Three.js scene only after the **R3D Scene File** is loaded, parsed, validated, and all referenced GLB/glTF models load successfully. Failed scene loads log errors, dispose pending resources, and leave the current active scene visible.

The right-side **Visual Stage** layout remains the only implemented layout. Layout is plugin configuration, not camera configuration and not part of the first-version **Presentation Scene Definition** schema.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |
| REQ-01 | Public API is `window.R3DVisualStage.character`. | Public API is `window.R3DVisualStage.scene`. | API supports `load(path)`, `loadDefinition(definition)`, `show()`, `hide()`, `setCamera(cameraId)`, `play(modelId, clipName)`, and `dispose()`. |
| REQ-02 | MV commands use `R3DStage Character ...`. | MV commands use `R3DStage Scene ...`. | `R3DStage Scene Load <path>`, `R3DStage Scene Show`, `R3DStage Scene Hide`, `R3DStage Scene Camera <cameraId>`, and `R3DStage Scene Play <modelId> <clipName>` route to the scene runtime. |
| REQ-03 | Startup loads `Default Character Path`. | Startup loads `Default Scene Path`. | With defaults, enabling the plugin auto-loads and renders the validation **R3D Scene File**. |
| REQ-04 | Validation asset is only a GLB model. | Validation includes a GLB model and `.r3dscene.json` scene file. | Build/generation flow produces both files under `public/`, and copy/enable scripts install both into the MV host. |
| REQ-05 | One model is loaded directly into the Three.js scene. | A complete pending `THREE.Group` is built before active scene replacement. | A failed JSON parse, validation error, or GLB load failure leaves the current active scene visible. |
| REQ-06 | `CharacterDisplay` owns fixed camera, fixed lights, and one mixer. | Scene definitions own named **Presentation Cameras**, one active camera selection, lights, flat models, and per-model animation state. | Multiple model entries can load into one active scene; each model can play animation independently by `modelId`; the active camera can switch by `cameraId`. |
| REQ-07 | Model fit is always character-specific. | Model fit is optional per model. | Models without `fit` keep loaded dimensions plus declared transform; models with `fit` are resized by `height` and `origin`. |
| REQ-08 | DOM layout is named character display width. | DOM layout is Visual Stage layout. | Config uses `Stage Placement = right` and `Stage Width = 280`; layout remains right-side only for this change. |
| REQ-09 | Resource cleanup disposes geometry/material and stops mixer. | Scene cleanup disposes object-tree GPU resources more completely. | Cleanup disposes unique geometries, materials, material textures, ImageBitmap-backed texture images, skeletons where present, stops mixers, uncaches mixer roots, and removes root references. |
| REQ-10 | Documentation is centered on Character Display. | Documentation is centered on Presentation Scenes. | Primary docs describe **R3D Scene Files**, scene commands, scene API, validation scene, and known limits. |

## Locked Decisions

- The change slug is `presentation-scene-runtime`.
- **Presentation Scene Definition** is the canonical term; avoid "Unity-like scene".
- **R3D Scene File** is the canonical term for `.r3dscene.json`.
- First-version **R3D Scene Files** must explicitly use `schemaVersion: 1`.
- Only `schemaVersion === 1` is accepted.
- First-version **R3D Scene Files** are strict JSON parsed with native `JSON.parse`; comments, trailing commas, JSONC, and JSON5 are not supported at runtime.
- First-version validation uses a TypeScript runtime validator as the executable source of truth; no JSON Schema artifact is produced in this change.
- First-version scene content is named **Presentation Cameras**, one active camera selection, lights, flat models, and initial animation.
- **Presentation Camera** IDs and model IDs are each unique within their own namespace. Cross-type ID reuse is allowed but discouraged.
- Light IDs are optional. When present, they must be unique within `lights`; diagnostics fall back to `lights[index]` when a light has no ID.
- First-version `models` may be omitted or empty, but the generated validation scene must include at least one GLB model so the default validation path still proves model loading, disposal, and animation behavior.
- First-version `lights` may be omitted or empty. The runtime does not inject fallback lights; the generated validation scene must declare lights explicitly.
- No nested scene graph, scripting, physics, collision, or timeline.
- No AssetManager or AssetRegistry in this change.
- **R3D Scene File** JSON loading uses a small RPG Maker MV-compatible `XMLHttpRequest` text loader modeled after `DataManager.loadDataFile`.
- GLB/glTF loading uses `GLTFLoader` directly.
- Runtime reuses one renderer, canvas, and Three.js scene.
- Active **Presentation Scene** is represented by one root `THREE.Group`.
- New scene loads are transactional and atomically swap only after full preload succeeds.
- Failed loads preserve the current active scene.
- Concurrent scene loads use latest-load-wins semantics: only the most recently started load may promote, and older pending loads must dispose their pending resources when they complete.
- Scene disposal deduplicates owned geometries, materials, textures, and skeletons before disposal and best-effort closes ImageBitmap-backed texture image data.
- Scene command/API animation playback requires `modelId + clipName`.
- Scene command/API camera switching requires `cameraId` and performs an instant active-camera switch with no blending.
- Each model owns independent animation mixer/action state.
- A missing declared initial animation is non-fatal: the scene may still promote, the affected model remains static, and diagnostics list available clips.
- Coordinates use Three.js-style world units.
- Vector arrays use Three.js `[x, y, z]` order in a Y-up world. Rotations use Three.js Euler radians with default `XYZ` order.
- **Presentation Camera** `target` is a Three.js world-space look-at point.
- First-version scene definitions do not map RPG Maker MV tile coordinates, screen coordinates, or named directions into 3D coordinates.
- Layout is plugin-level **Visual Stage** configuration, not camera config and not part of first-version scene schema.
- First-version layout supports `Stage Placement = right` and `Stage Width = 280`.
- First-version **Presentation Cameras** do not support camera depth, camera stacking, viewport rects, render targets, camera components, simultaneous multi-camera rendering, animation, or blending.
- First-version **Presentation Cameras** are perspective cameras only. The schema does not require a `type` field; missing `type` means perspective. Orthographic cameras are deferred.
- Lights support ambient, hemisphere, directional, and point.
- First-version color fields accept only CSS hex strings in `#rgb` or `#rrggbb` form.
- Shadows are out of scope.
- Model `fit` is optional; no `fit` means preserve loaded dimensions and apply declared transform.
- `fit` is the canonical first-version field name for optional model-space normalization before declared transform; it is not screen fitting, camera framing, or **Visual Stage** layout.
- `fit.height` scales by the loaded model bounding box's Y-axis size, not by the model's longest axis.
- `fit.origin` supports `center` and `center-bottom`.
- First-version model `scale` is an optional positive finite number for uniform scale only; non-uniform vector scale is out of scope.
- The default startup path uses `Default Scene Path` and generated validation scene JSON.
- First-version **R3D Scene File** paths and model asset paths are RPG Maker MV project-root-relative paths, including model paths inside definitions passed to `loadDefinition(definition)`.
- First-version **R3D Scene Files** do not support scene-file-relative asset paths or an `assetBasePath` field.
- The default **R3D Scene File** directory is `scenes/`, not RPG Maker MV's `data/` database directory.
- **Visual Stage** visibility is separate from active **Presentation Scene** lifetime: `hide()` hides the canvas without disposing the active scene, `show()` reveals the current active scene, and successful scene loads automatically show the canvas.
- Failed or stale scene loads never change **Visual Stage** visibility.
- `dispose()` is a terminal runtime lifecycle operation. Repeated `dispose()` calls are no-ops; other API calls after disposal fail or no-op with diagnostics.
- The project is early; explicitly remove the old `Character` API and `R3DStage Character ...` commands instead of preserving compatibility wrappers.

## Agent Discretion

- Exact module names may vary if they preserve the locked boundaries. Acceptable names include `VisualStageRuntime`, `PresentationSceneRuntime`, `presentationSceneDefinition`, `sceneValidation`, and `sceneDisposal`.
- The validator may return structured errors or throw typed errors, as long as caller behavior and logs remain clear. Validation errors should include a path, message, and reason where practical.
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
- A stale scene load must never replace, dispose, hide, or mutate the latest active scene.
- A failed or stale scene load must never mutate the active **Presentation Camera** selection or camera objects.
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
- active camera reference selected from the active scene's named **Presentation Cameras**
- one active root `THREE.Group`
- target FPS throttling
- render/update loop
- active-scene disposal

The **Presentation Scene** loading path is transactional:

1. Resolve and load the **R3D Scene File** JSON text from an RPG Maker MV project-root-relative path with an MV-compatible `XMLHttpRequest` text loader, or accept an in-memory definition whose asset paths are also RPG Maker MV project-root-relative.
2. Parse loaded JSON text when loading from a path.
3. Validate the definition at runtime.
4. Create a pending `THREE.Group`.
5. Build pending **Presentation Cameras** and validate the pending active camera selection.
6. Build pending lights from the definition; scenes with no lights are valid and receive no runtime fallback lights.
7. Build pending model entries by loading each declared GLB/glTF through `GLTFLoader`; scenes with no models are valid and skip this step.
8. Apply optional fit and declared transforms.
9. Create one `AnimationMixer` per model that has animation clips.
10. Start each model's initial animation when declared and found.
11. If all pending work succeeds and this load is still the latest load token, promote the pending root, pending camera map, pending active camera ID, and pending model records, then dispose the previous active scene.
12. If all pending work succeeds but this load token is stale, dispose pending resources, return `false`, and preserve the active scene.
13. If any pending work fails, dispose pending resources and preserve the active root.

The first-version **Presentation Scene Definition** shape is intentionally flat:

```json
{
  "schemaVersion": 1,
  "id": "r3d-validation-scene",
  "cameras": [
    {
      "id": "portrait",
      "position": [0, 1.35, 4.5],
      "target": [0, 1.1, 0],
      "fov": 30,
      "near": 0.1,
      "far": 100
    }
  ],
  "activeCamera": "portrait",
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

The schema shown here is authoritative for design intent but not a full JSON Schema artifact. First-version validation is implemented as a TypeScript runtime validator, and no `.schema.json` artifact is produced in this change. The validator is the executable source of truth for runtime acceptance. Validation diagnostics should be structured enough to support future editor tooling, including a path, message, and reason where practical. Implementation agents may refine TypeScript type names and validator internals without changing behavior.

All `path` values in first-version scene definitions are RPG Maker MV project-root-relative paths. A model path such as `models/r3d-validation-character.glb` resolves the same way whether the definition came from `scene.load("scenes/example.r3dscene.json")` or `scene.loadDefinition(definition)`. Scene-file-relative model paths, `assetBasePath`, and package-relative asset resolution are deferred. The default **R3D Scene File** location remains `scenes/` because scene files are plugin-owned Visual Stage authoring assets, not RPG Maker MV database records under `data/`.

First-version **Presentation Cameras** are perspective cameras. A camera entry supports `id`, `position`, `target`, `fov`, and optional `near`/`far`. Missing `near` defaults to `0.1`; missing `far` defaults to `100`. The schema does not require `type`; missing `type` means perspective. If `type` is present in first-version files, only `"perspective"` is accepted. Orthographic cameras and camera-type-specific schema branches are deferred.

IDs are namespaced by scene entry type. **Presentation Camera** IDs must be unique within `cameras`, and model IDs must be unique within `models`. `activeCamera` must reference an existing **Presentation Camera** ID. A camera and model may technically share the same string ID because commands and APIs are type-specific, but authors should avoid cross-type reuse to keep diagnostics and future choreography references clear.

Numeric validation rejects `NaN`, `Infinity`, string numbers, `null`, and non-number values. Vector fields must be arrays of exactly three finite numbers. Perspective camera `fov` is measured in degrees and must satisfy `1 <= fov < 180`; values above `120` are accepted but should log a warning because they can produce extreme perspective distortion. `near` must be positive and `far` must be greater than `near`. `position`, `target`, and `rotation` vectors have no hard range beyond finite numbers. Character-display-style **Presentation Cameras** should usually use a narrower `fov` around `20` to `45`.

Light IDs are optional in first-version scene definitions because there is no light control API yet. If a light provides `id`, that ID must be unique within the `lights` array. Light IDs do not share a namespace with cameras or models. Diagnostics should use a light ID when available and otherwise identify the entry by array position, such as `lights[1]`.

Light `intensity` values must be finite numbers greater than or equal to `0`. The first-version validator does not impose a hard upper bound because useful intensity ranges depend on material content and lighting setup.

First-version color fields accept only CSS hex strings in `#rgb` or `#rrggbb` form. Numeric color values, named colors, `rgb(...)`, `rgba(...)`, `hsl(...)`, and other CSS color syntaxes are not accepted. Ambient, directional, and point lights require `color`; hemisphere lights require `skyColor` and `groundColor`.

`models` may be omitted or empty in first-version scene definitions. This allows camera-only or light-only staging scenes and keeps the **Presentation Scene** concept broader than character display. The generated validation scene must still include at least one GLB model so default startup continues to validate model loading, model disposal, and animation playback behavior.

`lights` may be omitted or empty in first-version scene definitions. Lighting is owned by the **Presentation Scene Definition**, and the runtime must not inject hidden fallback lights. A model using ordinary lit materials may appear dark or black when no lights are declared. The generated validation scene must declare lights explicitly so default startup remains visually useful.

Promotion order must favor visible continuity over minimum peak memory. Once a pending scene is fully built and still has the latest load token, the runtime should save the old active state, add the pending root to the long-lived `THREE.Scene`, replace active state references to the pending root, camera map, active camera ID, and model records, show the **Visual Stage** canvas, remove the old root from the Three.js scene graph, and then dispose the old active state. Non-fatal cleanup warnings while disposing the old state must not roll back the newly promoted scene.

Scene vectors use Three.js coordinate conventions directly. Arrays are `[x, y, z]`, the world is Y-up, camera `target` is a world-space look-at point, and model `rotation` uses Three.js Euler radians with default `XYZ` order. First-version scene files do not translate RPG Maker MV tile coordinates, screen coordinates, or named directions into Three.js coordinates. A typical character display places the model on the y=0 ground plane and places a **Presentation Camera** on +Z looking back toward the model.

Model `fit` is an optional model-space normalization step applied before declared transform. It exists because GLB/glTF files from different sources often use inconsistent real-world scale and local origins. `fit` is not screen fitting, camera framing, or **Visual Stage** layout. Without `fit`, loaded GLB dimensions and local origin are preserved, and only declared transform is applied.

With `fit`, the model's bounding box is used to scale and align the loaded model before declared transform. `fit.height` scales by the bounding box's Y-axis size, so a requested height of `2.4` means the fitted model is `2.4` Three.js world units tall before declared `scale` is applied. It does not scale by the model's longest axis. If the bounding box Y size is zero or too close to zero to calculate a stable scale, the scene load must fail as an impossible fit calculation and preserve the active scene.

`fit.origin = "center"` aligns the fitted bounding box center to the model local origin. `fit.origin = "center-bottom"` aligns the fitted bounding box X/Z center and Y minimum to the model local origin, which lets `position: [0, 0, 0]` mean that the model stands on the scene origin. Declared `position`, `rotation`, and `scale` are then applied after `fit`; therefore final visible height is `fit.height * declaredScale` when declared scale is a number.

First-version model `scale` is optional and defaults to `1`. It must be a positive finite number and represents uniform scale only. The validator must reject zero, negative, `NaN`, `Infinity`, arrays, and objects. Non-uniform vector scale such as `[1, 1.2, 1]` is deferred because it complicates skinned meshes, normals, animation expectations, and future attachment semantics.

`fit.height`, when present, must be a positive finite number.

Scene playback uses explicit model IDs. `scene.play("character", "Wave")` looks up the active model entry by ID, finds the clip by exact case-sensitive name, fades in the requested action, fades out that model's previous action, and returns `false` with a warning when the model or clip is missing. First-version animation lookup does not use fuzzy, substring, or case-insensitive matching.

Scene camera switching uses explicit **Presentation Camera** IDs. `scene.setCamera("closeup")` looks up the active scene's camera map, switches the active camera ID immediately when found, and returns `false` with a warning when the camera ID is missing. The render loop always renders the active root through the current active camera. Layout updates apply the current viewport aspect to all active scene cameras or, at minimum, to the current active camera before rendering.

Initial model animation is best-effort. A declared `animation` value that does not exactly match an available clip must log a warning with the model ID, requested clip, and available clips, but it must not fail the whole scene load. The model should remain visible in its loaded/static pose. Structural failures such as invalid scene definitions, missing required fields, failed model asset loads, unsupported light types, or impossible fit calculations still fail the scene transaction.

Resource disposal must traverse a root object tree and release owned GPU resources. It must collect unique geometries, materials, textures reachable from material properties, and skeletons where present before disposal so shared resources inside one loaded scene are not disposed repeatedly. Each unique texture must receive `texture.dispose()`. If `texture.source?.data?.close` or `texture.image?.close` exists, disposal should call it as a best-effort ImageBitmap cleanup step; close failures should log warnings but must not interrupt scene cleanup. Disposal must stop all mixers for the root and uncache their roots. It must then sever references to model records, clip maps, actions, cameras, and the active root. `renderer.dispose()` is reserved for plugin teardown, not scene switching.

`DomLayer` should be renamed or generalized around **Visual Stage** layout. The first version still computes a right-side canvas based on MV `Graphics._canvas`, `Stage Width`, and browser scaling. It must keep `pointer-events: none`, transparent background, and placement above MV canvases.

## Conditional Modules

### UX / Product Behavior

The plugin's default user-visible behavior changes from "show a character from a GLB path" to "load a validation **R3D Scene File**." On first enable with defaults, the user should still see the validation character on the right side of the MV canvas.

The MV plugin command surface becomes:

```text
R3DStage Scene Load scenes/r3d-validation-scene.r3dscene.json
R3DStage Scene Show
R3DStage Scene Hide
R3DStage Scene Camera portrait
R3DStage Scene Play character Wave
```

The command surface does not support inline JSON. Long-form scene authoring belongs in `.r3dscene.json` files.

### Domain Model

**Presentation Scene Definition** is the source document for bounded visual staging content. An **R3D Scene File** stores one **Presentation Scene Definition**. A **Presentation Scene** can include named **Presentation Cameras**, lights, models, and initial animation, but does not define 3D gameplay.

**Visual Stage** layout is distinct from **Presentation Camera** configuration. The active **Presentation Camera** controls composition inside the rendered 3D view. Layout controls where the transparent WebGL canvas appears relative to the MV canvas.

### API / Contract Changes

The public API target is:

```ts
window.R3DVisualStage.scene.load(path: string): Promise<boolean>;
window.R3DVisualStage.scene.loadDefinition(definition: unknown): Promise<boolean>;
window.R3DVisualStage.scene.show(): void;
window.R3DVisualStage.scene.hide(): void;
window.R3DVisualStage.scene.setCamera(cameraId: string): boolean;
window.R3DVisualStage.scene.play(modelId: string, clipName: string): boolean;
window.R3DVisualStage.dispose(): void;
```

`load(path)` treats `path` as RPG Maker MV project-root-relative. `loadDefinition(definition)` treats all model paths inside the definition as RPG Maker MV project-root-relative because there is no scene file location to use as a base.

`load` and `loadDefinition` should resolve to `true` only when the scene is active after a successful atomic switch. They should resolve to `false` for handled validation or asset-load failures after logging diagnostics. Unexpected programmer errors may still reject if not safely recoverable, but plugin command routing should not let them stop MV's game loop.

`load(path)` should load `.r3dscene.json` with a small RPG Maker MV-compatible `XMLHttpRequest` text loader modeled after `DataManager.loadDataFile`: `GET` the project-root-relative path, override MIME type to `application/json` where available, return response text for status `< 400`, and treat request errors or non-success statuses as scene definition load failures. The runtime should then call `JSON.parse` itself so diagnostics can distinguish scene file load failure, JSON parse failure, and scene validation failure. This loader is only for **R3D Scene Files**; GLB/glTF model assets continue to use Three.js `GLTFLoader`.

**R3D Scene Files** are strict JSON files. Runtime parsing uses native `JSON.parse` only. Comments, trailing commas, JSONC, and JSON5 are not accepted in first-version runtime files. Future authoring tools may preprocess friendlier formats into strict `.r3dscene.json`, but the runtime contract remains strict JSON.

Successful `load` and `loadDefinition` calls automatically show the **Visual Stage** canvas. `hide()` only hides the canvas; it does not stop mixers, dispose resources, or clear the active scene. `show()` reveals the current active scene. If no active scene exists, `show()` may reveal an empty transparent **Visual Stage** and should log a low-severity diagnostic rather than loading a default scene implicitly.

`setCamera(cameraId)` switches the active scene's **Presentation Camera** immediately and returns `true` when the camera exists. Missing camera IDs return `false` and log the requested ID plus available camera IDs. First-version camera switching is instantaneous; camera animation, camera cuts as timeline events, and camera blending are deferred to **Visual Choreography**.

`dispose()` is terminal for a runtime instance. After disposal, the runtime should mark itself disposed, dispose the active scene and renderer, remove the canvas, and reject further use without trying to recreate renderer or DOM state. Repeated `dispose()` calls are no-ops. Calls to `load` and `loadDefinition` after disposal should resolve `false` with diagnostics. Calls to `play` and `setCamera` should return `false`. Calls to `show` and `hide` should no-op with low-severity diagnostics.

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

Scene loading must be treated as a transaction. The active scene remains authoritative until a pending scene has fully loaded and is still the latest requested load. Multiple `load` and `loadDefinition` calls use latest-load-wins semantics backed by a monotonically increasing load token. Only the most recently started load token may promote a pending scene. Older pending loads may continue in the background because `XMLHttpRequest` scene text loading and `GLTFLoader` model loading do not provide a shared full-chain abort boundary in this design; when they complete, they must dispose pending resources, return `false`, and leave active scene state, active **Presentation Camera** state, and visibility untouched.

`hide()` hides the **Visual Stage** canvas but does not dispose the active scene. `show()` reveals the current active scene without reloading assets. Plugin teardown through `dispose()` must dispose the active scene and renderer.

Failed `load` and `loadDefinition` calls must not change **Visual Stage** visibility. If a failed load began while a valid scene was visible, that scene remains visible. If it began while the **Visual Stage** was hidden or no active scene existed, the canvas remains hidden unless the caller separately invokes `show()`.

### Frontend State / Interaction Model

The transparent canvas must continue following MV `Graphics._canvas` layout on resize and playtest window changes. Layout updates should continue to happen during the render loop before renderer size and active camera aspect are updated.

The existing MV `ok` input demo behavior should not remain as a hidden scene feature unless it is explicitly re-expressed as documented scene command behavior. First-version scene animation should be driven by initial animation and explicit `Scene Play`.

### Observability / Operations

Diagnostics should identify scene-loading milestones and failure causes:

- plugin installed
- scene load started
- scene definition loaded
- scene definition validation failed
- model load started
- model load failed
- scene promoted
- first layout ready
- first render completed

File logging remains NW.js-only and should continue serializing useful error details. Diagnostics should include scene ID, path, model IDs, camera IDs, missing clip names, missing camera IDs, and available clips/cameras where relevant.

### Research / Dependency Findings

Three.js 0.184.0 `Group` is a semantic `Object3D` container. It is appropriate for an active **Presentation Scene** root, but removing it from the scene graph does not release GPU resources.

`BufferGeometry.dispose()`, `Material.dispose()`, and `Texture.dispose()` dispatch dispose events consumed by the renderer. Material disposal does not automatically dispose textures referenced by the material. `GLTFLoader` may use `ImageBitmapLoader`, whose image bitmaps require explicit close handling beyond normal JavaScript garbage collection. `WebGLRenderer.dispose()` releases renderer-owned GPU resources and removes context listeners, so it should only run when the plugin is no longer used, not on every scene switch.

RPG Maker MV core scripts load database JSON with `DataManager.loadDataFile`, which uses `XMLHttpRequest`, `overrideMimeType('application/json')`, `JSON.parse(xhr.responseText)`, and project-local paths under `data/`. **R3D Scene File** loading follows the same conservative browser-era loading style for JSON text, while keeping GLB/glTF asset loading on Three.js `GLTFLoader`. This does not make R3D scene files part of the MV database; they remain under the plugin-owned `scenes/` directory by default.

### Rollout / Migration / Cleanup

Because the project has no external users yet, this change may replace `Character` public API and MV commands rather than maintain compatibility wrappers. Documentation and plugin help text must stop advertising `R3DStage Character ...`.

The old `docs/r3d-character-display.md` should be replaced or superseded by scene-centered documentation, likely `docs/r3d-presentation-scenes.md`. Any package formatting script must be updated to include the new docs path.

## Phase Slices

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish the first-version **Presentation Scene Definition** contract and runtime validator. | None | REQ-04, REQ-05 | Types, validation behavior, and test infrastructure exist; invalid definitions fail before runtime mutation. | Slice 01: Scene Definition Contract And Validation |
| 2 | Generate a default validation **R3D Scene File** that exercises the schema. | Phase 1 | REQ-03, REQ-04 | `public/scenes/r3d-validation-scene.r3dscene.json` is generated and validates against schema v1. | Slice 02: Validation Scene Asset Flow |
| 3 | Extract reusable Three.js scene build, fit, animation lookup, and disposal helpers. | Phase 1 | REQ-05, REQ-07, REQ-09 | Resource disposal, ImageBitmap cleanup, exact clip lookup, and model fit behavior are tested before runtime integration. | Slice 03: Scene Resource Disposal And Build Helpers |
| 4 | Build the long-lived **Visual Stage** runtime and transactional active-scene switching from in-memory definitions. | Phases 1, 3 | REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 | Renderer/canvas/scene are reused; active root and active **Presentation Camera** state swap atomically; resources are explicitly disposed. | Slice 04: Visual Stage Runtime Core |
| 5 | Replace public control with scene-oriented API, MV commands, and path-based **R3D Scene File** loading. | Phase 4 | REQ-01, REQ-02, REQ-03 | `window.R3DVisualStage.scene` and `R3DStage Scene ...` work; XHR scene file loading works; old `character` API and `R3DStage Character ...` commands are removed. | Slice 05: Scene Path Loading And Public Control Surface |
| 6 | Migrate plugin parameters and local MV host integration to scene defaults. | Phases 2, 5 | REQ-03, REQ-04, REQ-08 | Defaults load the generated scene file; copy/enable scripts install scene JSON and scene-oriented plugin parameters. | Slice 06: Plugin Parameters And MV Host Integration |
| 7 | Update documentation and complete end-to-end verification. | Phases 1-6 | REQ-10 | Docs are scene-centered and verification covers default startup, scene play, camera switching, failed load preservation, layout, and checks. | Slice 07: Scene Documentation And End-To-End Verification |

## Completion Contract

### Observable Truths

- [ ] OT-01: With default plugin parameters, enabling `R3DVisualStage` in an MV test host loads `scenes/r3d-validation-scene.r3dscene.json` and renders the validation character on the right side of the MV canvas.
- [ ] OT-02: `R3DStage Scene Play character Wave` plays the validation character's `Wave` animation without blocking MV gameplay.
- [ ] OT-03: `R3DStage Scene Camera portrait` switches to the named **Presentation Camera** without blocking MV gameplay.
- [ ] OT-04: Loading an invalid **R3D Scene File** logs a useful error and leaves the previous active scene and active **Presentation Camera** visible.
- [ ] OT-05: The transparent **Visual Stage** canvas remains aligned with MV `Graphics._canvas` and does not intercept pointer input.

### Required Design Outcomes

- [ ] OUT-01: The runtime is scene-oriented and does not expose long-term `Character` commands or `window.R3DVisualStage.character`.
- [ ] OUT-02: Scene loading is transactional and only promotes fully loaded, validated scenes.
- [ ] OUT-03: Scene switching uses a root `THREE.Group` and explicit Three.js resource disposal.
- [ ] OUT-04: The first-version schema supports only named **Presentation Cameras**, one active camera selection, lights, flat models, optional fit, and initial animation.
- [ ] OUT-05: **Visual Stage** layout remains plugin-level right-side layout and is not encoded in **Presentation Camera** config.

### Required Canonical Updates

- [ ] DOC-01: `CONTEXT.md` remains aligned with **Presentation Scene Definition** and **R3D Scene File** terminology.
- [ ] DOC-02: `src/mv-plugin-header.js` documents scene-oriented parameters and commands.
- [ ] DOC-03: Primary user documentation is scene-centered and no longer presents Character Display as the runtime core.
- [ ] DOC-04: Local validation instructions mention both the GLB model and `.r3dscene.json` scene file.

## Test Strategy

Unit-level tests should cover runtime validation of **Presentation Scene Definitions**, including missing `schemaVersion`, unsupported versions, invalid vectors, duplicate camera IDs, duplicate model IDs, missing or invalid `activeCamera`, invalid camera `fov`/`near`/`far`, high-`fov` warnings, unsupported light types, invalid light intensity, invalid light color fields, invalid scale values and vector scale rejection, invalid fit origins, invalid fit heights, empty paths, missing required camera fields, and omitted or empty `models`.

Runtime tests should cover successful definition loading, successful path loading with mocked or controlled scene text loading, model-load failure preserving the active scene and active **Presentation Camera**, validation failure preserving the active scene and active **Presentation Camera**, stale load completion preserving the latest active scene, explicit `setCamera(cameraId)`, missing camera ID, explicit `play(modelId, clipName)`, missing model ID, missing clip, and per-model independent animation state.

Resource cleanup tests should verify that disposal traverses object trees, deduplicates shared resources, calls `dispose()` on geometries, materials, textures, and skeletons where present, best-effort closes ImageBitmap-backed texture data, and stops and uncaches mixers.

Integration or manual MV verification should cover default startup, scene commands, camera switching, resize alignment, pointer pass-through, file logging in playtest, and the `chrome61` bundle target constraint.

Build-quality checks must include type checking, linting, formatting, and `npm run build`.

## Deferred Ideas

- General AssetManager or AssetRegistry with caching, reference counts, and shared resources.
- Fullscreen or rectangular **Visual Stage** layouts.
- Per-scene preferred layout and layout override precedence.
- Scene-file-relative asset paths, `assetBasePath`, or portable scene packages.
- JSON Schema artifacts, generated validators, IDE completion schemas, or external scene editor integration.
- Runtime support for JSONC, JSON5, comments, or trailing commas in **R3D Scene Files**.
- Orthographic **Presentation Cameras** and camera-type-specific schema branches.
- Nested scene graph and reusable node hierarchies.
- **Visual Choreography** timelines, camera cuts, camera blending, delays, and named actions.
- Unity-style camera depth, camera stacking, viewport rects, render targets, camera components, and simultaneous multi-camera rendering.
- MV switch/variable/event-triggered scene behavior.
- VRM, MToon, expressions, LookAt, and spring bones.
- Draco, Meshopt, KTX2, and other optimized asset pipelines.
- Shadows, postprocessing, environment maps, and advanced lighting.
- Material overrides and outfit switching.

## Open Questions

Resolved during the grilling session. This design is ready for slice planning.
