# R3D Visual Stage

R3D Visual Stage is a scene-oriented RPG Maker MV plugin that adds a bounded 3D visual presentation layer alongside MV's 2D tilemap gameplay.

The 2D tilemap remains authoritative for player movement, events, collision, object interaction, menus, and game state. The 3D layer is a presentation surface for 3D Character Displays, Presentation Scenes, cameras, lighting, and animation staging without replacing MV's map system.

## Direction

R3D Visual Stage targets RPG Maker MV games that remain fundamentally 2D tilemap RPGs while gaining a separate 3D visual stage for character-focused display and broader Presentation Scenes.

## Core Goals

- Render a persistent 3D visual layer alongside RPG Maker MV's 2D game view.
- Support 3D Character Display as a first-class product use case.
- Support bounded Presentation Scenes for character display, small sets, camera work, and short visual sequences.
- Support named Presentation Cameras, scene loading, and explicit camera switching.
- Support skeletal animation for authored animation clips.
- Explore outfit and appearance presentation without requiring full 3D gameplay interaction.
- Explore PBR and NPR rendering styles suitable for web delivery.
- Explore lightweight secondary motion, such as hair, cloth, accessory, or spring-bone style movement.
- Allow the 3D presentation layer to react to RPG Maker MV input, variables, events, or plugin commands.
- Prioritize web deployment and broad modern-browser compatibility.

## Runtime Target

R3D Visual Stage targets **RPG Maker MV only** for now.

The planned technical direction is:

- RPG Maker MV JavaScript plugin runtime.
- Three.js-backed 3D rendering.
- WebGL2-capable browsers as the rendering baseline.
- Modern web deployment as the primary compatibility target.

The project does not make a baseline promise for WebGL1 support.

## Asset Direction

The 3D asset pipeline is intentionally focused on Presentation Scene loading for current runtime work rather than a broad asset system.

Current implementation uses **GLB/glTF** assets loaded through `GLTFLoader`. `VRM` remains a deferred exploration path rather than a claimed baseline.

## Boundaries

R3D Visual Stage is not an official RPG Maker plugin.

It does not target RPG Maker Unite or Unity as its baseline runtime.

It is not intended to:

- Replace RPG Maker MV's 2D tilemap.
- Convert MV maps into full 3D gameplay spaces.
- Add 3D collision, pathfinding, or map-object interaction.
- Make a 3D actor the authoritative player character in the MV world.
- Provide a complete 3D RPG engine.

The intended boundary is a visual stage: a small, controlled 3D presentation layer that can respond to the MV game, but does not own the MV game world's simulation.

## Open Decisions

These decisions remain unresolved and should be validated through design exploration and prototypes:

- Primary asset format and model authoring workflow.
- PBR, NPR, or mixed rendering material strategy.
- Outfit and appearance strategy.
- Lightweight physics or secondary-motion approach.
- How visual choreography should be authored and triggered from MV.
- How small 3D presentation scenes should be loaded, staged, and released.
- How to structure the plugin build so Three.js can be used cleanly inside RPG Maker MV's plugin environment.

## Current Implementation

This repository now includes an implementation slice where **3D Character Display** is expressed through the **Presentation Scene** runtime:

- TypeScript source for a RPG Maker MV plugin.
- Vite library build output targeting a normal MV plugin JavaScript file.
- Three.js and `GLTFLoader` bundled into `R3DVisualStage.js`.
- A transparent right-side Visual Stage canvas that follows the MV game canvas and does not block pointer input.
- Scene-oriented public API at `window.R3DVisualStage.scene`.
- MV plugin commands for `R3DStage Scene Load`, `Show`, `Hide`, `Camera`, and `Play`.
- A local validation asset generator for a lightweight `Idle`/`Wave` validation character and a default character-display Presentation Scene file.
- A local-only copy flow for installing the built plugin, validation model, and validation scene into an external RPG Maker MV test host.

See `docs/r3d-presentation-scenes.md` for setup, build, copy, and manual verification steps.
