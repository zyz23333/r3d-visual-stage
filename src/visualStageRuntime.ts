import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { VisualStageRuntimeConfig } from './config';
import { logError, logInfo, logWarning } from './diagnostics';
import { DomLayer, type DomLayerDiagnostics, type DomLayerViewport } from './domLayer';
import {
  type PresentationLightDefinitionV1,
  type PresentationModelDefinitionV1,
  type PresentationSceneDefinitionV1,
  type PresentationSceneVector3,
  validatePresentationSceneDefinition,
} from './presentationSceneDefinition';
import { disposeSceneResources, type SceneMixerRecord } from './sceneDisposal';
import { applyPresentationModelPlacement, findAnimationClipExact } from './sceneModelBuild';

export interface LoadedPresentationModel {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

export interface PresentationModelLoader {
  load(path: string): Promise<LoadedPresentationModel>;
}

export interface VisualStageRenderer {
  domElement: HTMLCanvasElement;
  outputColorSpace: string;
  setClearColor(color: THREE.ColorRepresentation, alpha?: number): void;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

export interface VisualStageDomLayer {
  show(): void;
  hide(): void;
  updateLayout(): DomLayerViewport;
  dispose(): void;
  diagnostics(): DomLayerDiagnostics;
}

export interface VisualStageRuntimeDependencies {
  createRenderer?: () => VisualStageRenderer;
  createDomLayer?: (
    canvas: HTMLCanvasElement,
    config: VisualStageRuntimeConfig,
  ) => VisualStageDomLayer;
  modelLoader?: PresentationModelLoader;
}

export interface VisualStageRuntimeDiagnostics {
  activeCameraId?: string;
  activeSceneId?: string;
  cameraIds: string[];
  disposed: boolean;
  isVisible: boolean;
  modelIds: string[];
  rootChildCount: number;
  rootUuid?: string;
}

interface PendingPresentationScene {
  id: string;
  root: THREE.Group;
  cameras: Map<string, THREE.PerspectiveCamera>;
  activeCameraId: string;
  models: Map<string, PresentationModelRuntimeRecord>;
}

interface PresentationModelRuntimeRecord {
  id: string;
  root: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  clips: Map<string, THREE.AnimationClip>;
  currentAction?: THREE.AnimationAction;
}

class GltfPresentationModelLoader implements PresentationModelLoader {
  private readonly loader = new GLTFLoader();

  public async load(path: string): Promise<LoadedPresentationModel> {
    const gltf = await this.loader.loadAsync(path);
    return {
      scene: gltf.scene,
      animations: gltf.animations,
    };
  }
}

export class VisualStageRuntime {
  private readonly config: VisualStageRuntimeConfig;
  private readonly scene = new THREE.Scene();
  private readonly clock = new THREE.Clock();
  private readonly renderer: VisualStageRenderer;
  private readonly domLayer: VisualStageDomLayer;
  private readonly modelLoader: PresentationModelLoader;
  private activeScene?: PendingPresentationScene;
  private loadToken = 0;
  private lastRenderMs = 0;
  private isVisible = false;
  private disposed = false;
  private hasLoggedFirstLayout = false;
  private hasLoggedFirstRender = false;

  public constructor(
    config: VisualStageRuntimeConfig,
    dependencies: VisualStageRuntimeDependencies = {},
  ) {
    this.config = config;
    this.renderer = dependencies.createRenderer?.() ?? createDefaultRenderer(config);
    this.modelLoader = dependencies.modelLoader ?? new GltfPresentationModelLoader();
    this.domLayer =
      dependencies.createDomLayer?.(this.renderer.domElement, config) ??
      new DomLayer(this.renderer.domElement, config);
  }

