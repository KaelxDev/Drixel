import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { bresenham, brushCells } from "@/lib/pixel/operations";
import { pointerToCell } from "@/lib/pixel/coordinates";
import { renderPixels } from "@/lib/pixel/renderer";
import { persistNow, usePixelStore } from "@/lib/pixel/store";
import { useViewportStore } from "@/lib/pixel/viewport";

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cssSizeRef = useRef(320);
  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const dirtyRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);
  const strokePushedRef = useRef(false);
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);

  const size = usePixelStore((s) => s.size);
  const pixels = usePixelStore((s) => s.pixels);
  const tool = usePixelStore((s) => s.tool);
  const color = usePixelStore((s) => s.color);
  const brush = usePixelStore((s) => s.brush);
  const showGrid = usePixelStore((s) => s.showGrid);
  const hover = usePixelStore((s) => s.hover);
  const zoom = useViewportStore((s) => s.zoom);
  const panX = useViewportStore((s) => s.panX);
  const panY = useViewportStore((s) => s.panY);

  const paintFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");

    const state = usePixelStore.getState();
    renderPixels(
      ctx,
      state.pixels,
      state.size,
      cssSizeRef.current,
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

  const releasePointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        /* ignore */
      }
    },
  );

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastCellRef.current = null;
    if (dirtyRef.current) {
      persistNow();
    } else if (strokePushedRef.current) {
      usePixelStore.setState((state) => ({
        history: state.history.slice(0, -1),
      }));
    }
    dirtyRef.current = false;
    strokePushedRef.current = false;
  }, []);

  const endPan = useCallback(() => {
    panningRef.current = false;
    panStartRef.current = null;
    setPanning(false);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const fit = () => {
      const rect = stage.getBoundingClientRect();
      const pad = 16;
      const available = Math.max(64, Math.min(rect.width, rect.height) - pad * 2);
      const cell = Math.max(1, Math.floor(available / size));
      const cssSize = cell * size;
      cssSizeRef.current = cssSize;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      spaceHeldRef.current = true;
      setSpaceHeld(true);
      event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      event.preventDefault();
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
      setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const onBlur = () => {
      endStroke();
      endPan();
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [endPan, endStroke]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
  }, [panX, panY, zoom]);

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
    for (const [x, y] of points) cells.push(...brushCells(x, y, state.size, state.brush));
    if (state.applyCells(cells, value)) dirtyRef.current = true;
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const current = useViewportStore.getState();
    current.setZoom(current.zoom * Math.exp(-event.deltaY * 0.002));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const shouldPan =
      event.button === 1 || (event.button === 0 && spaceHeldRef.current);
    if (shouldPan) {
      event.preventDefault();
      panningRef.current = true;
      setPanning(true);
      const viewport = useViewportStore.getState();
      panStartRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        panX: viewport.panX,
        panY: viewport.panY,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* synthetic pointer events have no active capture target */
      }
      return;
    }

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
    if (panningRef.current) {
      const start = panStartRef.current;
      if (!start) return;
      useViewportStore.getState().setPan(
        start.panX + event.clientX - start.clientX,
        start.panY + event.clientY - start.clientY,
      );
      return;
    }

    const cell = pointerToCell(event.nativeEvent, event.currentTarget, size);
    const current = usePixelStore.getState();
    if (!cell) {
      if (current.hover) current.setHover(null);
      lastCellRef.current = null;
      return;
    }
    if (!current.hover || current.hover.x !== cell.x || current.hover.y !== cell.y) {
      current.setHover(cell);
    }
    if (!drawingRef.current) return;
    if (current.tool === "fill" || current.tool === "eyedropper") return;

    paintSegment(lastCellRef.current, cell);
    lastCellRef.current = cell;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    releasePointer(event);
    if (panningRef.current) {
      endPan();
      return;
    }
    endStroke();
  };

  const onPointerLeave = () => {
    if (panningRef.current) return;
    usePixelStore.getState().setHover(null);
    if (!drawingRef.current) lastCellRef.current = null;
  };

  const cursor =
    panning || spaceHeld
      ? "cursor-grab"
      : tool === "eyedropper"
        ? "cursor-copy"
        : tool === "fill"
          ? "cursor-cell"
          : "cursor-crosshair";

  return (
    <div
      ref={stageRef}
      className="studio-stage relative grid min-h-0 place-items-center overflow-hidden bg-stage p-4"
      onWheel={onWheel}
    >
      <div
        ref={frameRef}
        className="canvas-frame relative"
        style={{ transformOrigin: "center center", willChange: "transform" }}
      >
        <canvas
          ref={canvasRef}
          className={`block touch-none ${cursor}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Tela de pixel art"
        />
      </div>
    </div>
  );
}
