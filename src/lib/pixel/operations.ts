import { hexToRgb } from "./palettes";

export type Pixel = string | null;

export function emptyPixels(size: number): Pixel[] {
  return Array.from({ length: size * size }, () => null);
}

export function resizePixels(
  pixels: Pixel[],
  oldSize: number,
  newSize: number,
): Pixel[] {
  const next = emptyPixels(newSize);
  const copy = Math.min(oldSize, newSize);
  for (let y = 0; y < copy; y++) {
    for (let x = 0; x < copy; x++) {
      next[y * newSize + x] = pixels[y * oldSize + x] ?? null;
    }
  }
  return next;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function cellIndex(x: number, y: number, size: number): number {
  return y * size + x;
}

/** Square brush around (cx, cy). Even sizes bias toward bottom-right. */
export function brushCells(
  cx: number,
  cy: number,
  size: number,
  brush: number,
): number[] {
  const cells: number[] = [];
  const left = cx - Math.floor((brush - 1) / 2);
  const top = cy - Math.floor((brush - 1) / 2);
  for (let y = top; y < top + brush; y++) {
    for (let x = left; x < left + brush; x++) {
      if (x >= 0 && y >= 0 && x < size && y < size) {
        cells.push(cellIndex(x, y, size));
      }
    }
  }
  return cells;
}

export function bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function floodFill(
  pixels: Pixel[],
  size: number,
  x: number,
  y: number,
  color: Pixel,
): Pixel[] {
  if (x < 0 || y < 0 || x >= size || y >= size) return pixels;
  const start = pixels[cellIndex(x, y, size)] ?? null;
  if (start === color) return pixels;
  const next = pixels.slice();
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue;
    const i = cellIndex(cx, cy, size);
    if ((next[i] ?? null) !== start) continue;
    next[i] = color;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return next;
}

export function paintValue(
  pixels: Pixel[],
  indices: number[],
  color: Pixel,
): Pixel[] {
  let changed = false;
  for (const i of indices) {
    if (pixels[i] !== color) {
      changed = true;
      break;
    }
  }
  if (!changed) return pixels;
  const next = pixels.slice();
  for (const i of indices) next[i] = color;
  return next;
}

export { hexToRgb } from "./palettes";
