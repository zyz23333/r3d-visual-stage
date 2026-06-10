export interface MvPluginManager {
  parameters(name: string): Record<string, string | undefined>;
}

export interface MvGraphics {
  width: number;
  height: number;
  boxWidth: number;
  boxHeight: number;
  _canvas?: HTMLCanvasElement;
}

export interface MvInput {
  isTriggered(keyName: string): boolean;
}

export interface MvSceneManager {
  updateMain(): void;
}

export interface MvGameInterpreterConstructor {
  prototype: {
    pluginCommand(command: string, args: string[]): void;
  };
}

interface NwJsLikeRequire {
  (moduleName: 'fs'): typeof import('node:fs');
  (moduleName: 'path'): typeof import('node:path');
  (moduleName: string): unknown;
}

declare global {
  interface Window {
    PluginManager?: MvPluginManager;
    Graphics?: MvGraphics;
    Input?: MvInput;
    SceneManager?: MvSceneManager;
    Game_Interpreter?: MvGameInterpreterConstructor;
    R3DVisualStage?: R3DVisualStageApi;
    require?: NwJsLikeRequire;
    process?: {
      cwd(): string;
    };
  }
}

export interface R3DVisualStageApi {
  character: R3DVisualStageCharacterApi;
  dispose(): void;
}

export interface R3DVisualStageCharacterApi {
  show(): void;
  hide(): void;
  load(path: string): Promise<void>;
  play(clipName: string): boolean;
}
