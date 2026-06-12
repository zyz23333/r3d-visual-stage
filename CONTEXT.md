# RPG 3D

RPG 3D defines the product language for **R3D Visual Stage**, a web-first RPG Maker MV plugin direction that adds 3D visual presentation to otherwise 2D RPG Maker games.

## Language

**3D Character Display**:
A persistent 3D-rendered character presentation shown alongside the RPG Maker MV 2D game view, analogous to a character portrait or bust display.
_Avoid_: 3D Character Overlay, 3D map actor, 3D player character

**Presentation Scene**:
A bounded 3D visual scene used for character display, camera work, animation staging, or short visual sequences.
_Avoid_: 3D world, gameplay map, full 3D level

**Presentation Scene Definition**:
A declarative description of a **Presentation Scene** used to author bounded visual staging content.
_Avoid_: Unity-like scene, game level, 3D gameplay scene

**Presentation Camera**:
A named camera inside a **Presentation Scene** used to choose the rendered view of bounded visual staging content.
_Avoid_: Unity camera, gameplay camera, camera component

**R3D Scene File**:
A JSON file containing a **Presentation Scene Definition** for **R3D Visual Stage**.
_Avoid_: Unity scene file, level file, map file

**Visual Stage**:
The bounded 3D presentation layer provided by **R3D Visual Stage** alongside RPG Maker MV's 2D game view.
_Avoid_: 3D engine, 3D map system, Unity replacement

**R3D Visual Stage**:
The formal product identity for the RPG Maker MV plugin that provides a **Visual Stage**.
_Avoid_: proof-of-concept plugin, character overlay plugin

**2D Tilemap**:
The RPG Maker MV map layer that remains authoritative for movement, events, collision, and game-world state.
_Avoid_: background layer, legacy map

**Visual Choreography**:
Camera, animation, pose, timing, and scene-direction data used to stage the **3D Character Display** or a **Presentation Scene**.
_Avoid_: gameplay interaction, world simulation

**RPG Maker MV Target**:
The RPG Maker MV runtime and plugin environment that this project targets first and exclusively for now.
_Avoid_: RPG Maker MZ support, RPG Maker Unite support

**Real Character Asset Validation**:
A focused validation slice that proves a redistributable humanoid 3D character asset can load, render, animate, and perform acceptably inside the **3D Character Display**.
_Avoid_: final asset pipeline, full character system

**Validation Character Asset**:
A redistributable humanoid GLB/glTF character asset used to validate the first real-character path before VRM-specific capabilities are considered.
_Avoid_: placeholder model, final production character, VRM baseline

## Relationships

- A **3D Character Display** is displayed over or beside the **2D Tilemap**.
- A **Presentation Scene Definition** describes one **Presentation Scene**.
- A **Presentation Scene** may define one or more **Presentation Cameras**.
- One **Presentation Camera** is active for rendering a **Presentation Scene** at a time.
- An **R3D Scene File** stores one **Presentation Scene Definition**.
- A **Visual Stage** may contain a **3D Character Display** or a **Presentation Scene**.
- **R3D Visual Stage** provides the **Visual Stage** for the **RPG Maker MV Target**.
- A **Presentation Scene** may include a **3D Character Display**, props, lighting, camera movement, and animation timing.
- The **2D Tilemap** remains authoritative for player movement, events, collision, and object interaction.
- **Visual Choreography** controls presentation but does not define tilemap collision, pathfinding, or gameplay-world interaction.
- The **RPG Maker MV Target** defines the initial runtime boundary; RPG Maker MZ and RPG Maker Unite are not baseline targets.
- **Real Character Asset Validation** happens inside the **3D Character Display** before broader **Presentation Scene** work depends on real character assets.
- A **Validation Character Asset** is the first asset used by **Real Character Asset Validation**.

## Example dialogue

> **Dev:** "Should the 3D character collide with map events?"
> **Domain expert:** "No. The **2D Tilemap** owns collision and event interaction. The **3D Character Display** can react visually, but it does not participate in map simulation."

> **Dev:** "Can we add camera cuts and staged animations?"
> **Domain expert:** "Yes. That belongs to **Visual Choreography** inside a bounded **Presentation Scene**, not to a full 3D gameplay world."

## Flagged ambiguities

- "Small 3D scene" means a **Presentation Scene** for visual staging, not a full 3D gameplay map.
