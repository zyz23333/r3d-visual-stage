import { afterEach, describe, expect, it, vi } from 'vitest';

import { readVisualStageConfig } from './config';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readVisualStageConfig', () => {
  it('uses scene-oriented defaults', () => {
    expect(readVisualStageConfig({})).toEqual({
      defaultScenePath: 'r3d/scenes/r3d-validation-scene.r3dscene.json',
      autoShowScene: true,
      stagePlacement: 'right',
      stageWidth: 280,
      targetFps: 30,
      maxPixelRatio: 1.5,
      fileLogging: false,
      logFilePath: 'r3d-logs/R3DVisualStage.log',
      timestampLogFile: false,
    });
  });

  it('reads scene-oriented plugin parameters and clamps numeric values', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(
      readVisualStageConfig({
        'Default Scene Path': ' custom/scenes/opening.r3dscene.json ',
        'Auto Show Scene': 'false',
        'Stage Placement': 'fullscreen',
        'Stage Width': '2048',
        'Target FPS': '120',
        'Max Pixel Ratio': '8',
        'File Logging': 'true',
        'Log File Path': ' logs/R3DVisualStage.log ',
        'Timestamp Log File': 'true',
      }),
    ).toEqual({
      defaultScenePath: 'custom/scenes/opening.r3dscene.json',
      autoShowScene: false,
      stagePlacement: 'right',
      stageWidth: 1024,
      targetFps: 60,
      maxPixelRatio: 4,
      fileLogging: true,
      logFilePath: 'logs/R3DVisualStage.log',
      timestampLogFile: true,
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      '[R3D Visual Stage] Unsupported Stage Placement "fullscreen" ignored; falling back to "right".',
    );
  });

  it('does not preserve old character parameter names as compatibility aliases', () => {
    expect(
      readVisualStageConfig({
        'Default Character Path': 'r3d/models/legacy-character.glb',
        'Auto Show Character': 'false',
        'Character Display Width': '640',
      }),
    ).toEqual({
      defaultScenePath: 'r3d/scenes/r3d-validation-scene.r3dscene.json',
      autoShowScene: true,
      stagePlacement: 'right',
      stageWidth: 280,
      targetFps: 30,
      maxPixelRatio: 1.5,
      fileLogging: false,
      logFilePath: 'r3d-logs/R3DVisualStage.log',
      timestampLogFile: false,
    });
  });
});
