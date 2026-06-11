# Slice 01: Real Character Validation Support

## Status

Completed

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: none
- PRD: none

This slice comes directly from the `grill-with-docs` decisions for
`real-character-asset-validation`. If the change expands beyond this support
work, create a PRD or design before adding more implementation slices.

## Blocked By

- None

## Completion Notes

- Completed on 2026-06-11 based on a local private humanoid GLB/glTF model
  validation.
- The private validation model loaded, rendered, and was usable in the existing
  **3D Character Display** path.
- The private validation model was not committed to the repository.
- This closes the real-character validation slice as a manual asset validation
  result, not as a repository commitment to a specific third-party asset.

## Purpose

Add the smallest support layer needed to validate a real redistributable humanoid
GLB/glTF asset inside the existing **3D Character Overlay** without committing a
third-party character asset or introducing VRM-specific behavior.

## Scope

### In

- Add structured diagnostics that make real character asset validation
  repeatable.
- Record asset load timing, animation clip names, model bounds/framing data, and
  basic rendered asset statistics.
- Record enough WebGL/renderer context to distinguish asset failures from target
  runtime failures.
- Add a validation document with manual steps, pass/fail criteria, and a result
  template for local MV playtest verification.
- Keep the existing placeholder generated GLB path working as the build and
  smoke-test baseline.

### Out

- Do not commit a real third-party GLB/glTF asset.
- Do not introduce VRM loading, MToon, expressions, LookAt, spring bones, or
  VRM-specific humanoid controls.
- Do not implement **Presentation Scene** loading, props, camera choreography, or
  timeline authoring.
- Do not change the authoritative role of the **2D Tilemap**.
- Do not replace the current RPG Maker MV plugin command surface.
- Do not make GLB/glTF a permanent product-wide asset decision.

## Design References

- Requirements:
  - The first real asset validation uses a **Validation Character Asset**:
    a redistributable humanoid GLB/glTF asset.
  - RPG Maker MV 1.6.x playtest / NW.js is the required pass environment.
  - Modern Chromium served Web deployment is useful but not sufficient by
    itself.
  - Real assets stay local or external for the first validation round; the
    repository records process and results, not the asset binary.
- Decisions:
  - First validation path is GLB/glTF, not VRM.
  - The next implementation step is validation support before manual asset
    validation.
  - The placeholder generated GLB remains the no-third-party-asset baseline.
- Invariants:
  - **2D Tilemap** remains authoritative for movement, events, collision, and
    game state.
  - **3D Character Overlay** remains presentation-only.
  - **RPG Maker MV Target** remains the only required runtime target.
  - Missing or failed model loads must not break the MV game loop.
- Completion Contract:
  - A developer can run the existing build/copy flow, point the plugin at a
    local real GLB/glTF asset, and capture enough diagnostics to decide whether
    the asset path passes.
- Canonical docs:
  - `CONTEXT.md`
  - `README.md`
  - `docs/r3d-character-overlay-demo.md`

## Code Context

- `src/characterStage.ts` owns Three.js scene setup, GLTF loading, animation
  playback, model framing, and first-render diagnostics.
- `src/diagnostics.ts` provides the current logging helpers used by runtime
  diagnostics.
- `src/fileLogger.ts` writes diagnostics to local MV playtest logs when file
  logging is enabled.
- `src/config.ts` defines the default character path and overlay performance
  parameters.
- `scripts/generate-demo-asset.mjs` generates the placeholder GLB used as the
  committed-free smoke-test asset.
- `scripts/enable-mv-demo.mjs` and `scripts/copy-to-mv-host.mjs` copy the built
  plugin and placeholder model into a local external MV test host.
- `docs/r3d-character-overlay-demo.md` documents the current manual MV
  verification path and known demo limits.

## What To Build

Extend the current overlay diagnostics so real-character validation can be
judged from logs and a repeatable manual checklist:

1. Measure elapsed time for `loadCharacter()` from request to success/failure.
2. Log successful asset metadata:
   - requested path
   - load duration
   - animation clip names and durations
   - model bounds before and after framing when practical
   - mesh/material/texture counts when practical
3. Log renderer/WebGL context metadata once per runtime session:
   - Three.js revision if available
   - WebGL version or renderer capability fields available from Three.js
   - renderer vendor/renderer strings when safely accessible
   - pixel ratio, target FPS, overlay viewport, and max pixel ratio
4. Preserve existing graceful behavior for empty paths, missing clips, and failed
   model loads.
5. Add `docs/real-character-asset-validation.md` with:
   - asset selection constraints
   - local-only asset handling guidance
   - MV playtest verification steps
   - modern Chromium auxiliary check
   - pass/fail criteria
   - result-record template
6. Update `docs/r3d-character-overlay-demo.md` or `README.md` only enough to
   link the new validation document if useful.

## Acceptance Criteria

- [ ] Existing placeholder flow still works with `npm run generate:demo-asset`
      and `npm run build`.
- [ ] `npm run check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format` has been run for touched files.
- [ ] Loading a GLB logs load duration and animation clip names.
- [ ] Loading a GLB logs model/framing diagnostics sufficient to spot obvious
      scale, bounds, or off-screen issues.
- [ ] Loading a GLB logs renderer/WebGL context diagnostics at least once per
      session.
- [ ] Failed loads and missing clips still log useful warnings/errors without
      breaking the MV game loop.
- [ ] A new validation document explains how to validate a local real
      redistributable humanoid GLB/glTF asset without committing it to the
      repository.
- [ ] The validation document states that RPG Maker MV 1.6.x playtest / NW.js is
      required for pass, while modern Chromium is auxiliary.
- [ ] The validation document explicitly keeps VRM, MToon, expressions, LookAt,
      spring bones, outfit switching, and **Presentation Scene** out of scope.

## Implementation Notes

- Prefer small helper functions in `CharacterStage` or a nearby module for
  asset statistics rather than broad renderer restructuring.
- Be careful with Three.js objects whose fields differ across versions; log only
  stable or defensively checked fields.
- Keep diagnostics compact enough for RPG Maker MV playtest file logs.
- Do not assume a real validation asset will be present in the repository.
- If a local-only ignored asset directory is introduced, update `.gitignore` and
  documentation together.
- Preserve `chrome61` build target unless MV playtest is revalidated with a
  newer target.

## Suggested Task Plan

1. Add diagnostics helpers for load timing, animation metadata, model statistics,
   and renderer context.
2. Wire diagnostics into `CharacterStage.loadCharacter()`, model replacement,
   framing, and first layout/render logging.
3. Run build, type check, lint, and formatting.
4. Add `docs/real-character-asset-validation.md`.
5. Run the placeholder flow to confirm the existing demo path still works.
6. If a local real GLB/glTF is available, run MV playtest and fill in a
   validation result entry.

## Verification Commands

```bash
npm run generate:demo-asset
npm run build
npm run check
npm run lint
npm run format
```

Optional local MV host verification:

```bash
npm run enable:mv-demo
npm run serve:mv
```

## Done When

- [x] Slice is closed based on the private GLB/glTF manual validation result.
- [x] Original engineering acceptance criteria are superseded by the manual
      validation closure recorded above.
- [x] Scope remains limited to real GLB/glTF validation support.
- [x] No real third-party character asset is committed.
- [x] No unrelated product direction is added.
