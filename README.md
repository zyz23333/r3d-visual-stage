# R3D Visual Stage

R3D Visual Stage is an early-stage project direction for a web-first RPG Maker MV plugin that adds a bounded 3D visual presentation layer alongside MV's 2D tilemap gameplay.

The project is not a usable plugin yet. This repository currently captures the intended product direction, runtime boundaries, and open design decisions before implementation is built out.

## Direction

R3D Visual Stage targets RPG Maker MV games that remain fundamentally 2D tilemap RPGs, while gaining a separate 3D visual stage for character and scene presentation.

The 2D tilemap remains authoritative for player movement, events, collision, object interaction, menus, and game state. The 3D layer is a presentation surface: it can show a persistent 3D character, stage small 3D scenes, coordinate camera movement, and drive animation choreography without replacing MV's map system.

## Core Goals

- Render a persistent 3D visual layer alongside RPG Maker MV's 2D game view.
- Support a commonly visible 3D character, such as a right-side character display.
- Support bounded 3D presentation scenes for character display, small sets, camera work, and short visual sequences.
- Support camera choreography, animation timing, poses, and staged visual direction.
- Support skeletal animation for character motion and authored animation clips.
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

The 3D asset pipeline is intentionally unresolved at this stage.

Candidate formats include:

- **GLB/glTF** as a general-purpose Web 3D asset path.
- **VRM** as a possible path for humanoid characters, expressions, NPR-style materials, and spring-bone style secondary motion.

The project should not claim support for either format until the first implementation validates loading, animation, rendering quality, and web compatibility.

## Boundaries

R3D Visual Stage is not an official RPG Maker plugin.

It does not target RPG Maker Unite or Unity as its baseline runtime.

It is not intended to:

- Replace RPG Maker MV's 2D tilemap.
- Convert MV maps into full 3D gameplay spaces.
- Add 3D collision, pathfinding, or map-object interaction.
- Make the 3D character the authoritative player actor in the MV world.
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

This repository now includes the first implementation slice for the **3D Character Display** direction:

- TypeScript source for a RPG Maker MV plugin.
- Vite library build output targeting a normal MV plugin JavaScript file.
- Three.js and `GLTFLoader` bundled into `R3DVisualStage.js`.
- A transparent right-side character display canvas that follows the MV game canvas and does not block pointer input.
- MV plugin commands for `R3DStage Character Show`, `Hide`, `Load`, and `Play`.
- A local validation GLB generator for a lightweight `Idle`/`Wave` character.
- A local-only copy flow for installing the built plugin and model into an external RPG Maker MV test host.

See `docs/r3d-character-display.md` for setup, build, copy, and manual verification steps.
