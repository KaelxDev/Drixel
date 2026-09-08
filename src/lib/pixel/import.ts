import { GRID_SIZES, type GridSize } from "./palettes";
import type { Pixel } from "./draw";

function isGridSize(value: number): value is GridSize {
  return (GRID_SIZES as readonly number[]).includes(value);
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

export type ImportedImage = {
  pixels: Pixel[];
  size: GridSize;
  sourceWidth: number;
  sourceHeight: number;
};

export async function importPng(
  file: File,
  fallbackSize: GridSize,
): Promise<ImportedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const size =
      bitmap.width === bitmap.height && isGridSize(bitmap.width)
        ? bitmap.width
        : fallbackSize;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas indisponível para importar a imagem.");

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, size, size);
    context.drawImage(bitmap, 0, 0, size, size);

    const { data } = context.getImageData(0, 0, size, size);
    const pixels: Pixel[] = new Array(size * size).fill(null);

    for (let i = 0; i < pixels.length; i++) {
      const offset = i * 4;
      if (data[offset + 3] === 0) continue;
      pixels[i] = rgbToHex(data[offset], data[offset + 1], data[offset + 2]);
    }

    return {
      pixels,
      size,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}
