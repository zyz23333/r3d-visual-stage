import { describe, expect, it } from 'vitest';

import { validatePresentationSceneDefinition } from './presentationSceneDefinition';

function validScene(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: 'r3d-validation-scene',
    cameras: [
      {
        id: 'portrait',
        position: [0, 1.35, 4.5],
        target: [0, 1.1, 0],
        fov: 30,
        near: 0.1,
        far: 100,
      },
    ],
    activeCamera: 'portrait',
    lights: [
      {
        id: 'hemi',
        type: 'hemisphere',
        skyColor: '#ffffff',
        groundColor: '#404050',
        intensity: 2.4,
      },
      {
        id: 'key',
        type: 'directional',
        color: '#fff',
        intensity: 2.8,
        position: [2, 4, 4],
      },
    ],
    models: [
      {
        id: 'character',
        path: 'r3d/models/r3d-validation-character.glb',
        position: [0, 0, 0],
        rotation: [0, -0.2, 0],
        scale: 1,
        fit: {
          height: 2.4,
          origin: 'center-bottom',
        },
        animation: 'Idle',
      },
    ],
    ...overrides,
  };
}

function expectInvalid(scene: unknown): ReturnType<typeof validatePresentationSceneDefinition> {
  const result = validatePresentationSceneDefinition(scene);
  expect(result.ok).toBe(false);
  return result;
}

