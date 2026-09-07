import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  bresenham,
  brushCells,
  pointerToCell,
  renderPixels,
} from "@/lib/pixel/draw";
import { persistNow, usePixelStore } from "@/lib/pixel/store";

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cssSizeRef = useRef(320);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);
  const strokePushedRef = useRef(false);

  const size = usePixelStore((s) => s.size);
  const pixels = usePixelStore((s) => s.pixels);
  const tool = usePixelStore((s) => s.tool);
  const color = usePixelStore((s) => s.color);
  const brush = usePixelStore((s) => s.brush);
  const showGrid = usePixelStore((s) => s.showGrid);
  const hover = usePixelStore((s) => s.hover);

  const paintFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas");
    }
    const cssSize = cssSizeRef.current;
    const state = usePixelStore.getState();
    renderPixels(
      ctx,
      state.pixels,
      state.size,
      cssSize,
      {
        showGrid: state.showGrid,
        hover: state.hover,
        hoverColor: state.color,
        brush: state.brush,
        tool: state.tool,
      },
      offscreenRef.current,
    );
  }, []);

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastCellRef.current = null;
    if (dirtyRef.current) {
      persistNow();
    } else if (strokePushedRef.current) {
      usePixelStore.setState((s) => ({
        history: s.history.slice(0, -1),
      }));
    }
    dirtyRef.current = false;
    strokePushedRef.current = false;
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const fit = () => {
      const rect = stage.getBoundingClientRect();
      const pad = 16;
      const available = Math.max(
        64,
        Math.min(rect.width, rect.height) - pad * 2,
      );
      const cell = Math.max(1, Math.floor(available / size));
      const cssSize = cell * size;
      cssSizeRef.current = cssSize;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      paintFrame();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [size, paintFrame]);

  useLayoutEffect(() => {
    paintFrame();
  }, [pixels, size, showGrid, hover, color, brush, tool, paintFrame]);

  useEffect(() => {
    const onBlur = () => endStroke();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [endStroke]);

  const paintSegment = (
    from: { x: number; y: number } | null,
    to: { x: number; y: number },
  ) => {
    const state = usePixelStore.getState();
    const value = state.tool === "eraser" ? null : state.color;
    const points = from
      ? bresenham(from.x, from.y, to.x, to.y)
      : ([[to.x, to.y]] as Array<[number, number]>);
    const cells: number[] = [];
    for (const [x, y] of points) {
      cells.push(...brushCells(x, y, state.size, state.brush));
    }
    if (state.applyCells(cells, value)) dirtyRef.current = true;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button === 2) {
      event.preventDefault();
      const cell = pointerToCell(event.nativeEvent, event.currentTarget, size);
      if (cell) usePixelStore.getState().sampleAt(cell.x, cell.y);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic pointer events have no active capture target */
    }
    const cell = pointerToCell(event.nativeEvent, event.currentTarget, size);
    if (!cell) return;

    const current = usePixelStore.getState();
    if (current.tool === "eyedropper") {
      current.sampleAt(cell.x, cell.y);
      return;
    }
    if (current.tool === "fill") {
      current.fillAt(cell.x, cell.y);
      return;
    }

    drawingRef.current = true;
    dirtyRef.current = false;
    strokePushedRef.current = false;
    current.pushHistory();
    strokePushedRef.current = true;
    paintSegment(null, cell);
    lastCellRef.current = cell;
    current.setHover(cell);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = pointerToCell(event.nativeEvent, event.currentTarget, size);
    const current = usePixelStore.getState();
    if (!cell) {
      if (current.hover) current.setHover(null);
      lastCellRef.current = null;
      return;
    }
    if (
      !current.hover ||
      current.hover.x !== cell.x ||
      current.hover.y !== cell.y
    ) {
      current.setHover(cell);
    }
    if (!drawingRef.current) return;
    if (current.tool === "fill" || current.tool === "eyedropper") return;

    paintSegment(lastCellRef.current, cell);
    lastCellRef.current = cell;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* ignore */
    }
    endStroke();
  };

  const onPointerLeave = () => {
    usePixelStore.getState().setHover(null);
    if (!drawingRef.current) lastCellRef.current = null;
  };

  const cursor =
    tool === "eyedropper"
      ? "cursor-copy"
      : tool === "fill"
        ? "cursor-cell"
        : "cursor-crosshair";

  return (
    <div
      ref={stageRef}
      className="studio-stage relative grid min-h-0 place-items-center overflow-hidden bg-stage p-4"
    >
      <div className="canvas-frame relative">
        <canvas
          ref={canvasRef}
          className={`block touch-none ${cursor}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Tela de pixel art"
        />
      </div>
    </div>
  );
}
