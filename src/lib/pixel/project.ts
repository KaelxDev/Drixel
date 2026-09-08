import {
  BRUSH_SIZES,
  GRID_SIZES,
  PALETTES,
  paletteById,
  type BrushSize,
  type GridSize,
} from "./palettes";
import type { Pixel } from "./draw";

export const DRIXE_FORMAT = "drixe";
export const DRIXE_VERSION = 1;
export const DRIXE_EXTENSION = ".drixe";

export type DrixeProject = {
  format: typeof DRIXE_FORMAT;
  version: typeof DRIXE_VERSION;
  name: string;
  size: GridSize;
  pixels: Pixel[];
  paletteId: string;
  color: string | null;
  brush: BrushSize;
  showGrid: boolean;
};

type ProjectState = Omit<DrixeProject, "format" | "version" | "name">;

function isGridSize(value: unknown): value is GridSize {
  return (
    typeof value === "number" &&
    (GRID_SIZES as readonly number[]).includes(value)
  );
}

function isBrushSize(value: unknown): value is BrushSize {
  return (
    typeof value === "number" &&
    (BRUSH_SIZES as readonly number[]).includes(value)
  );
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
}

function isPixel(value: unknown): value is Pixel {
  return value === null || isHexColor(value);
}

export function createProject(
  state: ProjectState,
  name = "Drixel project",
): DrixeProject {
  return {
    format: DRIXE_FORMAT,
    version: DRIXE_VERSION,
    name,
    size: state.size,
    pixels: state.pixels.slice(),
    paletteId: state.paletteId,
    color: state.color,
    brush: state.brush,
    showGrid: state.showGrid,
  };
}

export function serializeProject(project: DrixeProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseProject(raw: string): DrixeProject {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Arquivo .drixe inválido: JSON malformado.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Arquivo .drixe inválido.");
  }

  const input = data as Record<string, unknown>;
  if (input.format !== DRIXE_FORMAT || input.version !== DRIXE_VERSION) {
    throw new Error("Formato .drixe incompatível com esta versão do Drixel.");
  }

  if (!isGridSize(input.size)) {
    throw new Error("Tamanho de grade inválido no projeto.");
  }

  if (
    !Array.isArray(input.pixels) ||
    input.pixels.length !== input.size * input.size ||
    !input.pixels.every(isPixel)
  ) {
    throw new Error("Dados de pixels inválidos no projeto.");
  }

  const palette = paletteById(
    typeof input.paletteId === "string" ? input.paletteId : PALETTES[0].id,
  );
  const color =
    input.color === null
      ? null
      : isHexColor(input.color) && palette.colors.includes(input.color)
        ? input.color
        : palette.colors[0];
  const brush = isBrushSize(input.brush) ? input.brush : 1;
  const showGrid = typeof input.showGrid === "boolean" ? input.showGrid : true;
  const name = typeof input.name === "string" && input.name.trim()
    ? input.name.trim()
    : "Drixel project";

  return {
    format: DRIXE_FORMAT,
    version: DRIXE_VERSION,
    name,
    size: input.size,
    pixels: input.pixels.slice() as Pixel[],
    paletteId: palette.id,
    color,
    brush,
    showGrid,
  };
}

export function projectFilename(size: number, name = "drixel"): string {
  const safeName = name
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "drixel";
  return `${safeName}-${size}x${size}${DRIXE_EXTENSION}`;
}

export function downloadProject(project: DrixeProject) {
  const blob = new Blob([serializeProject(project)], {
    type: "application/x-drixe",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = projectFilename(project.size, project.name);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
