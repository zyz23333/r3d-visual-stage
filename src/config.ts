export interface CharacterDisplayConfig {
  defaultCharacterPath: string;
  autoShowCharacter: boolean;
  characterDisplayWidth: number;
  targetFps: number;
  maxPixelRatio: number;
  fileLogging: boolean;
  logFilePath: string;
  timestampLogFile: boolean;
}

const DEFAULT_CONFIG: CharacterDisplayConfig = {
  defaultCharacterPath: 'models/r3d-validation-character.glb',
  autoShowCharacter: true,
  characterDisplayWidth: 280,
  targetFps: 30,
  maxPixelRatio: 1.5,
  fileLogging: false,
  logFilePath: 'r3d-logs/R3DVisualStage.log',
  timestampLogFile: false,
};

export function readCharacterDisplayConfig(
  parameters: Record<string, string | undefined>,
): CharacterDisplayConfig {
  return {
    defaultCharacterPath:
      readString(parameters['Default Character Path']) ?? DEFAULT_CONFIG.defaultCharacterPath,
    autoShowCharacter:
      readBoolean(parameters['Auto Show Character']) ?? DEFAULT_CONFIG.autoShowCharacter,
    characterDisplayWidth:
      readNumber(parameters['Character Display Width'], 160, 1024) ??
      DEFAULT_CONFIG.characterDisplayWidth,
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
