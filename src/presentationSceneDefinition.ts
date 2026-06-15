export type PresentationSceneVector3 = [number, number, number];

export interface PresentationSceneDefinitionV1 {
  schemaVersion: 1;
  id: string;
  cameras: PresentationCameraDefinitionV1[];
  activeCamera: string;
  lights?: PresentationLightDefinitionV1[];
  models?: PresentationModelDefinitionV1[];
}

export type PresentationSceneDefinition = PresentationSceneDefinitionV1;

export interface PresentationCameraDefinitionV1 {
  id: string;
  type?: 'perspective';
  position: PresentationSceneVector3;
  target: PresentationSceneVector3;
  fov: number;
  near?: number;
  far?: number;
}

export type PresentationLightDefinitionV1 =
  | PresentationAmbientLightDefinitionV1
  | PresentationHemisphereLightDefinitionV1
  | PresentationDirectionalLightDefinitionV1
  | PresentationPointLightDefinitionV1;

export interface PresentationAmbientLightDefinitionV1 {
  id?: string;
  type: 'ambient';
  color: string;
  intensity: number;
}

export interface PresentationHemisphereLightDefinitionV1 {
  id?: string;
  type: 'hemisphere';
  skyColor: string;
  groundColor: string;
  intensity: number;
}

export interface PresentationDirectionalLightDefinitionV1 {
  id?: string;
  type: 'directional';
  color: string;
  intensity: number;
  position?: PresentationSceneVector3;
}

export interface PresentationPointLightDefinitionV1 {
  id?: string;
  type: 'point';
  color: string;
  intensity: number;
  position?: PresentationSceneVector3;
}

export interface PresentationModelDefinitionV1 {
  id: string;
  path: string;
  position?: PresentationSceneVector3;
  rotation?: PresentationSceneVector3;
  scale?: number;
  animation?: string;
  fit?: PresentationModelFitDefinitionV1;
}

export interface PresentationModelFitDefinitionV1 {
  height: number;
  origin: 'center' | 'center-bottom';
}

export type PresentationSceneValidationReason =
  | 'duplicate-id'
  | 'invalid-reference'
  | 'invalid-type'
  | 'invalid-value'
  | 'missing-field'
  | 'unknown-field'
  | 'unsupported-value'
  | 'unsupported-version';

export interface PresentationSceneValidationIssue {
  path: string;
  message: string;
  reason: PresentationSceneValidationReason;
}

export type PresentationSceneValidationResult =
  | {
      ok: true;
      definition: PresentationSceneDefinitionV1;
      warnings: PresentationSceneValidationIssue[];
    }
  | {
      ok: false;
      errors: PresentationSceneValidationIssue[];
      warnings: PresentationSceneValidationIssue[];
    };

type UnknownRecord = Record<string, unknown>;
type ValidationIssueSink = {
  errors: PresentationSceneValidationIssue[];
  warnings: PresentationSceneValidationIssue[];
};

const ROOT_KEYS = ['schemaVersion', 'id', 'cameras', 'activeCamera', 'lights', 'models'];
const CAMERA_KEYS = ['id', 'type', 'position', 'target', 'fov', 'near', 'far'];
const AMBIENT_LIGHT_KEYS = ['id', 'type', 'color', 'intensity'];
const HEMISPHERE_LIGHT_KEYS = ['id', 'type', 'skyColor', 'groundColor', 'intensity'];
const POSITIONED_LIGHT_KEYS = ['id', 'type', 'color', 'intensity', 'position'];
const MODEL_KEYS = ['id', 'path', 'position', 'rotation', 'scale', 'animation', 'fit'];
const MODEL_FIT_KEYS = ['height', 'origin'];
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_CAMERA_NEAR = 0.1;

