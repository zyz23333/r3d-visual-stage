export interface OverlayConfig {
  defaultCharacterPath: string;
  autoShow: boolean;
  overlayWidth: number;
  targetFps: number;
  maxPixelRatio: number;
  fileLogging: boolean;
  logFilePath: string;
  timestampLogFile: boolean;
}

const DEFAULT_CONFIG: OverlayConfig = {
  defaultCharacterPath: 'models/r3d-demo-character.glb',
  autoShow: true,
  overlayWidth: 280,
  targetFps: 30,
  maxPixelRatio: 1.5,
  fileLogging: false,
  logFilePath: 'r3d-logs/R3DCharacterOverlayDemo.log',
  timestampLogFile: false,
};

export function readOverlayConfig(parameters: Record<string, string | undefined>): OverlayConfig {
  return {
    defaultCharacterPath:
      readString(parameters['Default Character Path']) ?? DEFAULT_CONFIG.defaultCharacterPath,
    autoShow: readBoolean(parameters['Auto Show']) ?? DEFAULT_CONFIG.autoShow,
    overlayWidth: readNumber(parameters['Overlay Width'], 160, 1024) ?? DEFAULT_CONFIG.overlayWidth,
    targetFps: readNumber(parameters['Target FPS'], 1, 60) ?? DEFAULT_CONFIG.targetFps,
    maxPixelRatio:
      readNumber(parameters['Max Pixel Ratio'], 0.5, 4) ?? DEFAULT_CONFIG.maxPixelRatio,
    fileLogging: readBoolean(parameters['File Logging']) ?? DEFAULT_CONFIG.fileLogging,
    logFilePath: readString(parameters['Log File Path']) ?? DEFAULT_CONFIG.logFilePath,
    timestampLogFile:
      readBoolean(parameters['Timestamp Log File']) ?? DEFAULT_CONFIG.timestampLogFile,
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
