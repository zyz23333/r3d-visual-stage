import { readCharacterDisplayConfig } from './config';
import { installFileLogger } from './fileLogger';
import { logInfo, logWarning } from './diagnostics';
import { CharacterDisplay } from './characterDisplay';
import type { R3DVisualStageApi } from './mvTypes';

const PLUGIN_NAME = 'R3DVisualStage';
const COMMAND_PREFIX = 'R3DStage';

export function installR3DVisualStage(): void {
  const parameters = window.PluginManager?.parameters(PLUGIN_NAME) ?? {};
  const config = readCharacterDisplayConfig(parameters);
  installFileLogger(config);

  const characterDisplay = new CharacterDisplay(config);
  const api: R3DVisualStageApi = {
    character: {
      show: () => characterDisplay.show(),
      hide: () => characterDisplay.hide(),
      load: (path) => characterDisplay.load(path),
      play: (clipName) => characterDisplay.play(clipName),
    },
    dispose: () => characterDisplay.dispose(),
  };

  window.R3DVisualStage = api;
  installPluginCommandRoute(characterDisplay);
  installSceneUpdateHook(characterDisplay);

  if (config.autoShowCharacter) {
    characterDisplay.show();
  }

  logInfo('Plugin installed.');
}

function installPluginCommandRoute(characterDisplay: CharacterDisplay): void {
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
    routePluginCommand(characterDisplay, commandDomain, subCommand, rest);
  };
}

function routePluginCommand(
  characterDisplay: CharacterDisplay,
  commandDomain: string,
  subCommand: string,
  args: string[],
): void {
  if (commandDomain.toLowerCase() !== 'character') {
    logWarning(`Unknown R3DStage command domain: ${commandDomain}`);
    return;
  }

  switch (subCommand.toLowerCase()) {
    case 'show':
      characterDisplay.show();
      break;
    case 'hide':
      characterDisplay.hide();
      break;
    case 'load':
      void characterDisplay.load(args.join(' '));
      break;
    case 'play':
      characterDisplay.play(args.join(' '));
      break;
    default:
      logWarning(`Unknown plugin command: ${subCommand}`);
      break;
  }
}

function installSceneUpdateHook(characterDisplay: CharacterDisplay): void {
  const sceneManager = window.SceneManager;
  if (!sceneManager) {
    logWarning('SceneManager was not available; character display updates were not installed.');
    return;
  }

  const originalUpdateMain = sceneManager.updateMain;
  sceneManager.updateMain = function updateMain() {
    originalUpdateMain.call(this);

    if (window.Input?.isTriggered('ok')) {
      characterDisplay.reactToOkInput();
    }

    characterDisplay.update(performance.now());
  };
}