export function validatePresentationSceneDefinition(
  value: unknown,
): PresentationSceneValidationResult {
  const issues: ValidationIssueSink = { errors: [], warnings: [] };
  const root = readObject(value, 'definition', issues);

  if (!root) {
    return failure(issues);
  }

  validateKnownKeys(root, 'definition', ROOT_KEYS, issues);

  const schemaVersion = readRequiredNumber(
    root,
    'schemaVersion',
    'definition.schemaVersion',
    issues,
  );
  if (schemaVersion !== undefined && schemaVersion !== 1) {
    addError(
      issues,
      'definition.schemaVersion',
      'Only schemaVersion 1 is supported.',
      'unsupported-version',
    );
  }

  const id = readRequiredNonEmptyString(root, 'id', 'definition.id', issues);
  const cameras = readRequiredArray(root, 'cameras', 'definition.cameras', issues, parseCamera);
  const activeCamera = readRequiredNonEmptyString(
    root,
    'activeCamera',
    'definition.activeCamera',
    issues,
  );
  const lights = readOptionalArray(root, 'lights', 'definition.lights', issues, parseLight);
  const models = readOptionalArray(root, 'models', 'definition.models', issues, parseModel);

  validateUniqueIds(cameras, 'definition.cameras', 'Presentation Camera', issues);

  if (activeCamera !== undefined && cameras !== undefined && cameras.length > 0) {
    const cameraIds = new Set(cameras.map((camera) => camera.id));
    if (!cameraIds.has(activeCamera)) {
      addError(
        issues,
        'definition.activeCamera',
        `activeCamera must reference an existing Presentation Camera: ${activeCamera}`,
        'invalid-reference',
      );
    }
  }

  if (lights !== undefined) {
    validateUniqueOptionalIds(lights, 'definition.lights', 'light', issues);
  }

  if (models !== undefined) {
    validateUniqueIds(models, 'definition.models', 'model', issues);
  }

  if (issues.errors.length > 0) {
    return failure(issues);
  }

  return {
    ok: true,
    definition: {
      schemaVersion: 1,
      id: id as string,
      cameras: cameras as PresentationCameraDefinitionV1[],
      activeCamera: activeCamera as string,
      ...(lights === undefined ? {} : { lights }),
      ...(models === undefined ? {} : { models }),
    },
    warnings: issues.warnings,
  };
}

function parseCamera(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): PresentationCameraDefinitionV1 | undefined {
  const camera = readObject(value, path, issues);
  if (!camera) {
    return undefined;
  }

  validateKnownKeys(camera, path, CAMERA_KEYS, issues);

  const id = readRequiredNonEmptyString(camera, 'id', `${path}.id`, issues);
  const rawType = camera.type;
  if (rawType !== undefined && rawType !== 'perspective') {
    addError(
      issues,
      `${path}.type`,
      'Only perspective Presentation Cameras are supported.',
      'unsupported-value',
    );
  }

  const position = readRequiredVector3(camera, 'position', `${path}.position`, issues);
  const target = readRequiredVector3(camera, 'target', `${path}.target`, issues);
  const fov = readRequiredFiniteNumber(camera, 'fov', `${path}.fov`, issues);
  if (fov !== undefined) {
    if (fov < 1 || fov >= 180) {
      addError(issues, `${path}.fov`, 'Camera fov must satisfy 1 <= fov < 180.', 'invalid-value');
    } else if (fov > 120) {
      addWarning(
        issues,
        `${path}.fov`,
        'Camera fov above 120 degrees may produce extreme perspective distortion.',
        'invalid-value',
      );
    }
  }

  const near = readOptionalFiniteNumber(camera, 'near', `${path}.near`, issues);
  if (near !== undefined && near <= 0) {
    addError(issues, `${path}.near`, 'Camera near must be greater than 0.', 'invalid-value');
  }

  const far = readOptionalFiniteNumber(camera, 'far', `${path}.far`, issues);
  const nearForFarComparison = near ?? DEFAULT_CAMERA_NEAR;
  if (far !== undefined && far <= nearForFarComparison) {
    addError(issues, `${path}.far`, 'Camera far must be greater than near.', 'invalid-value');
  }

  if (
    id === undefined ||
    position === undefined ||
    target === undefined ||
    fov === undefined ||
    issues.errors.some((issue) => issue.path.startsWith(path))
  ) {
    return undefined;
  }

  return {
    id,
    ...(rawType === undefined ? {} : { type: 'perspective' as const }),
    position,
    target,
    fov,
    ...(near === undefined ? {} : { near }),
    ...(far === undefined ? {} : { far }),
  };
}

