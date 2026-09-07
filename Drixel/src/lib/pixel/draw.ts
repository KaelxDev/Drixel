import { hexToRgb, PAPER_A, PAPER_B } from "./palettes";

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

const paperA = hexToRgb(PAPER_A);
const paperB = hexToRgb(PAPER_B);

export function renderPixels(
  ctx: CanvasRenderingContext2D,
  pixels: Pixel[],
  size: number,
  cssSize: number,
  options: {
    showGrid: boolean;
    hover: { x: number; y: number } | null;
    hoverColor: Pixel;
    brush: number;
    tool: "pencil" | "eraser" | "fill" | "eyedropper";
  },
  offscreen: HTMLCanvasElement,
) {
  offscreen.width = size;
  offscreen.height = size;
  const off = offscreen.getContext("2d");
  if (!off) return;
  const img = off.createImageData(size, size);
  const data = img.data;
  for (let i = 0; i < pixels.length; i++) {
    const x = i % size;
    const y = (i / size) | 0;
    const o = i * 4;
    const p = pixels[i];
    if (p) {
      const [r, g, b] = hexToRgb(p);
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    } else {
      const check = (x + y) & 1;
      const [r, g, b] = check ? paperB : paperA;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
  }
  off.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cssSize, cssSize);
  ctx.drawImage(offscreen, 0, 0, cssSize, cssSize);

  const cell = cssSize / size;

  if (options.hover) {
    const { x, y } = options.hover;
    if (options.tool === "fill" || options.tool === "eyedropper") {
      paintHoverCell(ctx, x, y, cell, options.hoverColor, options.tool);
    } else {
      const left = x - Math.floor((options.brush - 1) / 2);
      const top = y - Math.floor((options.brush - 1) / 2);
      for (let by = top; by < top + options.brush; by++) {
        for (let bx = left; bx < left + options.brush; bx++) {
          if (bx >= 0 && by >= 0 && bx < size && by < size) {
            paintHoverCell(
              ctx,
              bx,
              by,
              cell,
              options.tool === "eraser" ? null : options.hoverColor,
              options.tool,
            );
          }
        }
      }
    }
  }

  if (options.showGrid && cell >= 4) {
    ctx.save();
    ctx.strokeStyle = "rgba(14, 14, 12, 0.22)";
    ctx.lineWidth = Math.max(1, cell / 16);
    ctx.beginPath();
    for (let i = 1; i < size; i++) {
      const p = i * cell;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, cssSize);
      ctx.moveTo(0, p);
      ctx.lineTo(cssSize, p);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function paintHoverCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  color: Pixel,
  tool: "pencil" | "eraser" | "fill" | "eyedropper",
) {
  ctx.save();
  if (tool === "eyedropper") {
    ctx.strokeStyle = "rgba(14, 14, 12, 0.7)";
    ctx.lineWidth = Math.max(1, cell / 8);
    ctx.strokeRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
  } else if (color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x * cell, y * cell, cell, cell);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "rgba(242, 239, 230, 0.55)";
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
  ctx.restore();
}

export function exportPng(
  pixels: Pixel[],
  size: number,
  scale: number,
): Promise<Blob> {
  const src = document.createElement("canvas");
  src.width = size;
  src.height = size;
  const srcCtx = src.getContext("2d");
  if (!srcCtx) return Promise.reject(new Error("Canvas indisponível"));
  const img = srcCtx.createImageData(size, size);
  const data = img.data;
  for (let i = 0; i < pixels.length; i++) {
    const o = i * 4;
    const p = pixels[i];
    if (!p) {
      data[o + 3] = 0;
      continue;
    }
    const [r, g, b] = hexToRgb(p);
    data[o] = r;
    data[o + 1] = g;
    data[o + 2] = b;
    data[o + 3] = 255;
  }
  srcCtx.putImageData(img, 0, 0);

  const out = document.createElement("canvas");
  out.width = size * scale;
  out.height = size * scale;
  const outCtx = out.getContext("2d");
  if (!outCtx) return Promise.reject(new Error("Canvas indisponível"));
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(src, 0, 0, out.width, out.height);

  return new Promise((resolve, reject) => {
    out.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar PNG"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function pointerToCell(
  event: Pick<PointerEvent, "clientX" | "clientY">,
  canvas: HTMLCanvasElement,
  size: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return { x, y };
}
