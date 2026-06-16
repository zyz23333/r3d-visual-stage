import { describe, expect, it, vi } from 'vitest';

import {
  loadScenePath,
  type PresentationSceneRuntimeControl,
  type SceneFileTextLoader,
  validateProjectRelativePath,
} from './sceneControl';

function createRuntime(
  loadDefinition: PresentationSceneRuntimeControl['loadDefinition'] = vi.fn(async () => true),
): PresentationSceneRuntimeControl {
  let currentToken = 0;
  return {
    reserveLoadToken: vi.fn(() => {
      currentToken += 1;
      return currentToken;
    }),
    isLoadTokenCurrent: vi.fn((token) => token === currentToken),
    loadDefinition,
    show: vi.fn(),
    hide: vi.fn(),
    setCamera: vi.fn(() => true),
    play: vi.fn(() => true),
    update: vi.fn(),
    dispose: vi.fn(),
  };
}

function createLoader(load: SceneFileTextLoader['load']): SceneFileTextLoader {
  return { load };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

describe('scene control path loading', () => {
  it('normalizes backslashes and rejects unsafe scene paths', () => {
    expect(validateProjectRelativePath('r3d\\scenes\\scene.r3dscene.json')).toEqual({
      ok: true,
      path: 'r3d/scenes/scene.r3dscene.json',
    });

    for (const path of [
      '',
      '/r3d/scene.r3dscene.json',
      'C:/game/r3d/scene.r3dscene.json',
      'file://r3d/scene.r3dscene.json',
      'https://example.test/scene.r3dscene.json',
      '//example.test/scene.r3dscene.json',
      'r3d/../scene.r3dscene.json',
      'r3d//scene.r3dscene.json',
    ]) {
      expect(validateProjectRelativePath(path).ok).toBe(false);
    }
  });

  it('loads strict JSON text and delegates to the runtime with the reserved token', async () => {
    const loadDefinition = vi.fn(async () => true);
    const runtime = createRuntime(loadDefinition);
    const loader = createLoader(vi.fn(async () => '{"schemaVersion":1,"id":"scene"}'));

    await expect(loadScenePath(runtime, loader, 'r3d\\scenes\\scene.r3dscene.json')).resolves.toBe(
      true,
    );

    expect(loader.load).toHaveBeenCalledWith('r3d/scenes/scene.r3dscene.json');
    expect(loadDefinition).toHaveBeenCalledWith({ schemaVersion: 1, id: 'scene' }, 1);
  });

  it('returns false for load failures and JSON parse failures before runtime validation', async () => {
    const runtime = createRuntime();

    await expect(
      loadScenePath(
        runtime,
        createLoader(vi.fn(async () => Promise.reject(new Error('404')))),
        'a',
      ),
    ).resolves.toBe(false);

    await expect(
      loadScenePath(runtime, createLoader(vi.fn(async () => '{bad json')), 'a'),
    ).resolves.toBe(false);

    expect(runtime.loadDefinition).not.toHaveBeenCalled();
  });

  it('prevents a stale scene file load from mutating the runtime', async () => {
    const firstLoad = deferred<string>();
    const runtime = createRuntime();
    const loader = createLoader(vi.fn(() => firstLoad.promise));

    const staleResult = loadScenePath(runtime, loader, 'r3d/scenes/stale.r3dscene.json');
    runtime.reserveLoadToken();
    firstLoad.resolve('{"schemaVersion":1}');

    await expect(staleResult).resolves.toBe(false);
    expect(runtime.loadDefinition).not.toHaveBeenCalled();
  });
});