  public async loadDefinition(definition: unknown): Promise<boolean> {
    const token = ++this.loadToken;

    if (this.disposed) {
      logWarning('Scene load ignored because the Visual Stage runtime is disposed.');
      return false;
    }

    const validation = validatePresentationSceneDefinition(definition);
    if (!validation.ok) {
      logError('Scene definition validation failed.', {
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return false;
    }

    for (const warning of validation.warnings) {
      logWarning(`Scene definition warning at ${warning.path}: ${warning.message}`, warning);
    }

    logInfo(`Scene load started: ${validation.definition.id}`);

    let pending: PendingPresentationScene | undefined;
    try {
      pending = await this.buildPendingScene(validation.definition);
    } catch (error) {
      if (pending) {
        this.disposeScene(pending);
      }
      logError(`Failed to load Presentation Scene: ${validation.definition.id}`, error);
      return false;
    }

    if (this.disposed || token !== this.loadToken) {
      this.disposeScene(pending);
      logWarning(`Scene load completed stale and was discarded: ${validation.definition.id}`);
      return false;
    }

    const previousScene = this.activeScene;
    this.scene.add(pending.root);
    this.activeScene = pending;
    this.isVisible = true;
    this.domLayer.show();

    if (previousScene) {
      this.disposeScene(previousScene);
    }

    logInfo(`Scene promoted: ${pending.id}`, {
      activeCamera: pending.activeCameraId,
      cameras: [...pending.cameras.keys()],
      models: [...pending.models.keys()],
    });
    return true;
  }

  public show(): void {
    if (this.disposed) {
      logWarning('Show ignored because the Visual Stage runtime is disposed.');
      return;
    }

    this.isVisible = true;
    this.domLayer.show();
    if (!this.activeScene) {
      logWarning('Visual Stage shown without an active Presentation Scene.');
    }
  }

  public hide(): void {
    if (this.disposed) {
      logWarning('Hide ignored because the Visual Stage runtime is disposed.');
      return;
    }

    this.isVisible = false;
    this.domLayer.hide();
  }

  public setCamera(cameraId: string): boolean {
    const trimmedCameraId = cameraId.trim();
    if (!trimmedCameraId) {
      logWarning('Camera switch ignored because the camera ID was empty.');
      return false;
    }

    if (this.disposed) {
      logWarning(`Cannot switch camera "${trimmedCameraId}" because the runtime is disposed.`);
      return false;
    }

    if (!this.activeScene) {
      logWarning(`Cannot switch camera "${trimmedCameraId}" because no scene is active.`);
      return false;
    }

    if (!this.activeScene.cameras.has(trimmedCameraId)) {
      logWarning(`Presentation Camera not found: ${trimmedCameraId}`, {
        available: [...this.activeScene.cameras.keys()],
      });
      return false;
    }

    this.activeScene.activeCameraId = trimmedCameraId;
    logInfo(`Presentation Camera selected: ${trimmedCameraId}`);
    return true;
  }

  public play(modelId: string, clipName: string): boolean {
    const trimmedModelId = modelId.trim();
    const trimmedClipName = clipName.trim();

    if (!trimmedModelId || !trimmedClipName) {
      logWarning('Scene Play ignored because the model ID or animation name was empty.');
      return false;
    }

    if (this.disposed) {
      logWarning(`Cannot play "${trimmedClipName}" because the runtime is disposed.`);
      return false;
    }

    const model = this.activeScene?.models.get(trimmedModelId);
    if (!model) {
      logWarning(`Model not found for Scene Play: ${trimmedModelId}`, {
        available: this.activeScene ? [...this.activeScene.models.keys()] : [],
      });
      return false;
    }

    if (!model.mixer) {
      logWarning(`Model has no animation mixer: ${trimmedModelId}`);
      return false;
    }

    const clip = model.clips.get(trimmedClipName);
    if (!clip) {
      logWarning(`Animation clip not found for model "${trimmedModelId}": ${trimmedClipName}`, {
        available: [...model.clips.keys()],
      });
      return false;
    }

    playModelClip(model, clip);
    return true;
  }

  public update(nowMs: number): void {
    if (this.disposed || !this.isVisible) {
      return;
    }

    const minFrameMs = 1000 / this.config.targetFps;
    if (nowMs - this.lastRenderMs < minFrameMs) {
      return;
    }
    this.lastRenderMs = nowMs;

    const viewport = this.domLayer.updateLayout();
    if (!this.hasLoggedFirstLayout) {
      this.hasLoggedFirstLayout = true;
      logInfo('Visual Stage layout ready.', this.domLayer.diagnostics());
    }

    this.renderer.setSize(viewport.width, viewport.height, false);
    const activeCamera = this.getActiveCamera();
    if (!activeCamera) {
      return;
    }

    activeCamera.aspect = viewport.width / viewport.height;
    activeCamera.updateProjectionMatrix();

    const delta = Math.min(this.clock.getDelta(), 0.1);
    for (const model of this.activeScene?.models.values() ?? []) {
      model.mixer?.update(delta);
    }

    this.renderer.render(this.scene, activeCamera);
    if (!this.hasLoggedFirstRender) {
      this.hasLoggedFirstRender = true;
      logInfo('Visual Stage first render completed.', {
        activeCamera: this.activeScene?.activeCameraId,
        activeScene: this.activeScene?.id,
        viewport,
      });
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.loadToken += 1;
    if (this.activeScene) {
      this.disposeScene(this.activeScene);
      this.activeScene = undefined;
    }

    this.renderer.dispose();
    this.domLayer.dispose();
  }

  public diagnostics(): VisualStageRuntimeDiagnostics {
    return {
      activeCameraId: this.activeScene?.activeCameraId,
      activeSceneId: this.activeScene?.id,
      cameraIds: this.activeScene ? [...this.activeScene.cameras.keys()] : [],
      disposed: this.disposed,
      isVisible: this.isVisible,
      modelIds: this.activeScene ? [...this.activeScene.models.keys()] : [],
      rootChildCount: this.activeScene?.root.children.length ?? 0,
      rootUuid: this.activeScene?.root.uuid,
    };
  }

  private async buildPendingScene(
    definition: PresentationSceneDefinitionV1,
  ): Promise<PendingPresentationScene> {
    const pending: PendingPresentationScene = {
      id: definition.id,
      root: new THREE.Group(),
      cameras: buildCameras(definition),
      activeCameraId: definition.activeCamera,
      models: new Map(),
    };
    pending.root.name = `R3DPresentationScene:${definition.id}`;

    for (const lightDefinition of definition.lights ?? []) {
      pending.root.add(buildLight(lightDefinition));
    }

    try {
      for (const modelDefinition of definition.models ?? []) {
        const model = await this.loadModel(modelDefinition);
        pending.models.set(model.id, model);
        pending.root.add(model.root);
      }
    } catch (error) {
      this.disposeScene(pending);
      throw error;
    }

    return pending;
  }

  private async loadModel(
    definition: PresentationModelDefinitionV1,
  ): Promise<PresentationModelRuntimeRecord> {
    logInfo(`Model load started: ${definition.id}`, { path: definition.path });
    let loaded: LoadedPresentationModel;
    try {
      loaded = await this.modelLoader.load(definition.path);
    } catch (error) {
      logError(`Model load failed: ${definition.id}`, { path: definition.path, error });
      throw error;
    }

    const modelRoot = loaded.scene;
    modelRoot.name = modelRoot.name || definition.id;
    applyPresentationModelPlacement(modelRoot, definition);

    const mixer = loaded.animations.length > 0 ? new THREE.AnimationMixer(modelRoot) : undefined;
    const record: PresentationModelRuntimeRecord = {
      id: definition.id,
      root: modelRoot,
      ...(mixer ? { mixer } : {}),
      clips: new Map(loaded.animations.map((clip) => [clip.name, clip])),
    };

    if (definition.animation) {
      const initialClip = findAnimationClipExact(loaded.animations, definition.animation);
      if (initialClip && mixer) {
        playModelClip(record, initialClip);
      } else {
        logWarning(`Initial animation not found for model "${definition.id}".`, {
          requested: definition.animation,
          available: loaded.animations.map((clip) => clip.name),
        });
      }
    }

    return record;
  }

  private getActiveCamera(): THREE.PerspectiveCamera | undefined {
    if (!this.activeScene) {
      return undefined;
    }

    return this.activeScene.cameras.get(this.activeScene.activeCameraId);
  }

  private disposeScene(scene: PendingPresentationScene): void {
    this.scene.remove(scene.root);
    disposeSceneResources(scene.root, {
      mixers: collectMixerRecords(scene),
      warn: (message, error) => logWarning(message, error),
    });
    scene.root.clear();
    scene.models.clear();
    scene.cameras.clear();
  }
}

function createDefaultRenderer(config: VisualStageRuntimeConfig): VisualStageRenderer {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  renderer.setPixelRatio(Math.min(pixelRatio, config.maxPixelRatio));
  return renderer;
}

function buildCameras(
  definition: PresentationSceneDefinitionV1,
): Map<string, THREE.PerspectiveCamera> {
  const cameras = new Map<string, THREE.PerspectiveCamera>();
  for (const cameraDefinition of definition.cameras) {
    const camera = new THREE.PerspectiveCamera(
      cameraDefinition.fov,
      1,
      cameraDefinition.near ?? 0.1,
      cameraDefinition.far ?? 100,
    );
    camera.name = cameraDefinition.id;
    camera.position.fromArray(cameraDefinition.position);
    camera.lookAt(vectorFromArray(cameraDefinition.target));
    cameras.set(cameraDefinition.id, camera);
  }

  return cameras;
}

function buildLight(definition: PresentationLightDefinitionV1): THREE.Light {
  let light: THREE.Light;
  switch (definition.type) {
    case 'ambient':
      light = new THREE.AmbientLight(definition.color, definition.intensity);
      break;
    case 'hemisphere':
      light = new THREE.HemisphereLight(
        definition.skyColor,
        definition.groundColor,
        definition.intensity,
      );
      break;
    case 'directional':
      light = new THREE.DirectionalLight(definition.color, definition.intensity);
      applyOptionalPosition(light, definition.position);
      break;
    case 'point':
      light = new THREE.PointLight(definition.color, definition.intensity);
      applyOptionalPosition(light, definition.position);
      break;
    default: {
      const exhaustive: never = definition;
      throw new Error(`Unsupported light definition: ${JSON.stringify(exhaustive)}`);
    }
  }

  light.name = definition.id ?? '';
  return light;
}

function applyOptionalPosition(light: THREE.Light, position: PresentationSceneVector3 | undefined) {
  if (position) {
    light.position.fromArray(position);
  }
}

function vectorFromArray(vector: PresentationSceneVector3): THREE.Vector3 {
  return new THREE.Vector3(vector[0], vector[1], vector[2]);
}

function playModelClip(
  model: PresentationModelRuntimeRecord,
  clip: THREE.AnimationClip,
): THREE.AnimationAction {
  if (!model.mixer) {
    throw new Error(`Model "${model.id}" has no animation mixer.`);
  }

  const nextAction = model.mixer.clipAction(clip);
  nextAction.enabled = true;
  nextAction.reset();
  nextAction.fadeIn(0.15);
  nextAction.play();

  if (model.currentAction && model.currentAction !== nextAction) {
    model.currentAction.fadeOut(0.15);
  }

  model.currentAction = nextAction;
  return nextAction;
}

function collectMixerRecords(scene: PendingPresentationScene): SceneMixerRecord[] {
  return [...scene.models.values()]
    .filter((model): model is PresentationModelRuntimeRecord & { mixer: THREE.AnimationMixer } =>
      Boolean(model.mixer),
    )
    .map((model) => ({ mixer: model.mixer, root: model.root }));
}
