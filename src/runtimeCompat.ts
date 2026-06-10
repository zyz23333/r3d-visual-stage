class R3DAbortSignal {
  public aborted = false;
  public onabort: (() => void) | null = null;
  private readonly listeners = new Set<() => void>();

  public addEventListener(type: string, listener: () => void): void {
    if (type === 'abort') {
      this.listeners.add(listener);
    }
  }

  public removeEventListener(type: string, listener: () => void): void {
    if (type === 'abort') {
      this.listeners.delete(listener);
    }
  }

  public dispatchEvent(event: { type: string }): boolean {
    if (event.type !== 'abort') {
      return true;
    }

    this.onabort?.();
    for (const listener of this.listeners) {
      listener();
    }

    return true;
  }
}

class R3DAbortController {
  public readonly signal = new R3DAbortSignal();

  public abort(): void {
    if (this.signal.aborted) {
      return;
    }

    this.signal.aborted = true;
    this.signal.dispatchEvent({ type: 'abort' });
  }
}

export function installRuntimeCompat(): void {
  const globalObject = globalThis as typeof globalThis & {
    AbortController?: typeof AbortController;
    AbortSignal?: typeof AbortSignal;
  };

  if (typeof globalObject.AbortController === 'undefined') {
    globalObject.AbortController = R3DAbortController as unknown as typeof AbortController;
  }

  if (typeof globalObject.AbortSignal === 'undefined') {
    globalObject.AbortSignal = R3DAbortSignal as unknown as typeof AbortSignal;
  }
}