function parseLight(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): PresentationLightDefinitionV1 | undefined {
  const light = readObject(value, path, issues);
  if (!light) {
    return undefined;
  }

  const type = readRequiredNonEmptyString(light, 'type', `${path}.type`, issues);
  const id = readOptionalNonEmptyString(light, 'id', `${path}.id`, issues);
  const intensity = readRequiredFiniteNumber(light, 'intensity', `${path}.intensity`, issues);
  if (intensity !== undefined && intensity < 0) {
    addError(
      issues,
      `${path}.intensity`,
      'Light intensity must be greater than or equal to 0.',
      'invalid-value',
    );
  }

  switch (type) {
    case 'ambient': {
      validateKnownKeys(light, path, AMBIENT_LIGHT_KEYS, issues);
      const color = readRequiredHexColor(light, 'color', `${path}.color`, issues);
      if (color === undefined || intensity === undefined || hasPathError(issues, path)) {
        return undefined;
      }

      return { ...(id === undefined ? {} : { id }), type, color, intensity };
    }
    case 'hemisphere': {
      validateKnownKeys(light, path, HEMISPHERE_LIGHT_KEYS, issues);
      const skyColor = readRequiredHexColor(light, 'skyColor', `${path}.skyColor`, issues);
      const groundColor = readRequiredHexColor(light, 'groundColor', `${path}.groundColor`, issues);
      if (
        skyColor === undefined ||
        groundColor === undefined ||
        intensity === undefined ||
        hasPathError(issues, path)
      ) {
        return undefined;
      }

      return { ...(id === undefined ? {} : { id }), type, skyColor, groundColor, intensity };
    }
    case 'directional':
    case 'point': {
      validateKnownKeys(light, path, POSITIONED_LIGHT_KEYS, issues);
      const color = readRequiredHexColor(light, 'color', `${path}.color`, issues);
      const position = readOptionalVector3(light, 'position', `${path}.position`, issues);
      if (color === undefined || intensity === undefined || hasPathError(issues, path)) {
        return undefined;
      }

      return {
        ...(id === undefined ? {} : { id }),
        type,
        color,
        intensity,
        ...(position === undefined ? {} : { position }),
      };
    }
    case undefined:
      return undefined;
    default:
      addError(issues, `${path}.type`, `Unsupported light type: ${type}`, 'unsupported-value');
      return undefined;
  }
}

function parseModel(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): PresentationModelDefinitionV1 | undefined {
  const model = readObject(value, path, issues);
  if (!model) {
    return undefined;
  }

  validateKnownKeys(model, path, MODEL_KEYS, issues);

  const id = readRequiredNonEmptyString(model, 'id', `${path}.id`, issues);
  const assetPath = readRequiredProjectRelativePath(model, 'path', `${path}.path`, issues);
  const position = readOptionalVector3(model, 'position', `${path}.position`, issues);
  const rotation = readOptionalVector3(model, 'rotation', `${path}.rotation`, issues);
  const scale = readOptionalFiniteNumber(model, 'scale', `${path}.scale`, issues);
  if (scale !== undefined && scale <= 0) {
    addError(
      issues,
      `${path}.scale`,
      'Model scale must be a positive finite number.',
      'invalid-value',
    );
  }
  const animation = readOptionalNonEmptyString(model, 'animation', `${path}.animation`, issues);
  const fit = readOptionalModelFit(model, 'fit', `${path}.fit`, issues);

  if (id === undefined || assetPath === undefined || hasPathError(issues, path)) {
    return undefined;
  }

  return {
    id,
    path: assetPath,
    ...(position === undefined ? {} : { position }),
    ...(rotation === undefined ? {} : { rotation }),
    ...(scale === undefined ? {} : { scale }),
    ...(animation === undefined ? {} : { animation }),
    ...(fit === undefined ? {} : { fit }),
  };
}

