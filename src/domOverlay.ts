import type { OverlayConfig } from './config';

export interface OverlayViewport {
  width: number;
  height: number;
}

export class DomOverlay {
  private readonly canvas: HTMLCanvasElement;
  private readonly config: OverlayConfig;
  private viewport: OverlayViewport = { width: 1, height: 1 };

  public constructor(canvas: HTMLCanvasElement, config: OverlayConfig) {
    this.canvas = canvas;
    this.config = config;
    this.canvas.id = 'R3DCharacterOverlayCanvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.margin = 'auto';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '4';
    this.canvas.style.background = 'transparent';
    this.canvas.style.display = 'none';
  }

  public ensureMounted(): void {
    if (!this.canvas.parentElement) {
      document.body.appendChild(this.canvas);
    }
  }

  public show(): void {
    this.ensureMounted();
    this.canvas.style.display = 'block';
  }

  public hide(): void {
    this.canvas.style.display = 'none';
  }

  public updateLayout(): OverlayViewport {
    const gameCanvas = window.Graphics?._canvas;
    if (!gameCanvas) {
      return this.viewport;
    }

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
}
