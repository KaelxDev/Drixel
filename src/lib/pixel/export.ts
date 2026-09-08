import { hexToRgb } from "./palettes";
import type { ExportScale } from "./palettes";
import type { Pixel } from "./operations";

export function exportPng(
  pixels: Pixel[],
  size: number,
  scale: ExportScale | number,
): Promise<Blob> {
  const src = document.createElement("canvas");
  src.width = size;
  src.height = size;
  const srcCtx = src.getContext("2d");
  if (!srcCtx) return Promise.reject(new Error("Canvas indisponível"));

  const img = srcCtx.createImageData(size, size);
  const data = img.data;
  for (let i = 0; i < pixels.length; i++) {
    const offset = i * 4;
    const pixel = pixels[i];
    if (!pixel) {
      data[offset + 3] = 0;
      continue;
    }
    const [r, g, b] = hexToRgb(pixel);
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
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
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
