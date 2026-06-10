import type { OverlayConfig } from './config';

export interface OverlayViewport {
  width: number;
  height: number;
}

export interface OverlayDiagnostics {
  display: string;
  isBodyLastChild: boolean;
  isMounted: boolean;
  viewport: OverlayViewport;
  zIndex: string;
}

export class DomOverlay {
  private readonly canvas: HTMLCanvasElement;
  private readonly config: OverlayConfig;
  private viewport: OverlayViewport = { width: 1, height: 1 };
  private visible = false;

  public constructor(canvas: HTMLCanvasElement, config: OverlayConfig) {
    this.canvas = canvas;
    this.config = config;
    this.canvas.id = 'R3DCharacterOverlayCanvas';
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

  public updateLayout(): OverlayViewport {
    const gameCanvas = window.Graphics?._canvas;
    if (!gameCanvas) {
      return this.viewport;
    }

    this.ensureMountedAboveMvCanvases();

    const bounds = gameCanvas.getBoundingClientRect();
    const scaleX = bounds.width / Math.max(window.Graphics?.width ?? bounds.width, 1);
    const overlayCssWidth = Math.min(this.config.overlayWidth * scaleX, bounds.width);

    this.canvas.style.top = `${bounds.top + window.scrollY}px`;
    this.canvas.style.left = `${bounds.right + window.scrollX - overlayCssWidth}px`;
    this.canvas.style.right = 'auto';
    this.canvas.style.bottom = 'auto';
    this.canvas.style.width = `${overlayCssWidth}px`;
    this.canvas.style.height = `${bounds.height}px`;

    this.viewport = {
      width: Math.max(Math.floor(overlayCssWidth), 1),
      height: Math.max(Math.floor(bounds.height), 1),
    };

    return this.viewport;
  }

  public dispose(): void {
    this.canvas.remove();
  }

  public diagnostics(): OverlayDiagnostics {
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
