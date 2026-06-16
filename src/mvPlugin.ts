import { readVisualStageConfig, type VisualStagePluginConfig } from './config';
import { installFileLogger } from './fileLogger';
import { logError, logInfo, logWarning } from './diagnostics';
import type { R3DVisualStageApi } from './mvTypes';
import {
  createR3DVisualStageSceneApi,
  type PresentationSceneRuntimeControl,
  type SceneFileTextLoader,
} from './sceneControl';
import { VisualStageRuntime } from './visualStageRuntime';

const PLUGIN_NAME = 'R3DVisualStage';
const COMMAND_PREFIX = 'R3DStage';

export interface R3DVisualStageInstallDependencies {
  createRuntime?: (config: VisualStagePluginConfig) => PresentationSceneRuntimeControl;
  sceneFileTextLoader?: SceneFileTextLoader;
}

export function installR3DVisualStage(dependencies: R3DVisualStageInstallDependencies = {}): void {
  const parameters = window.PluginManager?.parameters(PLUGIN_NAME) ?? {};
  const config = readVisualStageConfig(parameters);
  installFileLogger(config);

  const runtime = dependencies.createRuntime?.(config) ?? new VisualStageRuntime(config);
  const sceneApi = createR3DVisualStageSceneApi(runtime, dependencies.sceneFileTextLoader);
  const api: R3DVisualStageApi = {
    scene: sceneApi,
    dispose: () => runtime.dispose(),
  };

  window.R3DVisualStage = api;
  installPluginCommandRoute(sceneApi);
  installSceneUpdateHook(runtime);

  if (config.autoShowScene) {
    loadSceneFromMvSurface(sceneApi, config.defaultScenePath, 'auto-load');
  }

  logInfo('Plugin installed.');
}

function installPluginCommandRoute(sceneApi: R3DVisualStageApi['scene']): void {
  const gameInterpreter = window.Game_Interpreter;
  if (!gameInterpreter) {
    logWarning('Game_Interpreter was not available; plugin commands were not installed.');
    return;
  }

  const originalPluginCommand = gameInterpreter.prototype.pluginCommand;
  gameInterpreter.prototype.pluginCommand = function pluginCommand(
    command: string,
    args: string[],
  ) {
    originalPluginCommand.call(this, command, args);

    if (command !== COMMAND_PREFIX) {
      return;
    }

    const [commandDomain = '', subCommand = '', ...rest] = args;
    routePluginCommand(sceneApi, commandDomain, subCommand, rest);
  };
}

function routePluginCommand(
  sceneApi: R3DVisualStageApi['scene'],
  commandDomain: string,
  subCommand: string,
  args: string[],
): void {
  if (commandDomain.toLowerCase() !== 'scene') {
    logWarning(`Unknown R3DStage command domain: ${commandDomain}`);
    return;
  }

  try {
    switch (subCommand.toLowerCase()) {
      case 'show':
        sceneApi.show();
        break;
      case 'hide':
        sceneApi.hide();
        break;
      case 'load':
        loadSceneFromMvSurface(sceneApi, args.join(' '), 'plugin-command');
        break;
      case 'camera':
        sceneApi.setCamera(args.join(' '));
        break;
      case 'play':
        routeScenePlayCommand(sceneApi, args);
        break;
      default:
        logWarning(`Unknown plugin command: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError(`R3DStage Scene command failed: ${subCommand}`, error);
  }
}

function routeScenePlayCommand(sceneApi: R3DVisualStageApi['scene'], args: string[]): void {
  const [modelId = '', ...clipNameParts] = args;
  sceneApi.play(modelId, clipNameParts.join(' '));
}

function loadSceneFromMvSurface(
  sceneApi: R3DVisualStageApi['scene'],
  path: string,
  source: string,
): void {
  sceneApi.load(path).catch((error: unknown) => {
    logError(`R3DStage Scene Load failed unexpectedly from ${source}.`, error);
  });
}

function installSceneUpdateHook(runtime: Pick<PresentationSceneRuntimeControl, 'update'>): void {
  const sceneManager = window.SceneManager;
  if (!sceneManager) {
    logWarning('SceneManager was not available; Visual Stage updates were not installed.');
    return;
  }

  const originalUpdateMain = sceneManager.updateMain;
  sceneManager.updateMain = function updateMain() {
    originalUpdateMain.call(this);
    runtime.update(performance.now());
  };
}
