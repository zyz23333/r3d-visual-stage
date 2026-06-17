import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import ts from 'typescript';

installNodeFileReader();

const modelOutputPath = resolve('public/r3d/models/r3d-validation-character.glb');
const sceneOutputPath = resolve('public/r3d/scenes/r3d-validation-scene.r3dscene.json');
const validationSceneDefinition = {
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
    {
      id: 'wide',
      position: [0, 1.25, 7.0],
      target: [0, 1.05, 0],
      fov: 46,
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
};

await validateSceneDefinition(validationSceneDefinition);

const root = new THREE.Group();
root.name = 'R3D_ValidationCharacter';

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x5c8df6,
  roughness: 0.55,
  metalness: 0.05,
});
const accentMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd166,
  roughness: 0.45,
  metalness: 0.0,
});
const darkMaterial = new THREE.MeshStandardMaterial({
  color: 0x202840,
  roughness: 0.7,
  metalness: 0.0,
});

const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 8, 20), bodyMaterial);
body.name = 'R3D_ValidationBody';
body.position.y = 1.15;
root.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 16), accentMaterial);
head.name = 'R3D_ValidationHead';
head.position.y = 2.12;
root.add(head);

const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.04), darkMaterial);
visor.name = 'R3D_ValidationVisor';
visor.position.set(0, 2.16, 0.31);
root.add(visor);

const leftArm = createArm('R3D_ValidationLeftArm', -0.52, bodyMaterial);
const rightArm = createArm('R3D_ValidationRightArm', 0.52, bodyMaterial);
root.add(leftArm, rightArm);

const idleClip = new THREE.AnimationClip('Idle', 2, [
  new THREE.VectorKeyframeTrack(
    'R3D_ValidationCharacter.position',
    [0, 1, 2],
    [0, 0, 0, 0, 0.06, 0, 0, 0, 0],
  ),
  new THREE.QuaternionKeyframeTrack(
    'R3D_ValidationCharacter.quaternion',
    [0, 1, 2],
    quaternionValues([0, 0, 0], [0, 0.08, 0], [0, 0, 0]),
  ),
]);

const waveClip = new THREE.AnimationClip('Wave', 1.4, [
  new THREE.QuaternionKeyframeTrack(
    'R3D_ValidationRightArm.quaternion',
    [0, 0.28, 0.56, 0.84, 1.12, 1.4],
    quaternionValues(
      [0, 0, -0.35],
      [0, 0, -1.25],
      [0.45, 0, -1.05],
      [-0.45, 0, -1.05],
      [0.3, 0, -1.2],
      [0, 0, -0.35],
    ),
  ),
]);

const exporter = new GLTFExporter();
const arrayBuffer = await parseGlb(exporter, root, [idleClip, waveClip]);
const glb = Buffer.from(arrayBuffer);
const sceneJson = `${JSON.stringify(validationSceneDefinition, null, 2)}\n`;

await mkdir(dirname(modelOutputPath), { recursive: true });
await mkdir(dirname(sceneOutputPath), { recursive: true });

await writeFile(modelOutputPath, glb);
await writeFile(sceneOutputPath, sceneJson, 'utf8');
console.log(`Generated ${modelOutputPath}`);
console.log(`Generated ${sceneOutputPath}`);

function createArm(name, x, material) {
  const arm = new THREE.Group();
  arm.name = name;
  arm.position.set(x, 1.65, 0);
  arm.rotation.z = x > 0 ? -0.35 : 0.35;

  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.72, 8, 12), material);
  mesh.position.y = -0.38;
  arm.add(mesh);
  return arm;
}

function quaternionValues(...eulerTriples) {
  return eulerTriples.flatMap(([x, y, z]) => {
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    return quaternion.toArray();
  });
}

function parseGlb(exporter, rootObject, animations) {
  return new Promise((resolveParse, rejectParse) => {
    exporter.parse(rootObject, resolveParse, rejectParse, {
      animations,
      binary: true,
      onlyVisible: true,
      trs: false,
    });
  });
}

async function validateSceneDefinition(definition) {
  const sourcePath = resolve('src/presentationSceneDefinition.ts');
  const source = await readFile(sourcePath, 'utf8');
  // Keep the generated asset script independent from the app build while reusing the validator.
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
    fileName: sourcePath,
  });
  const encodedModule = Buffer.from(outputText, 'utf8').toString('base64');
  const moduleUrl = `data:text/javascript;base64,${encodedModule}`;
  const { validatePresentationSceneDefinition } = await import(moduleUrl);
  const result = validatePresentationSceneDefinition(definition);

  if (!result.ok) {
    const details = result.errors
      .map((issue) => `${issue.path}: ${issue.message} (${issue.reason})`)
      .join('\n');
    throw new Error(`Generated validation scene is invalid:\n${details}`);
  }
}

function installNodeFileReader() {
  if (globalThis.FileReader) {
    return;
  }

  globalThis.FileReader = class NodeFileReader {
    result = null;
    onloadend = null;

    async readAsArrayBuffer(blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.();
    }

    async readAsDataURL(blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
      this.onloadend?.();
    }
  };
}
