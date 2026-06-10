import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { OverlayConfig } from './config';
import { logError, logInfo, logWarning } from './diagnostics';
import { DomOverlay } from './domOverlay';

export class CharacterStage {
  private readonly config: OverlayConfig;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private readonly clock = new THREE.Clock();
  private readonly loader = new GLTFLoader();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly domOverlay: DomOverlay;
  private mixer?: THREE.AnimationMixer;
  private model?: THREE.Object3D;
  private clips = new Map<string, THREE.AnimationClip>();
  private currentAction?: THREE.AnimationAction;
  private lastRenderMs = 0;
  private isVisible = false;
  private hasLoadedDefault = false;

  public constructor(config: OverlayConfig) {
    this.config = config;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.maxPixelRatio));

    this.domOverlay = new DomOverlay(this.renderer.domElement, config);
    this.camera.position.set(0, 1.35, 4.5);
    this.camera.lookAt(0, 1.1, 0);
    this.installLights();
  }

  public show(): void {
    this.isVisible = true;
    this.domOverlay.show();

    if (!this.hasLoadedDefault && this.config.defaultCharacterPath) {
      this.hasLoadedDefault = true;
      void this.loadCharacter(this.config.defaultCharacterPath);
    }
  }

  public hide(): void {
    this.isVisible = false;
    this.domOverlay.hide();
  }

  public async loadCharacter(path: string): Promise<void> {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      logWarning('LoadCharacter ignored because the path was empty.');
      return;
    }

    try {
      const gltf = await this.loader.loadAsync(trimmedPath);
      this.replaceModel(gltf.scene, gltf.animations);
      logInfo(`Loaded character: ${trimmedPath}`, {
        animations: gltf.animations.map((clip) => clip.name),
      });
      this.play('Idle');
    } catch (error) {
      logError(`Failed to load character: ${trimmedPath}`, error);
    }
  }

  public play(clipName: string): boolean {
    const trimmedName = clipName.trim();
    if (!trimmedName) {
      logWarning('Play ignored because the animation name was empty.');
      return false;
    }

    if (!this.mixer) {
      logWarning(`Cannot play "${trimmedName}" because no character is loaded.`);
      return false;
    }

    const clip = this.findClip(trimmedName);
    if (!clip) {
      logWarning(`Animation clip not found: ${trimmedName}`, {
        available: [...this.clips.keys()],
      });
      return false;
    }

    const nextAction = this.mixer.clipAction(clip);
    nextAction.enabled = true;
    nextAction.reset();
    nextAction.fadeIn(0.15);
    nextAction.play();

    if (this.currentAction && this.currentAction !== nextAction) {
      this.currentAction.fadeOut(0.15);
    }

    this.currentAction = nextAction;
    return true;
  }

  public reactToOkInput(): void {
    if (!this.isVisible) {
      return;
    }

    if (!this.play('Wave')) {
      this.play('Idle');
    }
  }

  public update(nowMs: number): void {
    if (!this.isVisible) {
      return;
    }

    const minFrameMs = 1000 / this.config.targetFps;
    if (nowMs - this.lastRenderMs < minFrameMs) {
      return;
    }
    this.lastRenderMs = nowMs;

    const viewport = this.domOverlay.updateLayout();
    this.renderer.setSize(viewport.width, viewport.height, false);
    this.camera.aspect = viewport.width / viewport.height;
    this.camera.updateProjectionMatrix();

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.mixer?.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.disposeCurrentModel();
    this.renderer.dispose();
    this.domOverlay.dispose();
  }

  private installLights(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x404050, 2.4);
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    const fill = new THREE.DirectionalLight(0x9fc4ff, 1.2);

    key.position.set(2, 4, 4);
    fill.position.set(-3, 2, 2);
    this.scene.add(hemi, key, fill);
  }

  private replaceModel(model: THREE.Object3D, animations: THREE.AnimationClip[]): void {
    this.disposeCurrentModel();
    this.model = model;
    this.scene.add(model);
    this.frameModel(model);

    this.mixer = new THREE.AnimationMixer(model);
    this.clips = new Map(animations.map((clip) => [clip.name.toLowerCase(), clip]));
  }

  private frameModel(model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const targetHeight = 2.4;
    const scale = targetHeight / maxAxis;

    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y += 1.15;
    model.rotation.y = -0.2;
  }

  private findClip(clipName: string): THREE.AnimationClip | undefined {
    const exact = this.clips.get(clipName.toLowerCase());
    if (exact) {
      return exact;
    }

    return [...this.clips.values()].find((clip) =>
      clip.name.toLowerCase().includes(clipName.toLowerCase()),
    );
  }

  private disposeCurrentModel(): void {
    if (!this.model) {
      return;
    }

    this.scene.remove(this.model);
    this.model.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else if (material) {
        material.dispose();
      }
    });

    this.mixer?.stopAllAction();
    this.mixer = undefined;
    this.currentAction = undefined;
    this.model = undefined;
    this.clips.clear();
  }
}
