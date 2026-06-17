# Slice 07: Scene Documentation And End-To-End Verification

## Status

Completed

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation
- Slice 02: Validation Scene Asset Flow
- Slice 03: Scene Resource Disposal And Build Helpers
- Slice 04: Visual Stage Runtime Core
- Slice 05: Scene Path Loading And Public Control Surface
- Slice 06: Plugin Parameters And MV Host Integration

## Purpose

Complete the scene-centered migration by updating user-facing documentation and verifying the full path from generated **R3D Scene File** through MV plugin commands and runtime behavior.

## Result

- Primary docs now describe **R3D Scene Files**, **Presentation Scene Definitions**, the scene-oriented API, and the generated validation scene.
- The default validation scene now includes both `portrait` and `wide` cameras so manual camera switching is visible.
- A local `R3DVisualStageManualTest` MV checklist plugin now provides step-by-step verification for `Play`, `Hide`, `Show`, `Camera wide`, `Camera portrait`, invalid load preservation, pointer pass-through, resize alignment, and file logging.
- The repo verification commands all pass.
- Local MV playtest verification was documented and made repeatable, but the actual Playtest session was not executed in this workspace.

## Scope

### In

- Replace or supersede `docs/r3d-character-display.md` with scene-centered documentation.
- Update README current implementation notes if they conflict with scene runtime behavior.
- Document **R3D Scene File** schema v1, default validation scene, plugin parameters, Scene commands, public Scene API, manual verification, diagnostics, and known limits.
- Add a repeatable local MV manual checklist for step-by-step Playtest verification.
- Run final type, lint, build, test, and generation checks.
- Document any MV playtest verification that cannot be run locally.

### Out

- No new runtime behavior beyond documentation fixes required to complete accepted slices.
- No slice planning changes unless implementation diverged from design and must be corrected.
- No external issue publication.
- No new ADR unless implementation reveals a hard-to-reverse decision outside the current design.

## Design References

- Requirements: REQ-10
- Decisions: docs center on **Presentation Scenes**; **3D Character Display** remains a default **Presentation Scene** example; `R3D Scene Files` are strict JSON under `scenes/`; no old `Character` API or commands
- Invariants: 2D Tilemap remains authoritative; RPG Maker MV only; default validation flow local-only; Visual Stage must not block pointer input
- Completion Contract: OT-01, OT-02, OT-03, OT-04, OT-05, DOC-03, DOC-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../docs/r3d-character-display.md`, `../../../../README.md`, `../../../../CONTEXT.md`

## Code Context

`docs/r3d-character-display.md` currently documents Character commands, Character API, Default Character Path, and Known Limits saying there is no Presentation Scene support. `README.md` current implementation may describe the character display slice and GLB loader path. `package.json` currently formats `docs/r3d-character-display.md` explicitly.

## What To Build

Create scene-centered documentation, likely `docs/r3d-presentation-scenes.md`, and either delete, replace, or clearly supersede the old character-centered doc. The documentation must match the implemented command/API surface and generated validation scene.

Manual verification steps must include:

- default startup loads validation scene
- `R3DStage Scene Play character Wave`
- `R3DStage Scene Camera portrait`
- invalid scene load leaves active scene and active **Presentation Camera** visible
- resize alignment
- pointer pass-through
- file logging in MV playtest

## Acceptance Criteria

- [x] Primary docs describe **R3D Scene Files** and **Presentation Scene Definitions**.
- [x] Primary docs document schema v1 fields implemented by the runtime, including `cameras`, `activeCamera`, `lights`, `models`, transforms, `fit`, strict JSON, and project-root-relative paths.
- [x] Primary docs document `R3DStage Scene Load`, `Show`, `Hide`, `Camera`, and `Play`.
- [x] Primary docs document `window.R3DVisualStage.scene.load`, `loadDefinition`, `show`, `hide`, `setCamera`, and `play`.
- [x] Primary docs document `window.R3DVisualStage.dispose()`.
- [x] Docs do not advertise `R3DStage Character ...` or `window.R3DVisualStage.character`.
- [x] Docs explain that the validation character is a default **Presentation Scene** example.
- [x] Primary docs and validation assets describe both `portrait` and `wide` cameras so camera switching is visibly testable.
- [x] Known limits match the design's non-goals and deferred ideas.
- [x] README current implementation notes are not stale.
- [x] Final verification commands pass or skipped manual MV playtest steps are explicitly documented.

## Implementation Notes

Keep docs in English per repo instructions. Avoid adding implementation-only concepts to `CONTEXT.md`; it should remain a glossary. If implementation revealed a genuine new domain term, return to `grill-with-docs` instead of silently expanding the glossary here.

## Suggested Task Plan

1. Update or replace user-facing docs.
2. Update README and package format paths as needed.
3. Run generation, test, type, lint, and build checks.
4. Run or document manual MV playtest verification.
5. Report changed files and verification result.

## Verification Commands

```bash
npm run generate:validation-asset
npm run test
npm run check
npm run lint
npm run build
```

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented. The MV playtest session itself was not executed locally; the repository now includes a repeatable checklist plugin for that step.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
