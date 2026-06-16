import { logError, logInfo, logWarning } from './diagnostics';

export interface PresentationSceneRuntimeControl {
  reserveLoadToken(): number;
  isLoadTokenCurrent(token: number): boolean;
  loadDefinition(definition: unknown, reservedLoadToken?: number): Promise<boolean>;
  show(): void;
  hide(): void;
  setCamera(cameraId: string): boolean;
  play(modelId: string, clipName: string): boolean;
  update(nowMs: number): void;
  dispose(): void;
}

export interface SceneFileTextLoader {
  load(path: string): Promise<string>;
}

export interface R3DVisualStageSceneApi {
  load(path: string): Promise<boolean>;
  loadDefinition(definition: unknown): Promise<boolean>;
  show(): void;
  hide(): void;
  setCamera(cameraId: string): boolean;
  play(modelId: string, clipName: string): boolean;
}

export interface ProjectRelativePathValidationFailure {
  ok: false;
  normalizedPath: string;
  reason: string;
}

export type ProjectRelativePathValidationResult =
  | {
      ok: true;
      path: string;
    }
  | ProjectRelativePathValidationFailure;

export class XhrSceneFileTextLoader implements SceneFileTextLoader {
  public async load(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      try {
        xhr.open('GET', path);
        xhr.overrideMimeType?.('application/json');
        xhr.onload = () => {
          if (xhr.status < 400) {
            resolve(xhr.responseText);
            return;
          }

          reject(new Error(`HTTP status ${xhr.status}`));
        };
        xhr.onerror = () => {
          reject(new Error('XMLHttpRequest network error'));
        };
        xhr.send();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export function createR3DVisualStageSceneApi(
  runtime: PresentationSceneRuntimeControl,
  sceneFileTextLoader: SceneFileTextLoader = new XhrSceneFileTextLoader(),
): R3DVisualStageSceneApi {
  return {
    load: (path) => loadScenePath(runtime, sceneFileTextLoader, path),
    loadDefinition: (definition) => runtime.loadDefinition(definition),
    show: () => runtime.show(),
    hide: () => runtime.hide(),
    setCamera: (cameraId) => runtime.setCamera(cameraId),
    play: (modelId, clipName) => runtime.play(modelId, clipName),
  };
}

export async function loadScenePath(
  runtime: PresentationSceneRuntimeControl,
  sceneFileTextLoader: SceneFileTextLoader,
  rawPath: string,
): Promise<boolean> {
  const loadToken = runtime.reserveLoadToken();
  const pathValidation = validateProjectRelativePath(rawPath);
  if (!pathValidation.ok) {
    logError('Scene Load rejected unsafe R3D Scene File path.', pathValidation);
    return false;
  }

  const scenePath = pathValidation.path;
  logInfo(`Scene file load started: ${scenePath}`);

  let sceneText: string;
  try {
    sceneText = await sceneFileTextLoader.load(scenePath);
  } catch (error) {
    logError(`Scene file load failed: ${scenePath}`, error);
    return false;
  }

  if (!runtime.isLoadTokenCurrent(loadToken)) {
    logWarning(`Scene file load completed stale and was discarded: ${scenePath}`);
    return false;
  }

  logInfo(`Scene definition loaded: ${scenePath}`);

  let definition: unknown;
  try {
    definition = JSON.parse(sceneText);
  } catch (error) {
    logError(`Scene file JSON parse failed: ${scenePath}`, error);
    return false;
  }

  if (!runtime.isLoadTokenCurrent(loadToken)) {
    logWarning(`Scene file parse completed stale and was discarded: ${scenePath}`);
    return false;
  }

  return runtime.loadDefinition(definition, loadToken);
}

export function validateProjectRelativePath(rawPath: string): ProjectRelativePathValidationResult {
  const normalizedPath = rawPath.trim().replace(/\\/g, '/');

  if (!normalizedPath) {
    return { ok: false, normalizedPath, reason: 'empty-path' };
  }

  if (normalizedPath.startsWith('/') || normalizedPath.startsWith('//')) {
    return { ok: false, normalizedPath, reason: 'absolute-or-protocol-relative-path' };
  }

  if (/^[a-zA-Z]:(?:\/|$)/.test(normalizedPath)) {
    return { ok: false, normalizedPath, reason: 'drive-letter-path' };
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalizedPath)) {
    return { ok: false, normalizedPath, reason: 'url-or-protocol-path' };
  }

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return { ok: false, normalizedPath, reason: 'invalid-path-segment' };
  }

  return { ok: true, path: normalizedPath };
}
