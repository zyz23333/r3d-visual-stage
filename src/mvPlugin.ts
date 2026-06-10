import { readOverlayConfig } from './config';
import { logInfo, logWarning } from './diagnostics';
import { CharacterStage } from './characterStage';
import type { R3DOverlayPublicApi } from './mvTypes';

const PLUGIN_NAME = 'R3DCharacterOverlayDemo';
const COMMAND_PREFIXES = new Set(['R3DOverlay', 'R3DCharacterOverlayDemo']);

export function installR3DCharacterOverlayDemo(): void {
  const parameters = window.PluginManager?.parameters(PLUGIN_NAME) ?? {};
  const stage = new CharacterStage(readOverlayConfig(parameters));
  const api: R3DOverlayPublicApi = {
    show: () => stage.show(),
    hide: () => stage.hide(),
    loadCharacter: (path) => stage.loadCharacter(path),
    play: (clipName) => stage.play(clipName),
    dispose: () => stage.dispose(),
  };

  window.R3DCharacterOverlayDemo = api;
  installPluginCommandRoute(stage);
  installSceneUpdateHook(stage);

  if (readOverlayConfig(parameters).autoShow) {
    stage.show();
  }

  logInfo('Plugin installed.');
}

function installPluginCommandRoute(stage: CharacterStage): void {
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

    if (!COMMAND_PREFIXES.has(command)) {
      return;
    }

    const [subCommand = '', ...rest] = args;
    routePluginCommand(stage, subCommand, rest);
  };
}

function routePluginCommand(stage: CharacterStage, subCommand: string, args: string[]): void {
  switch (subCommand.toLowerCase()) {
    case 'show':
      stage.show();
      break;
    case 'hide':
      stage.hide();
      break;
    case 'loadcharacter':
      void stage.loadCharacter(args.join(' '));
      break;
    case 'play':
      stage.play(args.join(' '));
      break;
    default:
      logWarning(`Unknown plugin command: ${subCommand}`);
      break;
  }
}

function installSceneUpdateHook(stage: CharacterStage): void {
  const sceneManager = window.SceneManager;
  if (!sceneManager) {
    logWarning('SceneManager was not available; overlay updates were not installed.');
    return;
  }

  const originalUpdateMain = sceneManager.updateMain;
  sceneManager.updateMain = function updateMain() {
    originalUpdateMain.call(this);

    if (window.Input?.isTriggered('ok')) {
      stage.reactToOkInput();
    }

    stage.update(performance.now());
  };
}
