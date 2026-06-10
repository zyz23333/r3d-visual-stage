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
    R3DCharacterOverlayDemo?: R3DOverlayPublicApi;
    require?: NwJsLikeRequire;
    process?: {
      cwd(): string;
    };
  }
}

export interface R3DOverlayPublicApi {
  show(): void;
  hide(): void;
  loadCharacter(path: string): Promise<void>;
  play(clipName: string): boolean;
  dispose(): void;
}
