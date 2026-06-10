import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

installNodeFileReader();

const outputPath = resolve('public/models/r3d-demo-character.glb');

const root = new THREE.Group();
root.name = 'R3D_DemoCharacter';

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
body.name = 'R3D_DemoBody';
body.position.y = 1.15;
root.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 16), accentMaterial);
head.name = 'R3D_DemoHead';
head.position.y = 2.12;
root.add(head);

const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.04), darkMaterial);
visor.name = 'R3D_DemoVisor';
visor.position.set(0, 2.16, 0.31);
root.add(visor);

const leftArm = createArm('R3D_DemoLeftArm', -0.52, bodyMaterial);
const rightArm = createArm('R3D_DemoRightArm', 0.52, bodyMaterial);
root.add(leftArm, rightArm);

const idleClip = new THREE.AnimationClip('Idle', 2, [
  new THREE.VectorKeyframeTrack(
    'R3D_DemoCharacter.position',
    [0, 1, 2],
    [0, 0, 0, 0, 0.06, 0, 0, 0, 0],
  ),
  new THREE.QuaternionKeyframeTrack(
    'R3D_DemoCharacter.quaternion',
    [0, 1, 2],
    quaternionValues([0, 0, 0], [0, 0.08, 0], [0, 0, 0]),
  ),
]);

const waveClip = new THREE.AnimationClip('Wave', 1.4, [
  new THREE.QuaternionKeyframeTrack(
    'R3D_DemoRightArm.quaternion',
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

await mkdir(dirname(outputPath), { recursive: true });
const exporter = new GLTFExporter();
const arrayBuffer = await parseGlb(exporter, root, [idleClip, waveClip]);

await writeFile(outputPath, Buffer.from(arrayBuffer));
console.log(`Generated ${outputPath}`);

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