function readOptionalModelFit(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): PresentationModelFitDefinitionV1 | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  const fit = readObject(value, path, issues);
  if (!fit) {
    return undefined;
  }

  validateKnownKeys(fit, path, MODEL_FIT_KEYS, issues);

  const height = readRequiredFiniteNumber(fit, 'height', `${path}.height`, issues);
  if (height !== undefined && height <= 0) {
    addError(issues, `${path}.height`, 'Model fit height must be positive.', 'invalid-value');
  }

  const origin = readRequiredNonEmptyString(fit, 'origin', `${path}.origin`, issues);
  if (origin !== undefined && origin !== 'center' && origin !== 'center-bottom') {
    addError(
      issues,
      `${path}.origin`,
      'Model fit origin must be "center" or "center-bottom".',
      'unsupported-value',
    );
  }

  if (height === undefined || origin === undefined || hasPathError(issues, path)) {
    return undefined;
  }

  return { height, origin: origin as PresentationModelFitDefinitionV1['origin'] };
}

function readObject(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): UnknownRecord | undefined {
  if (!isRecord(value)) {
    addError(issues, path, 'Expected an object.', 'invalid-type');
    return undefined;
  }

  return value;
}

function readRequiredArray<T>(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
  parseItem: (value: unknown, path: string, issues: ValidationIssueSink) => T | undefined,
): T[] | undefined {
  if (!(key in object)) {
    addError(issues, path, 'Missing required field.', 'missing-field');
    return undefined;
  }

  const value = object[key];
  if (!Array.isArray(value)) {
    addError(issues, path, 'Expected an array.', 'invalid-type');
    return undefined;
  }

  if (value.length === 0) {
    addError(issues, path, 'Expected at least one entry.', 'invalid-value');
    return undefined;
  }

  return value
    .map((entry, index) => parseItem(entry, `${path}[${index}]`, issues))
    .filter(isDefined);
}

function readOptionalArray<T>(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
  parseItem: (value: unknown, path: string, issues: ValidationIssueSink) => T | undefined,
): T[] | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    addError(issues, path, 'Expected an array.', 'invalid-type');
    return undefined;
  }

  return value
    .map((entry, index) => parseItem(entry, `${path}[${index}]`, issues))
    .filter(isDefined);
}

function readRequiredNumber(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): number | undefined {
  if (!(key in object)) {
    addError(issues, path, 'Missing required field.', 'missing-field');
    return undefined;
  }

  const value = object[key];
  if (typeof value !== 'number') {
    addError(issues, path, 'Expected a number.', 'invalid-type');
    return undefined;
  }

  return value;
}

function readRequiredFiniteNumber(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): number | undefined {
  const value = readRequiredNumber(object, key, path, issues);
  if (value !== undefined && !Number.isFinite(value)) {
    addError(issues, path, 'Expected a finite number.', 'invalid-value');
    return undefined;
  }

  return value;
}

function readOptionalFiniteNumber(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): number | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number') {
    addError(issues, path, 'Expected a number.', 'invalid-type');
    return undefined;
  }

  if (!Number.isFinite(value)) {
    addError(issues, path, 'Expected a finite number.', 'invalid-value');
    return undefined;
  }

  return value;
}

function readRequiredNonEmptyString(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): string | undefined {
  if (!(key in object)) {
    addError(issues, path, 'Missing required field.', 'missing-field');
    return undefined;
  }

  return readStringValue(object[key], path, issues);
}

function readOptionalNonEmptyString(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): string | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  return readStringValue(value, path, issues);
}

function readStringValue(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): string | undefined {
  if (typeof value !== 'string') {
    addError(issues, path, 'Expected a string.', 'invalid-type');
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    addError(issues, path, 'Expected a non-empty string.', 'invalid-value');
    return undefined;
  }

  return trimmed;
}

function readRequiredVector3(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): PresentationSceneVector3 | undefined {
  if (!(key in object)) {
    addError(issues, path, 'Missing required field.', 'missing-field');
    return undefined;
  }

  return readVector3(object[key], path, issues);
}

function readOptionalVector3(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): PresentationSceneVector3 | undefined {
  const value = object[key];
  if (value === undefined) {
    return undefined;
  }

  return readVector3(value, path, issues);
}

