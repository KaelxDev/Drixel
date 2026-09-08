import { hexToRgb, PAPER_A, PAPER_B } from "./palettes";
import type { Pixel } from "./operations";

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
