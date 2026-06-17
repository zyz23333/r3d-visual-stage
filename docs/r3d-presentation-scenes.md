# R3D Presentation Scenes

This document explains how to build and manually verify the current **R3D Visual
Stage** Presentation Scene runtime for RPG Maker MV.

R3D Visual Stage renders a transparent, right-side **Visual Stage** with
Three.js while RPG Maker MV's 2D tilemap remains authoritative for movement,
events, collision, menus, and game state. The default validation content is a
**3D Character Display** expressed through a **Presentation Scene**.

## Requirements

- Node.js 22 or newer.
- npm 10 or newer.
- A local RPG Maker MV 1.6.x test project, kept outside this repository.
- A modern desktop Chromium browser for MV Web deployment verification.

This repository does not include RPG Maker MV runtime files or a complete MV test
project.

## Install

```sh
npm install
```

## Build

```sh
npm run generate:validation-asset
npm run build
```

The build writes:

- `dist/R3DVisualStage.js`
- `dist/R3DVisualStage.js.map`
- `public/r3d/models/r3d-validation-character.glb`
- `public/r3d/scenes/r3d-validation-scene.r3dscene.json`

The generated validation scene is a default **3D Character Display** example
implemented as a **Presentation Scene**. It loads a lightweight local validation
character with `Idle` and `Wave` animation clips. It is only meant to verify the
scene loading, rendering, command, and animation paths. Replace it with real
redistributable GLB/glTF assets when validating asset quality.

## Copy Into A Local MV Test Host

Create a local-only config file at `.r3d-local.json`:

```json
{
  "mvProjectPath": "D:/path/to/your/RPG Maker MV test project"
}
```

Then run:

```sh
npm run copy:mv
```

The script copies:

- `dist/R3DVisualStage.js` to `<MV project>/js/plugins/`
- `dist/R3DVisualStage.js.map` to `<MV project>/js/plugins/`
- `public/r3d/models/r3d-validation-character.glb` to `<MV project>/r3d/models/`
- `public/r3d/scenes/r3d-validation-scene.r3dscene.json` to `<MV project>/r3d/scenes/`

Enable `R3DVisualStage` in RPG Maker MV's Plugin Manager.

For the configured `.r3d-local.json` project, this can also be automated:

```sh
npm run enable:mv-test-host
```

`enable:mv-test-host` generates the validation assets, builds the plugin, copies
the plugin, validation model, and validation scene into the MV project, and
inserts or updates the `R3DVisualStage` entry in `<MV project>/js/plugins.js`
with `status: true`. The command intentionally requires `.r3d-local.json`; it
does not fall back to any repository-local reference project.

## Install The MV Manual Test Checklist

For step-by-step RPG Maker MV playtest verification, install the local manual
test plugin:

```sh
npm run enable:mv-manual-test
```

This command first runs `enable:mv-test-host`, then writes and enables a
local-only `R3DVisualStageManualTest` plugin in the configured MV project. It
also writes an intentionally invalid scene file at:

```text
<MV project>/r3d/scenes/r3d-invalid-scene.r3dscene.json
```

Open RPG Maker MV playtest after running the command. A small checklist panel
appears in the top-left corner. Use the buttons or keyboard shortcuts to run one
step at a time:

- `N`: run the current step.
- `P`: mark the current step passed.
- `F`: mark the current step failed.
- `R`: rerun the current step.
- `[` / `]`: move to the previous or next step.
- `H`: hide or show the checklist panel.

The checklist executes the same public command path that ordinary MV events use
for scene playback, visibility, camera switching, and scene loading. Some checks
still require visual judgment, such as confirming the validation character is
visible, pointer input reaches the MV map, the invalid scene load preserves the
current scene, and resize alignment remains correct.

Remove or disable `R3DVisualStageManualTest` from the MV Plugin Manager when the
local playtest checklist is no longer needed.

## Serve The Local MV Test Host

The configured `.r3d-local.json` project can be served over HTTP with:

```sh
npm run serve:mv
```

This command reads `mvProjectPath`, validates that it points at an RPG Maker MV
project with `Game.rpgproject` and `index.html`, then starts `http-server` from
that project root. By default, the game is available at:

```text
http://127.0.0.1:8080/
```

