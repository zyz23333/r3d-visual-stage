# R3D Character Overlay Demo PRD

## Change Slug

`r3d-character-overlay-demo`

## Problem Statement

R3D Visual Stage currently has a product direction but no runnable proof that an RPG Maker MV game can host a web-delivered **3D Character Overlay** beside the authoritative **2D Tilemap**. The first demo must validate the smallest useful vertical slice: a 3D character can be rendered, animated, shown or hidden from RPG Maker MV, and driven by MV input without becoming a 3D gameplay actor.

This PRD defines the first demo scope only. Decisions in this document are not project-wide commitments unless later promoted into the README, `CONTEXT.md`, or an ADR. GLB-first, PBR-first, fixed right-side overlay, no outfit switching, no runtime secondary motion, and no **Presentation Scene** are demo boundaries, not permanent product constraints.

## Solution

Build a web-first RPG Maker MV plugin demo that renders one persistent right-side **3D Character Overlay** over or beside the MV game view. The demo will use a TypeScript-authored plugin bundle, Three.js-backed rendering, one externally loaded GLB/glTF character asset, basic PBR rendering, skeletal animation playback, minimal MV plugin commands, and small MV input-triggered visual reactions.

The demo succeeds only when it runs inside a local RPG Maker MV test host and also works from MV Web deployment served over a local HTTP server in a modern desktop browser.

## User Stories

1. As a plugin developer, I want a minimal RPG Maker MV demo plugin, so that I can prove the **Visual Stage** concept works before designing broader product capabilities.
2. As a plugin developer, I want the demo to render a persistent **3D Character Overlay** beside the **2D Tilemap**, so that I can verify MV's 2D gameplay view remains authoritative while 3D presentation is layered alongside it.
3. As a plugin developer, I want the demo to load a GLB/glTF character from the MV project resource path, so that I can validate web-safe model delivery without relying on remote assets.
4. As a plugin developer, I want the demo to play a character idle animation, so that I can verify skeletal animation and render loop integration.
5. As a plugin developer, I want one or two MV input-triggered character actions, so that I can verify the **3D Character Overlay** can react to RPG Maker MV input without owning movement, collision, or gameplay simulation.
6. As a plugin developer, I want MV plugin commands for showing, hiding, loading, and playing the character, so that I can verify RPG Maker MV events can trigger **Visual Stage** behavior.
7. As a plugin developer, I want the demo to use basic PBR rendering, so that I can validate the simplest GLB/glTF material path before exploring NPR or VRM-specific materials.
8. As a plugin developer, I want the overlay to use a transparent right-side display, so that I can see the 3D character while the MV map and UI remain usable.
9. As a plugin developer, I want the overlay to avoid blocking MV pointer input, so that the demo does not interfere with normal RPG Maker MV interaction.
10. As a plugin developer, I want the demo to follow MV canvas resize behavior, so that browser window changes do not detach the 3D layer from the game view.
11. As a plugin developer, I want the demo to use a TypeScript source project that builds into a normal MV plugin JavaScript file, so that the implementation can be modular while remaining usable by RPG Maker MV.
12. As a plugin developer, I want Three.js and GLTFLoader bundled into the demo plugin output, so that the first demo does not depend on CDN, import maps, or manual script load ordering.
13. As a plugin developer, I want the MV test host to remain outside the committed repository, so that the plugin can be developed without committing RPG Maker MV runtime files or licensed sample project contents.
14. As a plugin developer, I want a copy path from the plugin project into a local MV test host, so that I can iterate on the plugin and verify it inside RPG Maker MV.
15. As a plugin developer, I want the demo to run from MV Web deployment over HTTP, so that I can validate the primary modern-browser deployment path rather than only editor playtest behavior.
16. As a plugin developer, I want clear documentation for setup, build, copy, plugin commands, and known limits, so that another developer can reproduce the demo without reconstructing decisions from conversation.
17. As a future product designer, I want this PRD to explicitly mark deferred capabilities, so that later work on **Presentation Scene**, VRM, NPR, outfit switching, and secondary motion is not blocked by first-demo shortcuts.

## Implementation Decisions

