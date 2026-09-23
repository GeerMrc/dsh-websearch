/**
 * jsdom test-environment polyfill (S32): the 0.1.7 ui-primitives Tooltip
 * sizes itself through `ResizeObserver`, which jsdom does not implement —
 * and its visibility flips inside the observer's `fit()` callback, so a
 * no-op observer would leave every tooltip hidden. The stub mirrors the
 * real observer's initial synchronous-ish delivery: `observe` schedules one
 * callback with a zero-sized entry, which runs `fit()` and reveals the
 * tooltip. Component tests stay about rendering and wiring, not layout
 * measurement.
 */
class ResizeObserverStub implements ResizeObserver {
  readonly #callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback
  }

  observe(target: Element): void {
    const entry = {
      target,
      borderBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      contentRect: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 },
      contentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      devicePixelContentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
    } as unknown as ResizeObserverEntry
    // Synchronous delivery (the real observer is async, but the component
    // tests assert the revealed tooltip right after the focus event, inside
    // the same act() tick).
    this.#callback([entry], this)
  }

  unobserve(): void {}

  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub
}

export {}
