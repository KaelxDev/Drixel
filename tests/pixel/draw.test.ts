import { describe, expect, it } from "vitest";
import {
  bresenham,
  brushCells,
  emptyPixels,
  floodFill,
  paintValue,
  resizePixels,
} from "../../src/lib/pixel/draw";

describe("pixel operations", () => {
  it("creates an empty pixel buffer", () => {
    const pixels = emptyPixels(8);

    expect(pixels).toHaveLength(64);
    expect(pixels.every((pixel) => pixel === null)).toBe(true);
  });

  it("resizes while preserving the top-left content", () => {
    const source = ["#111111", null, null, "#222222"];

    expect(resizePixels(source, 2, 3)).toEqual([
      "#111111",
      null,
      null,
      "#222222",
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("crops content when shrinking the canvas", () => {
    const source = [
      "#111111",
      "#222222",
      "#333333",
      "#444444",
      "#555555",
      "#666666",
      "#777777",
      "#888888",
      "#999999",
    ];

    expect(resizePixels(source, 3, 2)).toEqual([
      "#111111",
      "#222222",
      "#444444",
      "#555555",
    ]);
  });

  it("generates a centered brush and keeps cells inside bounds", () => {
    expect(brushCells(2, 2, 5, 3)).toHaveLength(9);
    expect(brushCells(0, 0, 5, 3)).toEqual([0, 1, 5, 6]);
  });

  it("generates complete diagonal Bresenham paths", () => {
    expect(bresenham(0, 0, 3, 3)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it("fills only the connected region", () => {
    const pixels = [
      null,
      null,
      null,
      null,
      "#111111",
      null,
      null,
      null,
      null,
    ];

    expect(floodFill(pixels, 3, 0, 0, "#ff0000")).toEqual([
      "#ff0000",
      "#ff0000",
      "#ff0000",
      "#ff0000",
      "#111111",
      "#ff0000",
      "#ff0000",
      "#ff0000",
      "#ff0000",
    ]);
  });

  it("returns the same buffer when nothing changes", () => {
    const pixels = ["#ff0000", null];

    expect(paintValue(pixels, [0], "#ff0000")).toBe(pixels);
  });

  it("returns a new buffer when a cell changes", () => {
    const pixels = ["#ff0000", null];
    const next = paintValue(pixels, [1], "#00ff00");

    expect(next).not.toBe(pixels);
    expect(next).toEqual(["#ff0000", "#00ff00"]);
  });
});
