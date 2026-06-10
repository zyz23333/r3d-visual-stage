# R3D Character Display

This document explains how to build and manually verify the first **R3D Visual
Stage** character display implementation for RPG Maker MV.

R3D Visual Stage renders a transparent, right-side **3D Character Display** with
Three.js while RPG Maker MV's 2D tilemap remains authoritative for movement,
events, collision, menus, and game state.

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
- `public/models/r3d-validation-character.glb`

The generated GLB is a lightweight local validation character with `Idle` and
`Wave` animation clips. It is only meant to verify the loading, rendering, and
command path. Replace it with a real redistributable animated GLB when validating
asset quality.

## Copy Into A Local MV Test Host

Create a local-only config file:

```sh
cp .r3d-local.example.json .r3d-local.json
```

Edit `.r3d-local.json`:

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
- `public/models/r3d-validation-character.glb` to `<MV project>/models/`

Enable `R3DVisualStage` in RPG Maker MV's Plugin Manager.

For the configured `.r3d-local.json` project, this can also be automated:

```sh
npm run enable:mv-test-host
```

`enable:mv-test-host` generates the validation GLB, builds the plugin, copies the
plugin and model into the MV project, and inserts or updates the `R3DVisualStage`
entry in `<MV project>/js/plugins.js` with `status: true`. The command
intentionally requires `.r3d-local.json`; it does not fall back to any
repository-local reference project.

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

- `Default Character Path`: default `models/r3d-validation-character.glb`
- `Auto Show Character`: default `true`
- `Character Display Width`: default `280`
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

## Plugin Commands

RPG Maker MV plugin commands:

```text
R3DStage Character Show
R3DStage Character Hide
R3DStage Character Load models/r3d-validation-character.glb
R3DStage Character Play Idle
R3DStage Character Play Wave
```

The plugin also listens for MV's `ok` input and attempts to play `Wave` when that
clip exists.

## Public JavaScript API

R3D Visual Stage exposes a grouped public API:

```js
window.R3DVisualStage.character.show();
window.R3DVisualStage.character.hide();
await window.R3DVisualStage.character.load('models/r3d-validation-character.glb');
window.R3DVisualStage.character.play('Wave');
```

## Manual Verification

In RPG Maker MV playtest or Web deployment served over HTTP:

1. Open a map with the plugin enabled.
2. Confirm the transparent 3D character display appears on the right side of the MV canvas.
3. Confirm normal MV keyboard and pointer input still reaches the 2D map.
4. Trigger `R3DStage Character Hide`, then `R3DStage Character Show`.
5. Trigger `R3DStage Character Play Wave`.
6. Resize the browser or playtest window and confirm the character display remains aligned with the MV game canvas.
7. Test a missing clip, such as `R3DStage Character Play MissingClip`, and confirm the MV game loop continues while the browser console reports a useful warning.

For RPG Maker MV playtest, also inspect the latest log file under
`<MV project>/r3d-logs/`. A successful default startup should include these
milestones:

```text
File logger installed.
Character display shown.
Loading character: models/r3d-validation-character.glb
Plugin installed.
Loaded character: models/r3d-validation-character.glb
Character display layout ready.
Character display first render completed.
```

`Character display layout ready` includes a small DOM diagnostics snapshot. The
important fields are:

- `isMounted`: the character display canvas has been attached to the document.
- `isBodyLastChild`: the character display canvas is above MV's `GameCanvas` and `UpperCanvas` in body order.
- `zIndex`: should be `4`.
- `viewport`: should have non-zero width and height.

If the model loads but the character display is not visible, check these
diagnostics before debugging the GLB loader. RPG Maker MV playtest creates and
updates its own canvas elements during `Graphics.initialize()`, so the plugin
waits until `Graphics._canvas` exists, then mounts the character display canvas
above MV's canvases and keeps it aligned during layout updates.

RPG Maker MV 1.6.x playtest runs inside an older NW.js/Chromium runtime than
modern desktop Chrome. Keep the bundle target at `chrome61` in `vite.config.ts`
unless a newer target is explicitly revalidated in MV playtest. An `es2020`
bundle can leave syntax such as optional chaining or nullish coalescing in the
generated plugin and fail before any plugin diagnostics run.

The plugin installs a small runtime compatibility layer from
`src/runtimeCompat.ts` before creating the character display. It currently
supplies the minimal `AbortController`/`AbortSignal` surface that Three.js
`FileLoader` needs in MV playtest. If a future Three.js upgrade or MV runtime
change removes the need, verify by loading the GLB in MV playtest before
deleting this compatibility layer.

The warning below is expected with the current Three.js build and is not known to
block the character display:

```text
THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

## Known Limits

- RPG Maker MV only.
- WebGL2-capable modern desktop browsers are the target.
- No RPG Maker MZ, RPG Maker Unite, or Unity support.
- No 3D gameplay map, collision, pathfinding, or authoritative 3D actor.
- No VRM, MToon, expressions, LookAt, or runtime spring-bone support.
- No Presentation Scene, props, choreography timeline, outfit switching, or
  configurable viewport commands.
