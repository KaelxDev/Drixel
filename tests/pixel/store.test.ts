import { beforeEach, describe, expect, it } from "vitest";
import { BRUSH_SIZES, PALETTES } from "../../src/lib/pixel/palettes";
import { emptyPixels } from "../../src/lib/pixel/draw";
import { usePixelStore } from "../../src/lib/pixel/store";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
});

const DEFAULT_STATE = {
  size: 32 as const,
  pixels: emptyPixels(32),
  tool: "pencil" as const,
  color: PALETTES[0].colors[0],
  paletteId: PALETTES[0].id,
  brush: BRUSH_SIZES[0],
  showGrid: true,
  hover: null,
  history: [],
  future: [],
};

beforeEach(() => {
  storage.clear();
  usePixelStore.setState(DEFAULT_STATE);
});

describe("pixel store", () => {
  it("starts with a 32×32 empty canvas", () => {
    const state = usePixelStore.getState();

    expect(state.size).toBe(32);
    expect(state.pixels).toHaveLength(32 * 32);
    expect(state.history).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });

  it("persists the selected color", () => {
    usePixelStore.getState().setColor("#ff004d");

    const saved = JSON.parse(storage.getItem("drixel-v1")!);
    expect(saved.color).toBe("#ff004d");
  });

  it("persists the selected brush", () => {
    usePixelStore.getState().setBrush(4);

    const saved = JSON.parse(storage.getItem("drixel-v1")!);
    expect(saved.brush).toBe(4);
  });

  it("supports undo and redo for a canvas change", () => {
    const store = usePixelStore.getState();
    store.pushHistory();
    store.applyCells([0], "#ff0000");

    expect(usePixelStore.getState().pixels[0]).toBe("#ff0000");

    usePixelStore.getState().undo();
    expect(usePixelStore.getState().pixels[0]).toBeNull();

    usePixelStore.getState().redo();
    expect(usePixelStore.getState().pixels[0]).toBe("#ff0000");
  });

  it("resizes and records the previous canvas in history", () => {
    const store = usePixelStore.getState();
    store.applyCells([0], "#00ff00");
    store.setSize(16);

    const state = usePixelStore.getState();
    expect(state.size).toBe(16);
    expect(state.pixels).toHaveLength(16 * 16);
    expect(state.history).toHaveLength(1);
    expect(state.pixels[0]).toBe("#00ff00");

    state.undo();
    expect(usePixelStore.getState().size).toBe(32);
    expect(usePixelStore.getState().pixels[0]).toBe("#00ff00");
  });

  it("fills a connected region and records history", () => {
    const store = usePixelStore.getState();
    store.setColor("#ff0000");
    store.fillAt(0, 0);

    const state = usePixelStore.getState();
    expect(state.pixels.every((pixel) => pixel === "#ff0000")).toBe(true);
    expect(state.history).toHaveLength(1);
  });

  it("migrates legacy PIXL storage to Drixel storage", () => {
    const legacyPixels = emptyPixels(8);
    legacyPixels[0] = "#abcdef";
    storage.setItem(
      "pixl-v1",
      JSON.stringify({
        size: 8,
        pixels: legacyPixels,
        paletteId: "pico8",
        color: "#abcdef",
        showGrid: false,
        brush: 2,
      }),
    );

    usePixelStore.getState().hydrate();

    const state = usePixelStore.getState();
    expect(state.size).toBe(8);
    expect(state.pixels[0]).toBe("#abcdef");
    expect(state.showGrid).toBe(false);
    expect(state.brush).toBe(2);
    expect(storage.getItem("drixel-v1")).not.toBeNull();
    expect(storage.getItem("pixl-v1")).toBeNull();
  });
});
