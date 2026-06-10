# R3D Character Overlay Demo

This document explains how to build and manually verify the first **R3D Visual
Stage** demo plugin for RPG Maker MV.

The demo renders a transparent right-side **3D Character Overlay** with Three.js
while RPG Maker MV's 2D tilemap remains authoritative for movement, events,
collision, menus, and game state.

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
npm run generate:demo-asset
npm run build
```

The build writes:

- `dist/R3DCharacterOverlayDemo.js`
- `dist/R3DCharacterOverlayDemo.js.map`
- `public/models/r3d-demo-character.glb`

The generated GLB is a lightweight local placeholder character with `Idle` and
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

- `dist/R3DCharacterOverlayDemo.js` to `<MV project>/js/plugins/`
- `dist/R3DCharacterOverlayDemo.js.map` to `<MV project>/js/plugins/`
- `public/models/r3d-demo-character.glb` to `<MV project>/models/`

Enable `R3DCharacterOverlayDemo` in RPG Maker MV's Plugin Manager.

For the configured `.r3d-local.json` project, this can also be automated:

```sh
npm run enable:mv-demo
```

`enable:mv-demo` generates the placeholder GLB, builds the plugin, copies the
plugin and model into the MV project, and inserts or updates the
`R3DCharacterOverlayDemo` entry in `<MV project>/js/plugins.js` with `status:
true`. The command intentionally requires `.r3d-local.json`; it does not fall
back to any repository-local reference project.

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

- `Default Character Path`: default `models/r3d-demo-character.glb`
- `Auto Show`: default `true`
- `Overlay Width`: default `280`
- `Target FPS`: default `30`
- `Max Pixel Ratio`: default `1.5`
- `File Logging`: default `false`
- `Log File Path`: default `r3d-logs/R3DCharacterOverlayDemo.log`
- `Timestamp Log File`: default `false`

`File Logging` is intended for RPG Maker MV playtest/NW.js debugging. When it is
enabled, diagnostics are written relative to the MV project root. When
`Timestamp Log File` is also enabled, each playtest run writes a separate log
file, such as:

```text
r3d-logs/R3DCharacterOverlayDemo-2026-06-10T07-47-23-482Z.log
```

`npm run enable:mv-demo` enables file logging and timestamped log files in the
configured local MV test host so playtest diagnostics are available without
opening DevTools first.

## Plugin Commands

RPG Maker MV plugin commands:

```text
R3DOverlay Show
R3DOverlay Hide
R3DOverlay LoadCharacter models/r3d-demo-character.glb
R3DOverlay Play Idle
R3DOverlay Play Wave
```

`R3DCharacterOverlayDemo` may also be used as the command prefix:

```text
R3DCharacterOverlayDemo Play Idle
```

The demo also listens for MV's `ok` input and attempts to play `Wave` when that
clip exists.

## Manual Verification

In RPG Maker MV playtest or Web deployment served over HTTP:

1. Open a map with the plugin enabled.
2. Confirm the transparent 3D overlay appears on the right side of the MV canvas.
3. Confirm normal MV keyboard and pointer input still reaches the 2D map.
4. Trigger `R3DOverlay Hide`, then `R3DOverlay Show`.
5. Trigger `R3DOverlay Play Wave`.
6. Resize the browser or playtest window and confirm the overlay remains aligned
   with the MV game canvas.
7. Test a missing clip, such as `R3DOverlay Play MissingClip`, and confirm the MV
   game loop continues while the browser console reports a useful warning.

For RPG Maker MV playtest, also inspect the latest log file under
`<MV project>/r3d-logs/`. A successful default startup should include these
milestones:

```text
File logger installed.
Overlay shown.
Loading character: models/r3d-demo-character.glb
Plugin installed.
Loaded character: models/r3d-demo-character.glb
Overlay layout ready.
Overlay first render completed.
```

`Overlay layout ready` includes a small DOM diagnostics snapshot. The important
fields are:

- `isMounted`: the overlay canvas has been attached to the document.
- `isBodyLastChild`: the overlay canvas is above MV's `GameCanvas` and
  `UpperCanvas` in body order.
- `zIndex`: should be `4` in the demo.
- `viewport`: should have non-zero width and height.

If the model loads but the overlay is not visible, check these diagnostics before
debugging the GLB loader. RPG Maker MV playtest creates and updates its own
canvas elements during `Graphics.initialize()`, so the demo waits until
`Graphics._canvas` exists, then mounts the overlay canvas above MV's canvases and
keeps it aligned during layout updates.

RPG Maker MV 1.6.x playtest runs inside an older NW.js/Chromium runtime than
modern desktop Chrome. Keep the demo bundle target at `chrome61` in
`vite.config.ts` unless a newer target is explicitly revalidated in MV playtest.
An `es2020` bundle can leave syntax such as optional chaining or nullish
coalescing in the generated plugin and fail before any plugin diagnostics run.

The demo installs a small runtime compatibility layer from `src/runtimeCompat.ts`
before creating the overlay. It currently supplies the minimal
`AbortController`/`AbortSignal` surface that Three.js `FileLoader` needs in MV
playtest. If a future Three.js upgrade or MV runtime change removes the need,
verify by loading the GLB in MV playtest before deleting this compatibility
layer.

The warning below is expected with the current Three.js build and is not known to
block the demo:

```text
THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

## Known Demo Limits

- RPG Maker MV only.
- WebGL2-capable modern desktop browsers are the target.
- No RPG Maker MZ, RPG Maker Unite, or Unity support.
- No 3D gameplay map, collision, pathfinding, or authoritative 3D actor.
- No VRM, MToon, expressions, LookAt, or runtime spring-bone support.
- No Presentation Scene, props, choreography timeline, outfit switching, or
  configurable viewport commands.
