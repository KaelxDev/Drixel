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
