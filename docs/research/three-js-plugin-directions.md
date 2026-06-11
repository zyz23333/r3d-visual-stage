# Three.js Plugin Directions

This note records possible Three.js ecosystem directions for future R3D Visual
Stage work. These are candidate plugins and addons, not committed product
support.

R3D Visual Stage should stay within its current boundary: RPG Maker MV's 2D
tilemap remains authoritative for movement, events, collision, menus, and game
state. Three.js-backed features should support the Visual Stage, the 3D
Character Display, Presentation Scenes, and Visual Choreography.

## Asset Loading And Delivery

### Three.js `DRACOLoader`

`DRACOLoader` can load Draco-compressed glTF geometry.

Possible use:

- Reduce downloaded geometry size for real character assets.
- Support optimized GLB/glTF files during Real Character Asset Validation.
- Keep the existing `GLTFLoader` path while adding compressed-asset support.

Notes:

- Draco decoding adds client-side decode cost.
- Decoder files must be distributed with the MV plugin or copied into the MV
  host project.
- Compatibility must be verified inside RPG Maker MV 1.6.x playtest/NW.js.

### Three.js `KTX2Loader`

`KTX2Loader` can load KTX2/Basis compressed textures.

Possible use:

- Reduce texture memory and download size for web deployment.
- Improve realistic character and small-scene asset delivery.
- Support future PBR/NPR material validation with optimized textures.

Notes:

- KTX2 support depends on transcoder assets and browser/GPU capabilities.
- The current plugin target keeps old MV playtest compatibility in mind, so
  KTX2 should be treated as an optional optimized path with fallback assets.

### Meshopt Decoder

`GLTFLoader` can use Meshopt Decoder for glTF assets compressed with
`EXT_meshopt_compression`.

Possible use:

- Support another common glTF optimization pipeline.
- Keep real character GLB assets smaller without changing the runtime model
  abstraction.

Notes:

- This should be validated together with the actual asset export pipeline.
- The first implementation should fail gracefully when an optimized decoder is
  unavailable.

## Character Format And Humanoid Presentation

### `@pixiv/three-vrm`

`@pixiv/three-vrm` is a Three.js library for loading and rendering VRM
characters.

Possible use:

- Validate VRM as a humanoid character asset path.
- Explore MToon/NPR-style character materials.
- Explore expressions, LookAt, and spring-bone style secondary motion.
- Provide a stronger character-centric workflow than generic GLB alone.

Notes:

- VRM should not replace the current GLB validation path until it has been
  tested in RPG Maker MV playtest.
- It should start as a separate spike or optional loader backend.
- The spike should verify loading, animation, expressions, spring bones,
  disposal, bundle size, and MV runtime compatibility.

## Visual Choreography

### GSAP

GSAP can drive code-authored timelines for camera, model, light, and material
animation.

Possible use:

- Implement the first Visual Choreography runtime.
- Coordinate camera moves, character poses, animation timing, and short staged
  presentation sequences.
- Map MV plugin commands to named timelines or choreography presets.

Notes:

- Timeline lifetime must be tied to character and Presentation Scene lifetime.
- Timelines should be stopped or killed when models/scenes are unloaded.
- GSAP is a better early runtime candidate than a heavier visual authoring
  workflow because it can stay small and command-driven.

### Theatre.js

Theatre.js can provide visual animation authoring for Three.js scenes.

Possible use:

- Author camera, lighting, material, and prop animation for Presentation Scenes.
- Export choreography data for the runtime to play back.
- Support a future authoring workflow outside the MV runtime.

Notes:

- Theatre Studio should not be bundled into the normal RPG Maker MV runtime by
  default.
- R3D Visual Stage should define its own choreography concepts before depending
  on a tool-specific project format.
- This is more suitable after Presentation Scene and Visual Choreography needs
  are clearer.

## Presentation Scene Rendering

### Three.js Postprocessing Addons

Three.js postprocessing addons include `EffectComposer`, `RenderPass`,
`OutputPass`, `UnrealBloomPass`, `OutlinePass`, and related passes.

Possible use:

- Add controlled visual polish for Presentation Scenes.
- Support bloom, outlines, color correction, or other scene-specific effects.
- Improve readability of character or prop silhouettes when needed.

Notes:

- Postprocessing should be added carefully because the current Character Display
  is a transparent canvas layered over RPG Maker MV.
- Some effects may interact poorly with alpha compositing.
- Effects should be opt-in per Presentation Scene rather than always enabled
  for the persistent Character Display.

## Camera And Tooling

### `camera-controls`

`camera-controls` provides smooth camera controls for Three.js.

Possible use:

- Developer preview controls for framing characters and Presentation Scenes.
- Internal tooling for camera rig experiments.
- Debug-only inspection of small 3D stages.

Notes:

- The current Character Display canvas should not block MV input.
- Runtime player-facing camera control is not a current product goal.
- This is more useful for tooling than for the normal MV plugin runtime.

### Three.js `SkeletonUtils`

`SkeletonUtils` is useful for cloning animated skinned meshes.

Possible use:

- Clone loaded humanoid characters safely when multiple instances are needed.
- Support future outfit or preview workflows.
- Reuse animated assets without relying on plain `Object3D.clone()` behavior.

Notes:

- This should be introduced only when clone or multi-instance requirements
  appear.
- It is a small and natural fit because it is part of the Three.js addon set.

## Physics And Secondary Motion

### Rapier Or Other Physics Engines

Rapier and other physics engines can be integrated with Three.js, but they are
not a near-term fit for the core runtime.

Possible use:

- Future Presentation Scene props with controlled physical motion.
- Specialized visual-only effects if spring bones or procedural animation are
  insufficient.

Notes:

- R3D Visual Stage should not add 3D gameplay collision, pathfinding, or an
  authoritative 3D player actor.
- Character hair, cloth, and accessory motion should first be explored through
  VRM spring bones or lightweight procedural animation.
- A full physics engine should remain optional and scene-specific.

## Not Recommended For The MV Runtime

### React Three Fiber And Drei

React Three Fiber and Drei are useful in React applications, but they are not a
good fit for the RPG Maker MV plugin runtime.

Reason:

- The project currently builds an IIFE MV plugin, not a React app.
- Adding React and a reconciler would increase runtime complexity.
- These tools may be useful later for a separate web authoring tool, not for the
  bundled MV plugin.

### Full 3D Gameplay Or Editor Frameworks

Large ECS, map-editor, collision, navigation, or full-engine frameworks should
not be introduced unless the product boundary changes.

Reason:

- The Visual Stage is for presentation.
- RPG Maker MV's 2D tilemap remains authoritative.
- The project explicitly avoids becoming a complete 3D RPG engine.

## Suggested Evaluation Order

1. Add optional compressed glTF loading support with `DRACOLoader`,
   `KTX2Loader`, and Meshopt Decoder.
2. Validate a real redistributable humanoid GLB/glTF character.
3. Run a focused `@pixiv/three-vrm` spike for VRM, MToon, expressions, LookAt,
   and spring-bone behavior.
4. Prototype GSAP-backed Visual Choreography for camera, pose, and animation
   timing.
5. Add postprocessing only when Presentation Scenes need controlled visual
   polish.
6. Consider Theatre.js as an authoring workflow after the choreography data
   model is clearer.