To use a different address or port:

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "8081"
npm run serve:mv
```

For POSIX shells:

```sh
HOST=127.0.0.1 PORT=8081 npm run serve:mv
```

## Plugin Parameters

- `Default Scene Path`: default `r3d/scenes/r3d-validation-scene.r3dscene.json`
- `Auto Show Scene`: default `true`
- `Stage Placement`: default `right`; this version only supports `right`
- `Stage Width`: default `280`
- `Target FPS`: default `30`
- `Max Pixel Ratio`: default `1.5`
- `File Logging`: default `false`
- `Log File Path`: default `r3d-logs/R3DVisualStage.log`
- `Timestamp Log File`: default `false`

`File Logging` is intended for RPG Maker MV playtest/NW.js debugging. When it is
enabled, diagnostics are written relative to the MV project root. When
`Timestamp Log File` is also enabled, each playtest run writes a separate log
file, such as:

```text
r3d-logs/R3DVisualStage-2026-06-10T07-47-23-482Z.log
```

`npm run enable:mv-test-host` enables file logging and timestamped log files in
the configured local MV test host so playtest diagnostics are available without
opening DevTools first.

## R3D Scene Files

R3D Scene Files use the `.r3dscene.json` extension and contain strict JSON.
Runtime loading uses `JSON.parse`, so comments, trailing commas, JSONC, and
JSON5 are not supported.

All scene file paths and model paths are RPG Maker MV project-root-relative
paths. The runtime rejects empty paths, absolute paths, drive-letter paths,
remote URLs, protocol-relative URLs, and parent-directory traversal.

The generated validation scene uses this shape:

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
    },
    {
      "id": "wide",
      "position": [0, 1.25, 7.0],
      "target": [0, 1.05, 0],
      "fov": 46,
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
    }
  ],
  "models": [
    {
      "id": "character",
      "path": "r3d/models/r3d-validation-character.glb",
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

## Plugin Commands

RPG Maker MV plugin commands:

```text
R3DStage Scene Load r3d/scenes/r3d-validation-scene.r3dscene.json
R3DStage Scene Show
R3DStage Scene Hide
R3DStage Scene Camera wide
R3DStage Scene Camera portrait
R3DStage Scene Play character Wave
```

Successful scene loads automatically show the Visual Stage. `Hide` hides the
canvas without disposing the active scene. `Show` reveals the current active
scene. `Camera` switches to a named Presentation Camera. `Play` requires both a
model ID and an exact animation clip name. The validation scene includes both a
`wide` and `portrait` camera so you can verify visible camera switching.

## Public JavaScript API

R3D Visual Stage exposes a scene-oriented public API:

```js
await window.R3DVisualStage.scene.load('r3d/scenes/r3d-validation-scene.r3dscene.json');
await window.R3DVisualStage.scene.loadDefinition(sceneDefinition);
window.R3DVisualStage.scene.show();
window.R3DVisualStage.scene.hide();
window.R3DVisualStage.scene.setCamera('wide');
window.R3DVisualStage.scene.setCamera('portrait');
window.R3DVisualStage.scene.play('character', 'Wave');
window.R3DVisualStage.dispose();
```

## Manual Verification

In RPG Maker MV playtest or Web deployment served over HTTP:

1. Open a map with the plugin enabled.
2. Confirm the transparent Visual Stage appears on the right side of the MV canvas.
3. Confirm normal MV keyboard and pointer input still reaches the 2D map.
4. Trigger `R3DStage Scene Hide`, then `R3DStage Scene Show`.
5. Trigger `R3DStage Scene Play character Wave`.
6. Trigger `R3DStage Scene Camera wide`.
7. Trigger `R3DStage Scene Camera portrait`.
8. Resize the browser or playtest window and confirm the Visual Stage remains aligned with the MV game canvas.

When `R3DVisualStageManualTest` is enabled, use its checklist panel to run these
checks one at a time and record pass/fail status during playtest.

For RPG Maker MV playtest, also inspect the latest log file under
`<MV project>/r3d-logs/`. A successful default startup should include scene load,
scene promotion, layout ready, and first render diagnostics.

RPG Maker MV 1.6.x playtest runs inside an older NW.js/Chromium runtime than
modern desktop Chrome. Keep the bundle target at `chrome61` in `vite.config.ts`
unless a newer target is explicitly revalidated in MV playtest.

The plugin installs a small runtime compatibility layer from
`src/runtimeCompat.ts` before creating the Visual Stage. It currently supplies
the minimal `AbortController`/`AbortSignal` surface that Three.js `FileLoader`
needs in MV playtest. If a future Three.js upgrade or MV runtime change removes
the need, verify by loading the validation scene in MV playtest before deleting
this compatibility layer.

## Known Limits

- RPG Maker MV only.
- WebGL2-capable modern desktop browsers are the target.
- No RPG Maker MZ, RPG Maker Unite, or Unity support.
- No 3D gameplay map, collision, pathfinding, or authoritative 3D actor.
- No VRM, MToon, expressions, LookAt, or runtime spring-bone support.
- No scene graph nesting, scripting, physics, or gameplay collision.
- No choreography timeline, camera blending, camera animation, or delayed actions.
- No fullscreen Visual Stage layout in this version.
