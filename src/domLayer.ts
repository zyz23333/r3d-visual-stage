import type { CharacterDisplayConfig } from './config';

export interface DomLayerViewport {
  width: number;
  height: number;
}

export interface DomLayerDiagnostics {
  display: string;
  isBodyLastChild: boolean;
  isMounted: boolean;
  viewport: DomLayerViewport;
  zIndex: string;
}

export class DomLayer {
  private readonly canvas: HTMLCanvasElement;
  private readonly config: CharacterDisplayConfig;
  private viewport: DomLayerViewport = { width: 1, height: 1 };
  private visible = false;

  public constructor(canvas: HTMLCanvasElement, config: CharacterDisplayConfig) {
    this.canvas = canvas;
    this.config = config;
    this.canvas.id = 'R3DCharacterDisplayCanvas';
    this.applyBaseStyles();
    this.canvas.style.display = 'none';
  }

  public show(): void {
    this.visible = true;
    this.canvas.style.display = 'block';
  }

  public hide(): void {
    this.visible = false;
    this.canvas.style.display = 'none';
  }

  public updateLayout(): DomLayerViewport {
    const gameCanvas = window.Graphics?._canvas;
    if (!gameCanvas) {
      return this.viewport;
    }

    this.ensureMountedAboveMvCanvases();

    const bounds = gameCanvas.getBoundingClientRect();
    const scaleX = bounds.width / Math.max(window.Graphics?.width ?? bounds.width, 1);
    const displayCssWidth = Math.min(this.config.characterDisplayWidth * scaleX, bounds.width);

    this.canvas.style.top = `${bounds.top + window.scrollY}px`;
    this.canvas.style.left = `${bounds.right + window.scrollX - displayCssWidth}px`;
    this.canvas.style.right = 'auto';
    this.canvas.style.bottom = 'auto';
    this.canvas.style.width = `${displayCssWidth}px`;
    this.canvas.style.height = `${bounds.height}px`;

    this.viewport = {
      width: Math.max(Math.floor(displayCssWidth), 1),
      height: Math.max(Math.floor(bounds.height), 1),
    };

    return this.viewport;
  }

  public dispose(): void {
    this.canvas.remove();
  }

  public diagnostics(): DomLayerDiagnostics {
    return {
      display: this.canvas.style.display,
      isBodyLastChild: document.body.lastElementChild === this.canvas,
      isMounted: Boolean(this.canvas.parentElement),
      viewport: this.viewport,
      zIndex: this.canvas.style.zIndex,
    };
  }

  private ensureMountedAboveMvCanvases(): void {
    this.applyBaseStyles();
    this.canvas.style.display = this.visible ? 'block' : 'none';

    if (!this.canvas.parentElement || document.body.lastElementChild !== this.canvas) {
      document.body.appendChild(this.canvas);
    }
  }

  private applyBaseStyles(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.margin = 'auto';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '4';
    this.canvas.style.background = 'transparent';
  }
}
