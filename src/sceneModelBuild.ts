import * as THREE from 'three';

import type {
  PresentationModelDefinitionV1,
  PresentationModelFitDefinitionV1,
} from './presentationSceneDefinition';

const MIN_FIT_AXIS_SIZE = 0.000001;

export function applyPresentationModelPlacement(
  model: THREE.Object3D,
  definition: Pick<PresentationModelDefinitionV1, 'position' | 'rotation' | 'scale' | 'fit'>,
): void {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);

  if (definition.fit) {
    applyPresentationModelFit(model, definition.fit);
  }

  const declaredScale = definition.scale ?? 1;
  model.scale.multiplyScalar(declaredScale);
  model.position.multiplyScalar(declaredScale);

  if (definition.rotation) {
    model.rotation.set(definition.rotation[0], definition.rotation[1], definition.rotation[2]);
  }

  if (definition.position) {
    model.position.add(new THREE.Vector3(...definition.position));
  }

  model.updateMatrixWorld(true);
}

export function applyPresentationModelFit(
  model: THREE.Object3D,
  fit: PresentationModelFitDefinitionV1,
): void {
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) {
    throw new Error('Cannot fit model because its bounding box is empty.');
  }

  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= MIN_FIT_AXIS_SIZE) {
    throw new Error(`Cannot fit model because its Y-axis height is ${size.y}.`);
  }

  const scale = fit.height / size.y;
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  const minY = box.min.y * scale;

  model.scale.multiplyScalar(scale);

  if (fit.origin === 'center') {
    model.position.sub(center);
  } else if (fit.origin === 'center-bottom') {
    model.position.x -= center.x;
    model.position.y -= minY;
    model.position.z -= center.z;
  } else {
    const exhaustive: never = fit.origin;
    throw new Error(`Unsupported model fit origin: ${exhaustive}`);
  }

  model.updateMatrixWorld(true);
}

export function findAnimationClipExact(
  clips: readonly THREE.AnimationClip[],
  clipName: string,
): THREE.AnimationClip | undefined {
  return clips.find((clip) => clip.name === clipName);
}