function readVector3(
  value: unknown,
  path: string,
  issues: ValidationIssueSink,
): PresentationSceneVector3 | undefined {
  if (!Array.isArray(value)) {
    addError(issues, path, 'Expected a Three.js [x, y, z] vector array.', 'invalid-type');
    return undefined;
  }

  if (value.length !== 3) {
    addError(issues, path, 'Expected exactly 3 vector entries.', 'invalid-value');
    return undefined;
  }

  const entries = value.map((entry, index) => {
    if (typeof entry !== 'number') {
      addError(issues, `${path}[${index}]`, 'Expected a number.', 'invalid-type');
      return undefined;
    }

    if (!Number.isFinite(entry)) {
      addError(issues, `${path}[${index}]`, 'Expected a finite number.', 'invalid-value');
      return undefined;
    }

    return entry;
  });

  if (entries.some((entry) => entry === undefined)) {
    return undefined;
  }

  return entries as PresentationSceneVector3;
}

function readRequiredHexColor(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): string | undefined {
  const value = readRequiredNonEmptyString(object, key, path, issues);
  if (value !== undefined && !HEX_COLOR_PATTERN.test(value)) {
    addError(issues, path, 'Expected a CSS hex color in #rgb or #rrggbb form.', 'invalid-value');
    return undefined;
  }

  return value;
}

function readRequiredProjectRelativePath(
  object: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssueSink,
): string | undefined {
  const rawPath = readRequiredNonEmptyString(object, key, path, issues);
  if (rawPath === undefined) {
    return undefined;
  }

  const normalizedPath = rawPath.replace(/\\/g, '/');
  if (!isValidProjectRelativePath(normalizedPath)) {
    addError(
      issues,
      path,
      'Expected a project-root-relative asset path without protocols, absolute roots, or parent traversal.',
      'invalid-value',
    );
    return undefined;
  }

  return normalizedPath;
}

function isValidProjectRelativePath(path: string): boolean {
  if (!path || path.startsWith('/') || path.startsWith('//')) {
    return false;
  }

  if (/^[a-zA-Z]:(?:\/|$)/.test(path) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return false;
  }

  return path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

function validateKnownKeys(
  object: UnknownRecord,
  path: string,
  allowedKeys: readonly string[],
  issues: ValidationIssueSink,
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) {
      addError(issues, `${path}.${key}`, `Unknown field: ${key}`, 'unknown-field');
    }
  }
}

function validateUniqueIds(
  entries: readonly { id: string }[] | undefined,
  path: string,
  label: string,
  issues: ValidationIssueSink,
): void {
  if (!entries) {
    return;
  }

  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry.id)) {
      addError(
        issues,
        `${path}[${index}].id`,
        `Duplicate ${label} ID: ${entry.id}`,
        'duplicate-id',
      );
    }
    seen.add(entry.id);
  }
}

function validateUniqueOptionalIds(
  entries: readonly { id?: string }[] | undefined,
  path: string,
  label: string,
  issues: ValidationIssueSink,
): void {
  if (!entries) {
    return;
  }

  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (entry.id === undefined) {
      continue;
    }

    if (seen.has(entry.id)) {
      addError(
        issues,
        `${path}[${index}].id`,
        `Duplicate ${label} ID: ${entry.id}`,
        'duplicate-id',
      );
    }
    seen.add(entry.id);
  }
}

function hasPathError(issues: ValidationIssueSink, path: string): boolean {
  return issues.errors.some((issue) => issue.path === path || issue.path.startsWith(`${path}.`));
}

function addError(
  issues: ValidationIssueSink,
  path: string,
  message: string,
  reason: PresentationSceneValidationReason,
): void {
  issues.errors.push({ path, message, reason });
}

function addWarning(
  issues: ValidationIssueSink,
  path: string,
  message: string,
  reason: PresentationSceneValidationReason,
): void {
  issues.warnings.push({ path, message, reason });
}

function failure(issues: ValidationIssueSink): PresentationSceneValidationResult {
  return { ok: false, errors: issues.errors, warnings: issues.warnings };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
