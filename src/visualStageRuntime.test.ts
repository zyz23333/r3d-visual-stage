import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

import type { VisualStageRuntimeConfig } from './config';
import {
  type LoadedPresentationModel,
  VisualStageRuntime,
  type VisualStageRenderer,
} from './visualStageRuntime';

const CONFIG: VisualStageRuntimeConfig = {
  stagePlacement: 'right',
  stageWidth: 280,
  targetFps: 30,
  maxPixelRatio: 1.5,
};

function sceneDefinition(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: 'scene-a',
    cameras: [
      {
        id: 'portrait',
        position: [0, 1, 5],
        target: [0, 1, 0],
        fov: 30,
      },
      {
        id: 'wide',
        position: [0, 2, 8],
        target: [0, 1, 0],
        fov: 45,
      },
    ],
    activeCamera: 'portrait',
    lights: [{ id: 'ambient', type: 'ambient', color: '#fff', intensity: 1 }],
    models: [
      {
        id: 'character',
        path: 'r3d/models/character.glb',
        fit: { height: 2, origin: 'center-bottom' },
        animation: 'Idle',
      },
    ],
    ...overrides,
  };
}

function createBoxModel(): LoadedPresentationModel {
  return {
    scene: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()),
    animations: [
      new THREE.AnimationClip('Idle', 1, []),
      new THREE.AnimationClip('Wave', 1, []),
    ],
  };
}

function createRuntime(
  load: (path: string) => Promise<LoadedPresentationModel> = async () => createBoxModel(),
) {
  const renderer = createFakeRenderer();
  const domLayer = createFakeDomLayer();
  const runtime = new VisualStageRuntime(CONFIG, {
    createRenderer: () => renderer,
    createDomLayer: () => domLayer,
    modelLoader: { load },
  });

  return { domLayer, renderer, runtime };
}

function createFakeRenderer(): VisualStageRenderer {
  const canvas = {} as HTMLCanvasElement;
  const setClearColor: VisualStageRenderer['setClearColor'] = vi.fn();
  const setPixelRatio: VisualStageRenderer['setPixelRatio'] = vi.fn();
  const setSize: VisualStageRenderer['setSize'] = vi.fn();
  const render: VisualStageRenderer['render'] = vi.fn();
  const dispose: VisualStageRenderer['dispose'] = vi.fn();

  return {
    domElement: canvas,
    outputColorSpace: '',
    setClearColor,
    setPixelRatio,
    setSize,
    render,
    dispose,
  };
}

