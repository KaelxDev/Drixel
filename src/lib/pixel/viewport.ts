import { create } from "zustand";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 16;

export const ZOOM_LEVELS = [
  0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16,
] as const;

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

function nextZoom(current: number, direction: -1 | 1): number {
  if (direction > 0) {
    return clampZoom(
      ZOOM_LEVELS.find((level) => level > current + 0.001) ?? MAX_ZOOM,
    );
  }
  return [...ZOOM_LEVELS].reverse().find((level) => level < current - 0.001) ?? MIN_ZOOM;
}

type ViewportState = {
  zoom: number;
  panX: number;
  panY: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panBy: (x: number, y: number) => void;
  resetView: () => void;
};

export const useViewportStore = create<ViewportState>((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  zoomIn: () => get().setZoom(nextZoom(get().zoom, 1)),
  zoomOut: () => get().setZoom(nextZoom(get().zoom, -1)),
  panBy: (x, y) => set((state) => ({ panX: state.panX + x, panY: state.panY + y })),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
}));
