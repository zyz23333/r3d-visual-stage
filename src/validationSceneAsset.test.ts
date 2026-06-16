import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { validatePresentationSceneDefinition } from './presentationSceneDefinition';

const validationScenePath = resolve('public/r3d/scenes/r3d-validation-scene.r3dscene.json');

describe('generated validation scene asset', () => {
  it('is strict JSON and passes the Presentation Scene Definition validator', () => {
    const sceneText = readFileSync(validationScenePath, 'utf8');
    const scene = JSON.parse(sceneText) as unknown;
    const result = validatePresentationSceneDefinition(scene);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.definition.schemaVersion).toBe(1);
    expect(result.definition.id).toBe('r3d-validation-scene');
    expect(result.definition.activeCamera).toBe('portrait');
    expect(result.definition.cameras).toEqual([expect.objectContaining({ id: 'portrait' })]);
    expect(result.definition.lights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'hemi', type: 'hemisphere' }),
        expect.objectContaining({ id: 'key', type: 'directional' }),
      ]),
    );
    expect(result.definition.models).toEqual([
      expect.objectContaining({
        id: 'character',
        path: 'r3d/models/r3d-validation-character.glb',
        animation: 'Idle',
        fit: { height: 2.4, origin: 'center-bottom' },
      }),
    ]);
    expect(result.warnings).toEqual([]);
  });
});