function createFakeDomLayer() {
  let visible = false;
  const viewport = { width: 280, height: 720 };
  return {
    show: vi.fn(() => {
      visible = true;
    }),
    hide: vi.fn(() => {
      visible = false;
    }),
    updateLayout: vi.fn(() => viewport),
    dispose: vi.fn(),
    diagnostics: vi.fn(() => ({
      display: visible ? 'block' : 'none',
      isBodyLastChild: true,
      isMounted: true,
      viewport,
      zIndex: '4',
    })),
  };
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

describe('VisualStageRuntime', () => {
  it('promotes a validated in-memory scene and can switch cameras, play clips, update, and dispose', async () => {
    const { domLayer, renderer, runtime } = createRuntime();

    await expect(runtime.loadDefinition(sceneDefinition())).resolves.toBe(true);

    expect(runtime.diagnostics()).toMatchObject({
      activeCameraId: 'portrait',
      activeSceneId: 'scene-a',
      cameraIds: ['portrait', 'wide'],
      isVisible: true,
      modelIds: ['character'],
    });
    expect(domLayer.show).toHaveBeenCalledTimes(1);
    expect(runtime.setCamera('wide')).toBe(true);
    expect(runtime.play('character', 'Wave')).toBe(true);

    runtime.update(1000);

    expect(renderer.setSize).toHaveBeenCalledWith(280, 720, false);
    expect(renderer.render).toHaveBeenCalledTimes(1);

    runtime.dispose();
    runtime.dispose();

    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(domLayer.dispose).toHaveBeenCalledTimes(1);
    expect(runtime.diagnostics().disposed).toBe(true);
  });

  it('accepts omitted lights and models without adding fallback lights', async () => {
    const load = vi.fn(async () => createBoxModel());
    const { runtime } = createRuntime(load);

    await expect(
      runtime.loadDefinition(sceneDefinition({ lights: undefined, models: undefined })),
    ).resolves.toBe(true);

    expect(load).not.toHaveBeenCalled();
    expect(runtime.diagnostics()).toMatchObject({
      modelIds: [],
      rootChildCount: 0,
    });
  });

  it('preserves the active scene and visibility when a later model load fails', async () => {
    const load = vi
      .fn<(path: string) => Promise<LoadedPresentationModel>>()
      .mockResolvedValueOnce(createBoxModel())
      .mockRejectedValueOnce(new Error('missing model'));
    const { domLayer, runtime } = createRuntime(load);

    await expect(runtime.loadDefinition(sceneDefinition({ id: 'good' }))).resolves.toBe(true);
    runtime.hide();
    const beforeFailure = runtime.diagnostics();

    await expect(runtime.loadDefinition(sceneDefinition({ id: 'bad' }))).resolves.toBe(false);

    expect(runtime.diagnostics()).toMatchObject({
      activeCameraId: beforeFailure.activeCameraId,
      activeSceneId: 'good',
      isVisible: false,
      rootUuid: beforeFailure.rootUuid,
    });
    expect(domLayer.show).toHaveBeenCalledTimes(1);
  });

  it('discards stale load completions and keeps the latest active scene', async () => {
    const firstLoad = deferred<LoadedPresentationModel>();
    const secondLoad = deferred<LoadedPresentationModel>();
    const load = vi
      .fn<(path: string) => Promise<LoadedPresentationModel>>()
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    const { runtime } = createRuntime(load);

    const staleResult = runtime.loadDefinition(
      sceneDefinition({
        id: 'stale',
        models: [{ id: 'stale-model', path: 'r3d/models/stale.glb' }],
      }),
    );
    const latestResult = runtime.loadDefinition(
      sceneDefinition({
        id: 'latest',
        models: [{ id: 'latest-model', path: 'r3d/models/latest.glb' }],
      }),
    );

    secondLoad.resolve(createBoxModel());
    await expect(latestResult).resolves.toBe(true);

    firstLoad.resolve(createBoxModel());
    await expect(staleResult).resolves.toBe(false);

    expect(runtime.diagnostics()).toMatchObject({
      activeSceneId: 'latest',
      modelIds: ['latest-model'],
    });
  });

  it('returns false for invalid camera and play requests without mutating active camera', async () => {
    const { runtime } = createRuntime();

    await expect(runtime.loadDefinition(sceneDefinition())).resolves.toBe(true);

    expect(runtime.setCamera('missing')).toBe(false);
    expect(runtime.diagnostics().activeCameraId).toBe('portrait');
    expect(runtime.play('missing', 'Wave')).toBe(false);
    expect(runtime.play('character', 'Missing')).toBe(false);
  });

  it('does not mutate visibility or active scene on validation failure', async () => {
    const { domLayer, runtime } = createRuntime();

    await expect(runtime.loadDefinition(sceneDefinition({ id: 'good' }))).resolves.toBe(true);
    runtime.hide();
    const beforeFailure = runtime.diagnostics();

    await expect(runtime.loadDefinition({ nope: true })).resolves.toBe(false);

    expect(runtime.diagnostics()).toMatchObject({
      activeSceneId: 'good',
      isVisible: false,
      rootUuid: beforeFailure.rootUuid,
    });
    expect(domLayer.show).toHaveBeenCalledTimes(1);
  });

  it('treats dispose as terminal', async () => {
    const { domLayer, renderer, runtime } = createRuntime();

    runtime.dispose();

    await expect(runtime.loadDefinition(sceneDefinition())).resolves.toBe(false);
    runtime.show();
    runtime.hide();

    expect(runtime.setCamera('portrait')).toBe(false);
    expect(runtime.play('character', 'Idle')).toBe(false);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(domLayer.show).not.toHaveBeenCalled();
    expect(domLayer.hide).not.toHaveBeenCalled();
  });
});
