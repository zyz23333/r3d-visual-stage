import { logWarning } from './diagnostics';

export interface VisualStageLayoutConfig {
  stagePlacement: 'right';
  stageWidth: number;
}

export interface VisualStageRuntimeConfig extends VisualStageLayoutConfig {
  targetFps: number;
  maxPixelRatio: number;
}

export interface VisualStagePluginConfig extends VisualStageRuntimeConfig {
  defaultScenePath: string;
  autoShowScene: boolean;
  fileLogging: boolean;
  logFilePath: string;
  timestampLogFile: boolean;
}

const DEFAULT_VISUAL_STAGE_CONFIG: VisualStagePluginConfig = {
  defaultScenePath: 'r3d/scenes/r3d-validation-scene.r3dscene.json',
  autoShowScene: true,
  stagePlacement: 'right',
  stageWidth: 280,
  targetFps: 30,
  maxPixelRatio: 1.5,
  fileLogging: false,
  logFilePath: 'r3d-logs/R3DVisualStage.log',
  timestampLogFile: false,
};

export function readVisualStageConfig(
  parameters: Record<string, string | undefined>,
): VisualStagePluginConfig {
  return {
    defaultScenePath:
      readString(parameters['Default Scene Path']) ?? DEFAULT_VISUAL_STAGE_CONFIG.defaultScenePath,
    autoShowScene:
      readBoolean(parameters['Auto Show Scene']) ?? DEFAULT_VISUAL_STAGE_CONFIG.autoShowScene,
    stagePlacement: readStagePlacement(parameters['Stage Placement']),
    stageWidth:
      readNumber(parameters['Stage Width'], 160, 1024) ?? DEFAULT_VISUAL_STAGE_CONFIG.stageWidth,
    targetFps: readNumber(parameters['Target FPS'], 1, 60) ?? DEFAULT_VISUAL_STAGE_CONFIG.targetFps,
    maxPixelRatio:
      readNumber(parameters['Max Pixel Ratio'], 0.5, 4) ??
      DEFAULT_VISUAL_STAGE_CONFIG.maxPixelRatio,
    fileLogging: readBoolean(parameters['File Logging']) ?? DEFAULT_VISUAL_STAGE_CONFIG.fileLogging,
    logFilePath: readString(parameters['Log File Path']) ?? DEFAULT_VISUAL_STAGE_CONFIG.logFilePath,
    timestampLogFile:
      readBoolean(parameters['Timestamp Log File']) ?? DEFAULT_VISUAL_STAGE_CONFIG.timestampLogFile,
  };
}

function readString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
}

function readStagePlacement(value: string | undefined): 'right' {
  const placement = readString(value);
  if (placement !== undefined && placement !== 'right') {
    logWarning(`Unsupported Stage Placement "${placement}" ignored; falling back to "right".`);
  }

  return 'right';
}

function readNumber(value: string | undefined, min: number, max: number): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(parsed, min), max);
}
