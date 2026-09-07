export const PAPER_A = "#e6e1d4";
export const PAPER_B = "#d4cfc0";

export type Palette = {
  id: string;
  name: string;
  colors: readonly string[];
};

export const PALETTES: readonly Palette[] = [
  {
    id: "pico8",
    name: "PICO-8",
    colors: [
      "#000000",
      "#1d2b53",
      "#7e2553",
      "#008751",
      "#ab5236",
      "#5f574f",
      "#c2c3c7",
      "#fff1e8",
      "#ff004d",
      "#ffa300",
      "#ffec27",
      "#00e436",
      "#29adff",
      "#83769c",
      "#ff77a8",
      "#ffccaa",
    ],
  },
  {
    id: "sweetie",
    name: "Sweetie 16",
    colors: [
      "#1a1c2c",
      "#5d275d",
      "#b13e53",
      "#ef7d57",
      "#ffcd75",
      "#a7f070",
      "#38b764",
      "#257179",
      "#29366f",
      "#3b5dc9",
      "#41a6f6",
      "#73eff7",
      "#f4f4f4",
      "#94b0c2",
      "#566c86",
      "#333c57",
    ],
  },
  {
    id: "c64",
    name: "Commodore 64",
    colors: [
      "#000000",
      "#ffffff",
      "#813338",
      "#75ccc8",
      "#8e3c97",
      "#56ac4d",
      "#2e2c9b",
      "#edf171",
      "#8e5029",
      "#553800",
      "#c46c71",
      "#4a4a4a",
      "#7b7b7b",
      "#a9ff9f",
      "#706deb",
      "#b2b2b2",
    ],
  },
  {
    id: "gameboy",
    name: "Game Boy",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    id: "mono",
    name: "1-bit",
    colors: ["#0b0b0b", "#f4f0e6"],
  },
] as const;

export const GRID_SIZES = [8, 16, 24, 32, 48, 64] as const;
export type GridSize = (typeof GRID_SIZES)[number];

export const BRUSH_SIZES = [1, 2, 3, 4] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

export const EXPORT_SCALES = [1, 4, 8, 16, 32] as const;
export type ExportScale = (typeof EXPORT_SCALES)[number];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
