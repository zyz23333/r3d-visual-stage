# Adopt Presentation Scene Definitions as the primary runtime model

R3D Visual Stage will move from a character-display-first runtime toward **Presentation Scene Definitions** as the primary authoring and loading model, because the project needs bounded visual staging for cameras, lights, models, and animation without becoming a 3D gameplay engine or Unity-like scene system.

The public control surface should center on scene-oriented commands and APIs rather than long-term `Character` commands. The current **3D Character Display** remains an important use case, but it should be represented as a default **Presentation Scene** instead of a separate runtime architecture.

The first implementation should keep one long-lived renderer, canvas, and Three.js scene, then switch the active **Presentation Scene** by replacing a root `THREE.Group`. It should load `.r3dscene.json` files, validate them at runtime, fully preload referenced GLB/glTF models before switching, and preserve the current active scene if loading fails.

This first slice deliberately avoids a general asset manager, nested Unity-like scene graphs, scripting, physics, gameplay collision, and Visual Choreography timelines. Those concerns should be added only after the Presentation Scene loading and resource-lifecycle boundary is proven.
