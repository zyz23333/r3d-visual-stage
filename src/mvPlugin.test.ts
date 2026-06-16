import { afterEach, describe, expect, it, vi } from 'vitest';

import { installR3DVisualStage } from './mvPlugin';
import type { R3DVisualStageApi } from './mvTypes';
import type { PresentationSceneRuntimeControl, SceneFileTextLoader } from './sceneControl';

function createRuntime(): PresentationSceneRuntimeControl {
  let currentToken = 0;
  return {
    reserveLoadToken: vi.fn(() => {
      currentToken += 1;
      return currentToken;
    }),
    isLoadTokenCurrent: vi.fn((token) => token === currentToken),
    loadDefinition: vi.fn(async () => true),
    show: vi.fn(),
    hide: vi.fn(),
    setCamera: vi.fn(() => true),
    play: vi.fn(() => true),
    update: vi.fn(),
    dispose: vi.fn(),
  };
}

function installTestWindow(parameters: Record<string, string | undefined> = {}) {
  const pluginCommand = vi.fn();
  class GameInterpreter {
    public pluginCommand(command: string, args: string[]) {
      pluginCommand(command, args);
    }
  }

  const sceneManager = {
    updateMain: vi.fn(),
  };

  const testWindow = {
    PluginManager: {
      parameters: vi.fn(() => parameters),
    },
    Game_Interpreter: GameInterpreter,
    SceneManager: sceneManager,
    addEventListener: vi.fn(),
    R3DVisualStage: undefined as R3DVisualStageApi | undefined,
  };

  vi.stubGlobal('window', testWindow);
  vi.stubGlobal('performance', { now: vi.fn(() => 1234) });

  return { gameInterpreter: GameInterpreter, pluginCommand, sceneManager, testWindow };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('installR3DVisualStage', () => {
  it('exposes the scene public API, auto-loads the default scene, and does not expose character', async () => {
    const runtime = createRuntime();
    const loader: SceneFileTextLoader = {
      load: vi.fn(async () => '{"schemaVersion":1,"id":"scene"}'),
    };
    const { testWindow } = installTestWindow({
      'Default Scene Path': 'r3d\\scenes\\default.r3dscene.json',
      'Auto Show Scene': 'true',
    });

    installR3DVisualStage({
      createRuntime: () => runtime,
      sceneFileTextLoader: loader,
    });

    await Promise.resolve();
    await Promise.resolve();

    const api = testWindow.R3DVisualStage!;

    expect(api.scene).toMatchObject({
      load: expect.any(Function),
      loadDefinition: expect.any(Function),
      show: expect.any(Function),
      hide: expect.any(Function),
      setCamera: expect.any(Function),
      play: expect.any(Function),
    });
    expect('character' in api).toBe(false);
    expect(loader.load).toHaveBeenCalledWith('r3d/scenes/default.r3dscene.json');
    expect(runtime.loadDefinition).toHaveBeenCalledWith({ schemaVersion: 1, id: 'scene' }, 1);

    api.dispose();
    expect(runtime.dispose).toHaveBeenCalledTimes(1);
  });

  it('routes only R3DStage Scene plugin commands and keeps MV original command behavior', () => {
    const runtime = createRuntime();
    const { gameInterpreter, pluginCommand } = installTestWindow({
      'Auto Show Scene': 'false',
    });

    installR3DVisualStage({
      createRuntime: () => runtime,
      sceneFileTextLoader: { load: vi.fn(async () => '{}') },
    });

    const interpreter = new gameInterpreter();
    interpreter.pluginCommand('OtherPlugin', ['Scene', 'Show']);
    interpreter.pluginCommand('R3DStage', ['Scene', 'Show']);
    interpreter.pluginCommand('R3DStage', ['Scene', 'Hide']);
    interpreter.pluginCommand('R3DStage', ['Scene', 'Camera', 'portrait']);
    interpreter.pluginCommand('R3DStage', ['Scene', 'Play', 'character', 'Wave']);
    interpreter.pluginCommand('R3DStage', ['Character', 'Show']);

    expect(pluginCommand).toHaveBeenCalledWith('OtherPlugin', ['Scene', 'Show']);
    expect(pluginCommand).toHaveBeenCalledWith('R3DStage', ['Scene', 'Show']);
    expect(runtime.show).toHaveBeenCalledTimes(1);
    expect(runtime.hide).toHaveBeenCalledTimes(1);
    expect(runtime.setCamera).toHaveBeenCalledWith('portrait');
    expect(runtime.play).toHaveBeenCalledWith('character', 'Wave');
    expect(runtime.show).toHaveBeenCalledTimes(1);
  });

  it('loads scene paths through R3DStage Scene Load and updates runtime from SceneManager', async () => {
    const runtime = createRuntime();
    const loader: SceneFileTextLoader = {
      load: vi.fn(async () => '{"schemaVersion":1,"id":"from-command"}'),
    };
    const { gameInterpreter, sceneManager } = installTestWindow({
      'Auto Show Scene': 'false',
    });

    installR3DVisualStage({
      createRuntime: () => runtime,
      sceneFileTextLoader: loader,
    });

    const interpreter = new gameInterpreter();
    interpreter.pluginCommand('R3DStage', ['Scene', 'Load', 'r3d\\scenes\\command.r3dscene.json']);

    await Promise.resolve();
    await Promise.resolve();

    expect(loader.load).toHaveBeenCalledWith('r3d/scenes/command.r3dscene.json');
    expect(runtime.loadDefinition).toHaveBeenCalledWith(
      { schemaVersion: 1, id: 'from-command' },
      1,
    );

    sceneManager.updateMain();
    expect(runtime.update).toHaveBeenCalledWith(1234);
  });
});