- The first demo is a **3D Character Overlay** demo only. It does not include a **Presentation Scene**.
- RPG Maker MV remains the only runtime target for this demo.
- The **2D Tilemap** remains authoritative for movement, events, collision, object interaction, menus, and game state.
- The **3D Character Overlay** is presentation-only. It may react visually to MV input, variables, events, or plugin commands, but it does not own gameplay simulation.
- The demo uses GLB/glTF as the first validated asset path.
- VRM is out of scope for this demo and should be handled as a later spike if needed.
- The demo uses basic GLB PBR rendering only.
- NPR, toon shading, custom outline passes, MToon, and VRM material compatibility are out of scope for this demo.
- The demo plays skeletal animation clips embedded in the GLB asset.
- Runtime spring-bone, cloth, hair, accessory, and other secondary-motion simulation are out of scope.
- Baked secondary motion is acceptable if it is already authored into the GLB animation clips.
- The demo does not include outfit switching, mesh visibility slots, whole-model outfit replacement, equipment attachment, runtime accessory binding, or material recoloring.
- The demo displays a fixed right-side **3D Character Overlay** with transparent background.
- The implementation should keep an internal viewport concept, but the first demo does not expose arbitrary viewport placement as a public feature.
- The overlay should not block MV pointer or touch input in the default demo state.
- The demo exposes the minimal MV plugin command set: `Show`, `Hide`, `LoadCharacter`, and `Play`.
- Camera, light, rotation, scale, arbitrary viewport, input binding, and scene commands are not public plugin commands in this demo.
- The demo may use plugin parameters for default character path, auto-show behavior, overlay width, target FPS, and max pixel ratio.
- The demo uses TypeScript source and builds to a RPG Maker MV-compatible JavaScript plugin file.
- The demo bundles Three.js core, GLTFLoader, and plugin runtime code into one generated plugin JavaScript file.
- The demo keeps model assets external to the plugin JavaScript bundle.
- The repository should contain the plugin project, source, build configuration, public demo asset path, documentation, and local-host configuration examples.
- The repository should not commit a full RPG Maker MV test project.
- The local RPG Maker MV test host path should be configured through a local-only config file or equivalent ignored mechanism.
- The demo should copy the built plugin and demo model assets into the local MV test host for manual RPG Maker MV verification.
- The demo should prefer a redistributable, lightweight GLB character asset with at least an idle animation and ideally one action animation.
- If no suitable redistributable animated character asset is available, the implementation should clearly document the fallback asset choice and its limitations.
- The hard browser success target is modern desktop Chrome or Edge served over HTTP from MV Web deployment.
- Desktop Firefox and Safari are useful follow-up checks but do not block first-demo completion.
- Mobile browsers are best-effort only for this demo.
- WebGL2 is the demo rendering baseline. There is no WebGL1 promise.
- Demo performance defaults should be conservative: target 30 FPS, cap max pixel ratio, use transparent overlay, disable shadows, and avoid post-processing.

## Testing Decisions

- The demo should be verified by external behavior, not implementation details.
- Build verification should prove the TypeScript source produces a MV-loadable plugin JavaScript file.
- Runtime verification should happen in a local RPG Maker MV test host with the plugin enabled.
- Web verification should use MV Web deployment served from a local HTTP server, not only `file://` or RPG Maker MV editor playtest.
- The required browser verification target is modern desktop Chrome or Edge.
- The overlay must visibly appear on an MV map, remain aligned with the MV game view, and not block normal MV input.
- The default GLB character must load from the MV project resource path.
- The default animation must play if the GLB provides it.
- At least one MV input-triggered action animation should work if the GLB provides the clip.
- The `Show`, `Hide`, `LoadCharacter`, and `Play` plugin commands must work when triggered from MV events.
- Missing optional animation clips should degrade gracefully by keeping the character visible and reporting a useful diagnostic rather than breaking the demo.
- Missing or failed model loads should report a useful diagnostic and should not crash the MV game loop.
- Resize behavior should be manually checked by changing the browser or playtest window size.
- Performance should be manually checked for obvious frame drops on a normal desktop browser, with the first demo defaults set to reduce GPU pressure.

## Out of Scope

- RPG Maker MZ support.
- RPG Maker Unite or Unity support.
- Replacing RPG Maker MV's **2D Tilemap**.
- Converting MV maps into full 3D gameplay spaces.
- 3D collision, pathfinding, or map-object interaction.
- Making the 3D character the authoritative player actor in the MV world.
- A complete 3D RPG engine.
- **Presentation Scene** loading, staging, camera choreography, or props.
- VRM loading, expressions, humanoid controls, LookAt, VRM Animation, MToon, or VRM SpringBone.
- NPR, toon shader, outline post-process, rim-light system, or full post-processing stack.
- Runtime secondary-motion simulation.
- Outfit and appearance switching.
- Configurable key binding.
- Independent 3D movement controller.
- IK, procedural locomotion, aim constraints, or animation retargeting.
- Arbitrary viewport commands, multiple overlay regions, menu-integrated 3D preview windows, or drag/resize UI.
- Desktop Safari as a hard pass target.
- Mobile browser compatibility as a hard pass target.
- WebGL1 fallback.
- Committing a full RPG Maker MV project into this repository.
- Publishing a production-ready plugin package.

## Further Notes

The recommended next artifact is a design document for `r3d-character-overlay-demo`. The design should decide the implementation shape: build tool, MV plugin header preservation, generated bundle format, local MV host copy flow, Three.js renderer lifecycle, overlay DOM placement, animation controller behavior, plugin command routing, input adapter behavior, diagnostics, asset loading, and resource disposal.

ADR creation should remain deferred. The choices in this PRD are demo-scoped unless explicitly promoted later into project-level policy.
