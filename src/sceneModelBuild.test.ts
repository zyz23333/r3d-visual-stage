import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  applyPresentationModelFit,
  applyPresentationModelPlacement,
  findAnimationClipExact,
} from './sceneModelBuild';

describe('applyPresentationModelFit', () => {
  it('scales by Y-axis height instead of longest axis and supports center origin', () => {
    const model = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1));

    applyPresentationModelFit(model, { height: 6, origin: 'center' });
    model.updateMatrixWorld(true);

    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    expect(size.toArray()).toEqual([12, 6, 3]);
    expect(center.toArray()).toEqual([0, 0, 0]);
  });

  it('supports center-bottom origin', () => {
    const model = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));

    applyPresentationModelFit(model, { height: 2, origin: 'center-bottom' });
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    expect(box.min.y).toBeCloseTo(0);
    expect(box.max.y).toBeCloseTo(2);
    expect(box.getCenter(new THREE.Vector3()).x).toBeCloseTo(0);
    expect(box.getCenter(new THREE.Vector3()).z).toBeCloseTo(0);
  });

  it('fails clearly when the model has no usable Y-axis height', () => {
    const model = new THREE.Group();

    expect(() => applyPresentationModelFit(model, { height: 2, origin: 'center' })).toThrow(
      /bounding box is empty/,
    );
  });
});

describe('applyPresentationModelPlacement', () => {
  it('applies fit before declared scale, rotation, and position', () => {
    const model = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1));

    applyPresentationModelPlacement(model, {
      fit: { height: 3, origin: 'center-bottom' },
      scale: 2,
      rotation: [0, Math.PI / 2, 0],
      position: [1, 2, 3],
    });
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    expect(model.scale.toArray()).toEqual([3, 3, 3]);
    expect(model.rotation.y).toBeCloseTo(Math.PI / 2);
    expect(box.min.y).toBeCloseTo(2);
    expect(box.max.y).toBeCloseTo(8);
    expect(box.getCenter(new THREE.Vector3()).x).toBeCloseTo(1);
    expect(box.getCenter(new THREE.Vector3()).z).toBeCloseTo(3);
  });
});

describe('findAnimationClipExact', () => {
  it('uses exact case-sensitive matching only', () => {
    const idle = new THREE.AnimationClip('Idle', 1, []);
    const wave = new THREE.AnimationClip('Wave', 1, []);
    const clips = [idle, wave];

    expect(findAnimationClipExact(clips, 'Wave')).toBe(wave);
    expect(findAnimationClipExact(clips, 'wave')).toBeUndefined();
    expect(findAnimationClipExact(clips, 'av')).toBeUndefined();
    expect(findAnimationClipExact(clips, 'Idle ')).toBeUndefined();
  });
});
