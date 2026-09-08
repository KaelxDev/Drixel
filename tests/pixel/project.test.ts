import { describe, expect, it } from "vitest";
import { emptyPixels } from "../../src/lib/pixel/draw";
import {
  createProject,
  parseProject,
  projectFilename,
  serializeProject,
} from "../../src/lib/pixel/project";

const pixels = emptyPixels(8);
pixels[0] = "#ff004d";
pixels[63] = "#00e436";

const project = createProject({
  size: 8,
  pixels,
  paletteId: "pico8",
  color: "#ff004d",
  brush: 2,
  showGrid: false,
});

describe("drixe project format", () => {
  it("serializes and parses a project without losing pixels", () => {
    const parsed = parseProject(serializeProject(project));

    expect(parsed.format).toBe("drixe");
    expect(parsed.version).toBe(1);
    expect(parsed.size).toBe(8);
    expect(parsed.pixels[0]).toBe("#ff004d");
    expect(parsed.pixels[63]).toBe("#00e436");
    expect(parsed.showGrid).toBe(false);
    expect(parsed.brush).toBe(2);
  });

  it("rejects invalid project data", () => {
    expect(() => parseProject(JSON.stringify({ format: "other", version: 1 }))).toThrow();
    expect(() =>
      parseProject(
        JSON.stringify({
          format: "drixe",
          version: 1,
          size: 8,
          pixels: [],
        }),
      ),
    ).toThrow();
  });

  it("builds a safe drixe filename", () => {
    expect(projectFilename(32, "My Pixel Art! 01")).toBe(
      "my-pixel-art-01-32x32.drixe",
    );
  });
});
