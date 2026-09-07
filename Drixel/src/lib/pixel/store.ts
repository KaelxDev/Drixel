import { create } from "zustand";
import {
  BRUSH_SIZES,
  GRID_SIZES,
  PALETTES,
  paletteById,
  type BrushSize,
  type GridSize,
} from "./palettes";
import {
  emptyPixels,
  floodFill,
  paintValue,
  resizePixels,
  type Pixel,
} from "./draw";

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

export type Snapshot = {
  size: number;
  pixels: Pixel[];
};

const STORAGE_KEY = "pixl-v1";
const MAX_HISTORY = 50;

type Persisted = {
  size: number;
  pixels: Pixel[];
  paletteId: string;
  color: string | null;
  showGrid: boolean;
  brush: BrushSize;
};

function isGridSize(n: number | undefined): n is GridSize {
  return typeof n === "number" && (GRID_SIZES as readonly number[]).includes(n);
}

function isBrushSize(n: number | undefined): n is BrushSize {
  return typeof n === "number" && (BRUSH_SIZES as readonly number[]).includes(n);
}

function loadPersisted(): Partial<Persisted> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Persisted>;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

function persist(state: {
  size: number;
  pixels: Pixel[];
  paletteId: string;
  color: string | null;
  showGrid: boolean;
  brush: BrushSize;
}) {
  if (typeof localStorage === "undefined") return;
  const payload: Persisted = {
    size: state.size,
    pixels: state.pixels,
    paletteId: state.paletteId,
    color: state.color,
    showGrid: state.showGrid,
    brush: state.brush,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

type PixelState = {
  size: GridSize;
  pixels: Pixel[];
  tool: Tool;
  color: string | null;
  paletteId: string;
  brush: BrushSize;
  showGrid: boolean;
  hover: { x: number; y: number } | null;
  history: Snapshot[];
  future: Snapshot[];
  hydrate: () => void;
  setTool: (tool: Tool) => void;
  setColor: (color: string | null) => void;
  setPalette: (id: string) => void;
  setBrush: (brush: BrushSize) => void;
  toggleGrid: () => void;
  setHover: (hover: { x: number; y: number } | null) => void;
  setSize: (size: GridSize) => void;
  applyCells: (indices: number[], color: Pixel) => boolean;
  fillAt: (x: number, y: number) => boolean;
  sampleAt: (x: number, y: number) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
};

function snapshotOf(state: { size: number; pixels: Pixel[] }): Snapshot {
  return { size: state.size, pixels: state.pixels.slice() };
}

export const usePixelStore = create<PixelState>((set, get) => ({
  size: 32,
  pixels: emptyPixels(32),
  tool: "pencil",
  color: PALETTES[0].colors[0],
  paletteId: PALETTES[0].id,
  brush: 1,
  showGrid: true,
  hover: null,
  history: [],
  future: [],

  hydrate: () => {
    const saved = loadPersisted();
    if (!saved) return;
    const rawSize = saved.size;
    const size: GridSize = isGridSize(rawSize) ? rawSize : 32;
    const palette = paletteById(saved.paletteId ?? PALETTES[0].id);
    let pixels = emptyPixels(size);
    if (Array.isArray(saved.pixels) && saved.pixels.length === size * size) {
      pixels = saved.pixels.map((p) => (typeof p === "string" ? p : null));
    }
    const color =
      saved.color === null
        ? null
        : typeof saved.color === "string" && palette.colors.includes(saved.color)
          ? saved.color
          : palette.colors[0];
    const rawBrush = saved.brush;
    set({
      size,
      pixels,
      paletteId: palette.id,
      color,
      showGrid: saved.showGrid ?? true,
      brush: isBrushSize(rawBrush) ? rawBrush : 1,
    });
  },

  setTool: (tool) => set({ tool }),

  setColor: (color) => {
    const tool = get().tool;
    set({
      color,
      tool: tool === "eraser" || tool === "eyedropper" ? "pencil" : tool,
    });
  },

  setPalette: (id) => {
    const palette = paletteById(id);
    const current = get().color;
    const color =
      current && palette.colors.includes(current) ? current : palette.colors[0];
    set({ paletteId: palette.id, color });
    persist(get());
  },

  setBrush: (brush) => set({ brush }),

  toggleGrid: () => {
    set({ showGrid: !get().showGrid });
    persist(get());
  },

  setHover: (hover) => set({ hover }),

  setSize: (size) => {
    const state = get();
    if (size === state.size) return;
    const history = [...state.history, snapshotOf(state)].slice(-MAX_HISTORY);
    const pixels = resizePixels(state.pixels, state.size, size);
    set({ size, pixels, history, future: [], hover: null });
    persist(get());
  },

  pushHistory: () => {
    const state = get();
    set({
      history: [...state.history, snapshotOf(state)].slice(-MAX_HISTORY),
      future: [],
    });
  },

  applyCells: (indices, color) => {
    const state = get();
    const pixels = paintValue(state.pixels, indices, color);
    if (pixels === state.pixels) return false;
    set({ pixels });
    return true;
  },

  fillAt: (x, y) => {
    const state = get();
    const color = state.color;
    const pixels = floodFill(state.pixels, state.size, x, y, color);
    if (pixels === state.pixels) return false;
    set({
      pixels,
      history: [...state.history, snapshotOf(state)].slice(-MAX_HISTORY),
      future: [],
    });
    persist(get());
    return true;
  },

  sampleAt: (x, y) => {
    const state = get();
    if (x < 0 || y < 0 || x >= state.size || y >= state.size) return;
    const sampled = state.pixels[y * state.size + x] ?? null;
    set({
      color: sampled,
      tool: sampled ? "pencil" : "eraser",
    });
  },

  clear: () => {
    const state = get();
    const empty = emptyPixels(state.size);
    if (state.pixels.every((p) => p === null)) return;
    set({
      pixels: empty,
      history: [...state.history, snapshotOf(state)].slice(-MAX_HISTORY),
      future: [],
    });
    persist(get());
  },

  undo: () => {
    const state = get();
    const prev = state.history[state.history.length - 1];
    if (!prev) return;
    const size = isGridSize(prev.size) ? prev.size : state.size;
    set({
      size,
      pixels: prev.pixels,
      history: state.history.slice(0, -1),
      future: [snapshotOf(state), ...state.future].slice(0, MAX_HISTORY),
      hover: null,
    });
    persist(get());
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    const size = isGridSize(next.size) ? next.size : state.size;
    set({
      size,
      pixels: next.pixels,
      future: state.future.slice(1),
      history: [...state.history, snapshotOf(state)].slice(-MAX_HISTORY),
      hover: null,
    });
    persist(get());
  },
}));

export function persistNow() {
  persist(usePixelStore.getState());
}
