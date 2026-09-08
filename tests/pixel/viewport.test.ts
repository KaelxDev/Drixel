import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  useViewportStore,
} from "../../src/lib/pixel/viewport";

beforeEach(() => {
  useViewportStore.getState().resetView();
});

describe("pixel viewport", () => {
  it("clamps zoom to supported limits", () => {
    useViewportStore.getState().setZoom(0);
    expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);

    useViewportStore.getState().setZoom(100);
    expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
  });

  it("moves the viewport without changing zoom", () => {
    useViewportStore.getState().panBy(24, -12);
    const state = useViewportStore.getState();

    expect(state.panX).toBe(24);
    expect(state.panY).toBe(-12);
    expect(state.zoom).toBe(1);
  });

  it("resets zoom and pan together", () => {
    const viewport = useViewportStore.getState();
    viewport.setZoom(4);
    viewport.panBy(80, 40);
    viewport.resetView();

    expect(useViewportStore.getState()).toMatchObject({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  });
});
