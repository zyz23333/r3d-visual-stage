# Slice 06: Scene Documentation And End-To-End Verification

## Status

Ready

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../presentation-scene-runtime-design.md`

## Blocked By

- Slice 01: Scene Definition Contract And Validation
- Slice 02: Validation Scene Asset Flow
- Slice 03: Visual Stage Runtime Core
- Slice 04: Scene Path Loading And Public Control Surface
- Slice 05: Plugin Parameters And MV Host Integration

## Purpose

Complete the scene-centered migration by updating user-facing documentation and verifying the full path from generated **R3D Scene File** through MV plugin commands and runtime behavior.

## Scope

### In

- Replace or supersede `docs/r3d-character-display.md` with scene-centered documentation.
- Update README current implementation notes if they conflict with scene runtime behavior.
- Document **R3D Scene File** schema v1, default validation scene, plugin parameters, Scene commands, public Scene API, manual verification, diagnostics, and known limits.
- Run final type, lint, build, test, and generation checks.
- Document any MV playtest verification that cannot be run locally.

### Out

- No new runtime behavior beyond documentation fixes required to complete accepted slices.
- No slice planning changes unless implementation diverged from design and must be corrected.
- No external issue publication.

## Design References

- Requirements: REQ-10
- Decisions: docs center on **Presentation Scenes**; **3D Character Display** remains a default **Presentation Scene** example; no old `Character` API or commands
- Invariants: 2D Tilemap remains authoritative; RPG Maker MV only; default validation flow local-only
- Completion Contract: OT-01, OT-02, OT-03, OT-04, DOC-03, DOC-04
- Canonical docs: `../presentation-scene-runtime-design.md`, `../../../../docs/r3d-character-display.md`, `../../../../README.md`, `../../../../CONTEXT.md`

## Code Context

`docs/r3d-character-display.md` currently documents Character commands, Character API, Default Character Path, and Known Limits saying there is no Presentation Scene support. `README.md` current implementation also describes the character display slice and GLB loader path.

## What To Build

Create scene-centered documentation, likely `docs/r3d-presentation-scenes.md`, and either delete, replace, or clearly supersede the old character-centered doc. The documentation must match the implemented command/API surface and generated validation scene.

Manual verification steps must include:

- default startup loads validation scene
- `R3DStage Scene Play character Wave`
- invalid scene load leaves active scene visible
- resize alignment
- pointer pass-through
- file logging in MV playtest

## Acceptance Criteria

- [ ] Primary docs describe **R3D Scene Files** and **Presentation Scene Definitions**.
- [ ] Primary docs document schema v1 fields implemented by the runtime.
- [ ] Primary docs document `R3DStage Scene Load`, `Hide`, and `Play`.
- [ ] Primary docs document `window.R3DVisualStage.scene`.
- [ ] Docs do not advertise `R3DStage Character ...` or `window.R3DVisualStage.character`.
- [ ] Docs explain that the validation character is a default **Presentation Scene** example.
- [ ] Known limits match the design's non-goals.
- [ ] README current implementation notes are not stale.
- [ ] Final verification commands pass or skipped manual MV playtest steps are explicitly documented.

## Implementation Notes

Keep docs in English per repo instructions. Avoid adding implementation-only concepts to `CONTEXT.md`; it should remain a glossary. If implementation revealed a genuine new domain term, return to `grill-with-docs` instead of silently expanding the glossary here.

## Suggested Task Plan

1. Add or update tests.
2. Implement the smallest production change.
3. Run focused verification.
4. Update docs if required.
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

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