describe('validatePresentationSceneDefinition', () => {
  it('accepts the v1 validation scene shape from the design', () => {
    const result = validatePresentationSceneDefinition(validScene());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.definition.schemaVersion).toBe(1);
    expect(result.definition.id).toBe('r3d-validation-scene');
    expect(result.definition.activeCamera).toBe('portrait');
    expect(result.definition.cameras).toHaveLength(1);
    expect(result.definition.lights).toHaveLength(2);
    expect(result.definition.models).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it('rejects missing and unsupported schema versions', () => {
    expectInvalid(validScene({ schemaVersion: undefined }));

    const unsupported = expectInvalid(validScene({ schemaVersion: 2 }));
    expect(unsupported.ok).toBe(false);
    if (unsupported.ok) {
      return;
    }
    expect(unsupported.errors).toContainEqual(
      expect.objectContaining({
        path: 'definition.schemaVersion',
        reason: 'unsupported-version',
      }),
    );
  });

  it('rejects malformed cameras, duplicate camera IDs, and invalid activeCamera references', () => {
    const malformed = expectInvalid(
      validScene({
        cameras: [
          {
            id: 'portrait',
            position: [0, 0],
            target: [0, 0, 0],
            fov: 30,
          },
        ],
      }),
    );
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) {
      expect(malformed.errors).toContainEqual(
        expect.objectContaining({ path: 'definition.cameras[0].position' }),
      );
    }

    const duplicate = expectInvalid(
      validScene({
        cameras: [
          {
            id: 'portrait',
            position: [0, 0, 3],
            target: [0, 0, 0],
            fov: 30,
          },
          {
            id: 'portrait',
            position: [0, 1, 3],
            target: [0, 0, 0],
            fov: 45,
          },
        ],
      }),
    );
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.errors).toContainEqual(
        expect.objectContaining({
          path: 'definition.cameras[1].id',
          reason: 'duplicate-id',
        }),
      );
    }

    const missingActive = expectInvalid(validScene({ activeCamera: 'missing' }));
    expect(missingActive.ok).toBe(false);
    if (!missingActive.ok) {
      expect(missingActive.errors).toContainEqual(
        expect.objectContaining({
          path: 'definition.activeCamera',
          reason: 'invalid-reference',
        }),
      );
    }
  });

  it('rejects invalid vectors and non-finite numeric values', () => {
    const badVector = expectInvalid(
      validScene({
        cameras: [
          {
            id: 'portrait',
            position: [0, Number.NaN, 4.5],
            target: [0, 1.1, 0],
            fov: 30,
          },
        ],
      }),
    );
    expect(badVector.ok).toBe(false);
    if (!badVector.ok) {
      expect(badVector.errors).toContainEqual(
        expect.objectContaining({
          path: 'definition.cameras[0].position[1]',
          reason: 'invalid-value',
        }),
      );
    }

    const badNumber = expectInvalid(
      validScene({
        lights: [{ type: 'ambient', color: '#fff', intensity: Number.POSITIVE_INFINITY }],
      }),
    );
    expect(badNumber.ok).toBe(false);
    if (!badNumber.ok) {
      expect(badNumber.errors).toContainEqual(
        expect.objectContaining({
          path: 'definition.lights[0].intensity',
          reason: 'invalid-value',
        }),
      );
    }
  });

  it('rejects invalid camera fov, near, and far, and warns on very high fov', () => {
    const invalidFov = expectInvalid(
      validScene({
        cameras: [{ id: 'portrait', position: [0, 0, 3], target: [0, 0, 0], fov: 180 }],
      }),
    );
    expect(invalidFov.ok).toBe(false);
    if (!invalidFov.ok) {
      expect(invalidFov.errors).toContainEqual(
        expect.objectContaining({ path: 'definition.cameras[0].fov' }),
      );
    }

    const invalidNearFar = expectInvalid(
      validScene({
        cameras: [
          {
            id: 'portrait',
            position: [0, 0, 3],
            target: [0, 0, 0],
            fov: 30,
            near: 2,
            far: 1,
          },
        ],
      }),
    );
    expect(invalidNearFar.ok).toBe(false);
    if (!invalidNearFar.ok) {
      expect(invalidNearFar.errors).toContainEqual(
        expect.objectContaining({ path: 'definition.cameras[0].far' }),
      );
    }

    const highFov = validatePresentationSceneDefinition(
      validScene({
        cameras: [{ id: 'portrait', position: [0, 0, 3], target: [0, 0, 0], fov: 121 }],
      }),
    );
    expect(highFov.ok).toBe(true);
    expect(highFov.warnings).toContainEqual(
      expect.objectContaining({
        path: 'definition.cameras[0].fov',
        reason: 'invalid-value',
      }),
    );
  });

  it('accepts omitted or empty lights and models', () => {
    const omitted = validatePresentationSceneDefinition(
      validScene({ lights: undefined, models: undefined }),
    );
    expect(omitted.ok).toBe(true);
    if (omitted.ok) {
      expect(omitted.definition.lights).toBeUndefined();
      expect(omitted.definition.models).toBeUndefined();
    }

    const empty = validatePresentationSceneDefinition(validScene({ lights: [], models: [] }));
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.definition.lights).toEqual([]);
      expect(empty.definition.models).toEqual([]);
    }
  });

  it('rejects unsupported light types, invalid colors, invalid intensity, and duplicate light IDs', () => {
    const invalidLight = expectInvalid(
      validScene({
        lights: [
          { id: 'sun', type: 'spot', color: '#ffffff', intensity: 1 },
          { id: 'bad-color', type: 'ambient', color: 'white', intensity: 1 },
          { id: 'bad-intensity', type: 'point', color: '#ffffff', intensity: -1 },
          { id: 'sun', type: 'directional', color: '#ffffff', intensity: 1 },
        ],
      }),
    );

    expect(invalidLight.ok).toBe(false);
    if (!invalidLight.ok) {
      expect(invalidLight.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'definition.lights[0].type',
            reason: 'unsupported-value',
          }),
          expect.objectContaining({ path: 'definition.lights[1].color' }),
          expect.objectContaining({ path: 'definition.lights[2].intensity' }),
        ]),
      );
    }
  });

  it('rejects duplicate model IDs and invalid model paths', () => {
    const duplicate = expectInvalid(
      validScene({
        models: [
          { id: 'character', path: 'r3d/models/a.glb' },
          { id: 'character', path: 'r3d/models/b.glb' },
        ],
      }),
    );
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.errors).toContainEqual(
        expect.objectContaining({
          path: 'definition.models[1].id',
          reason: 'duplicate-id',
        }),
      );
    }

    for (const path of ['', '/absolute.glb', 'C:/absolute.glb', 'file://a.glb', '../a.glb']) {
      const result = expectInvalid(validScene({ models: [{ id: 'character', path }] }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ path: 'definition.models[0].path' }),
        );
      }
    }
  });

  it('normalizes model path backslashes before returning the typed definition', () => {
    const result = validatePresentationSceneDefinition(
      validScene({ models: [{ id: 'character', path: 'r3d\\models\\character.glb' }] }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.definition.models?.[0]?.path).toBe('r3d/models/character.glb');
    }
  });

  it('rejects vector scale, non-positive scale, invalid fit height, and invalid fit origin', () => {
    const invalidModelShape = expectInvalid(
      validScene({
        models: [
          {
            id: 'character',
            path: 'r3d/models/character.glb',
            scale: [1, 1, 1],
            fit: { height: 0, origin: 'feet' },
          },
        ],
      }),
    );

    expect(invalidModelShape.ok).toBe(false);
    if (!invalidModelShape.ok) {
      expect(invalidModelShape.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'definition.models[0].scale' }),
          expect.objectContaining({ path: 'definition.models[0].fit.height' }),
          expect.objectContaining({ path: 'definition.models[0].fit.origin' }),
        ]),
      );
    }

    const nonPositiveScale = expectInvalid(
      validScene({ models: [{ id: 'character', path: 'r3d/models/character.glb', scale: 0 }] }),
    );
    expect(nonPositiveScale.ok).toBe(false);
  });

  it('rejects concepts outside the first-version scene definition contract', () => {
    const result = expectInvalid(
      validScene({
        layout: { placement: 'right' },
        timeline: [],
        nodes: [],
        scripts: [],
        physics: {},
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'definition.layout', reason: 'unknown-field' }),
          expect.objectContaining({ path: 'definition.timeline', reason: 'unknown-field' }),
          expect.objectContaining({ path: 'definition.nodes', reason: 'unknown-field' }),
          expect.objectContaining({ path: 'definition.scripts', reason: 'unknown-field' }),
          expect.objectContaining({ path: 'definition.physics', reason: 'unknown-field' }),
        ]),
      );
    }
  });
});
