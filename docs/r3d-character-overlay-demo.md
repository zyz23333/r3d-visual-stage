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

## Plugin Parameters

- `Default Character Path`: default `models/r3d-demo-character.glb`
- `Auto Show`: default `true`
- `Overlay Width`: default `280`
- `Target FPS`: default `30`
- `Max Pixel Ratio`: default `1.5`

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

## Known Demo Limits

- RPG Maker MV only.
- WebGL2-capable modern desktop browsers are the target.
- No RPG Maker MZ, RPG Maker Unite, or Unity support.
- No 3D gameplay map, collision, pathfinding, or authoritative 3D actor.
- No VRM, MToon, expressions, LookAt, or runtime spring-bone support.
- No Presentation Scene, props, choreography timeline, outfit switching, or
  configurable viewport commands.
