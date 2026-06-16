import * as THREE from 'three';

export interface SceneMixerRecord {
  mixer: THREE.AnimationMixer;
  root: THREE.Object3D;
}

export interface DisposeSceneResourcesOptions {
  mixers?: readonly SceneMixerRecord[];
  warn?: (message: string, error?: unknown) => void;
}

export interface DisposeSceneResourcesResult {
  geometries: number;
  materials: number;
  textures: number;
  skeletons: number;
  mixers: number;
}

const MATERIAL_TEXTURE_KEYS = [
  'alphaMap',
  'aoMap',
  'bumpMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'gradientMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'lightMap',
  'map',
  'matcap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'specularColorMap',
  'specularIntensityMap',
  'specularMap',
  'thicknessMap',
  'transmissionMap',
] as const;

export function disposeSceneResources(
  root: THREE.Object3D,
  options: DisposeSceneResourcesOptions = {},
): DisposeSceneResourcesResult {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const skeletons = new Set<THREE.Skeleton>();

  root.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
      skeleton?: THREE.Skeleton;
    };

    if (renderable.geometry) {
      geometries.add(renderable.geometry);
    }

    for (const material of normalizeMaterials(renderable.material)) {
      materials.add(material);
      collectMaterialTextures(material, textures);
    }

    if (renderable.skeleton) {
      skeletons.add(renderable.skeleton);
    }
  });

  for (const mixerRecord of options.mixers ?? []) {
    safely(
      `Failed to stop or uncache mixer root: ${mixerRecord.root.name || mixerRecord.root.uuid}`,
      options.warn,
      () => {
        mixerRecord.mixer.stopAllAction();
        mixerRecord.mixer.uncacheRoot(mixerRecord.root);
      },
    );
  }

  for (const texture of textures) {
    closeTextureImage(texture, options.warn);
    safely(`Failed to dispose texture: ${texture.name || texture.uuid}`, options.warn, () => {
      texture.dispose();
    });
  }

  for (const material of materials) {
    safely(`Failed to dispose material: ${material.name || material.uuid}`, options.warn, () => {
      material.dispose();
    });
  }

  for (const geometry of geometries) {
    safely(`Failed to dispose geometry: ${geometry.name || geometry.uuid}`, options.warn, () => {
      geometry.dispose();
    });
  }

  for (const skeleton of skeletons) {
    safely('Failed to dispose skeleton.', options.warn, () => {
      skeleton.dispose();
    });
  }

  return {
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
    skeletons: skeletons.size,
    mixers: options.mixers?.length ?? 0,
  };
}

function normalizeMaterials(
  material: THREE.Material | THREE.Material[] | undefined,
): THREE.Material[] {
  if (!material) {
    return [];
  }

  return Array.isArray(material) ? material : [material];
}

function collectMaterialTextures(material: THREE.Material, textures: Set<THREE.Texture>): void {
  const materialRecord = material as unknown as Record<string, unknown>;
  for (const key of MATERIAL_TEXTURE_KEYS) {
    const texture = materialRecord[key];
    if (texture instanceof THREE.Texture) {
      textures.add(texture);
    }
  }
}

function closeTextureImage(
  texture: THREE.Texture,
  warn?: DisposeSceneResourcesOptions['warn'],
): void {
  const sourceData = texture.source?.data;
  const image = texture.image;

  closeImageBitmapLike(
    sourceData,
    `Failed to close texture source data: ${texture.name || texture.uuid}`,
    warn,
  );

  if (image !== sourceData) {
    closeImageBitmapLike(
      image,
      `Failed to close texture image: ${texture.name || texture.uuid}`,
      warn,
    );
  }
}

function closeImageBitmapLike(
  value: unknown,
  message: string,
  warn?: DisposeSceneResourcesOptions['warn'],
): void {
  const closeable = value as { close?: unknown } | undefined;
  const close = closeable?.close;
  if (typeof close !== 'function') {
    return;
  }

  safely(message, warn, () => {
    close.call(closeable);
  });
}

function safely(
  message: string,
  warn: DisposeSceneResourcesOptions['warn'],
  action: () => void,
): void {
  try {
    action();
  } catch (error) {
    warn?.(message, error);
  }
}
