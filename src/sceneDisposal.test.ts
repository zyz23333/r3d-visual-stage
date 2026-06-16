import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

import { disposeSceneResources } from './sceneDisposal';

describe('disposeSceneResources', () => {
  it('deduplicates shared geometries, materials, textures, and skeletons', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      normalMap: texture,
    });
    const skeleton = new THREE.Skeleton([new THREE.Bone()]);
    const first = new THREE.SkinnedMesh(geometry, material);
    const second = new THREE.SkinnedMesh(geometry, material);
    first.bind(skeleton);
    second.bind(skeleton);
    root.add(first, second);

    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const textureDispose = vi.spyOn(texture, 'dispose');
    const skeletonDispose = vi.spyOn(skeleton, 'dispose');

    const result = disposeSceneResources(root);

    expect(result).toMatchObject({
      geometries: 1,
      materials: 1,
      textures: 1,
      skeletons: 1,
      mixers: 0,
    });
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(skeletonDispose).toHaveBeenCalledTimes(1);
  });

  it('closes ImageBitmap-like texture data and continues after close failures', () => {
    const root = new THREE.Group();
    const closeableSource = { close: vi.fn(() => undefined) };
    const closeableImage = {
      close: vi.fn(() => {
        throw new Error('close failed');
      }),
    };
    const texture = new THREE.Texture(closeableSource);
    Object.defineProperty(texture, 'image', {
      configurable: true,
      value: closeableImage,
    });
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.BufferGeometry();
    const mesh = new THREE.Mesh(geometry, material);
    root.add(mesh);

    const warn = vi.fn();
    const textureDispose = vi.spyOn(texture, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const geometryDispose = vi.spyOn(geometry, 'dispose');

    disposeSceneResources(root, { warn });

    expect(closeableSource.close).toHaveBeenCalledTimes(1);
    expect(closeableImage.close).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to close texture image'),
      expect.any(Error),
    );
    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
  });

  it('stops mixers and uncaches their roots', () => {
    const root = new THREE.Group();
    const mixer = new THREE.AnimationMixer(root);
    const stopAllAction = vi.spyOn(mixer, 'stopAllAction');
    const uncacheRoot = vi.spyOn(mixer, 'uncacheRoot');

    const result = disposeSceneResources(root, {
      mixers: [{ mixer, root }],
    });

    expect(result.mixers).toBe(1);
    expect(stopAllAction).toHaveBeenCalledTimes(1);
    expect(uncacheRoot).toHaveBeenCalledWith(root);
  });
});
