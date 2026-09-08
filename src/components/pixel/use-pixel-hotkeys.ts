import { useEffect } from "react";
import { BRUSH_SIZES, GRID_SIZES, type GridSize } from "@/lib/pixel/palettes";
import { usePixelStore } from "@/lib/pixel/store";
import { saveCurrentProject } from "./project-actions";

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
      (element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.isContentEditable),
  );
}

export function usePixelHotkeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const store = usePixelStore.getState();

      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }

      if (meta && key === "y") {
        event.preventDefault();
        store.redo();
        return;
      }

      if (meta && key === "s") {
        event.preventDefault();
        saveCurrentProject();
        return;
      }

      if (key === "b" || key === "p") store.setTool("pencil");
      else if (key === "e") store.setTool("eraser");
      else if (key === "g" || key === "f") store.setTool("fill");
      else if (key === "i") store.setTool("eyedropper");
      else if (key === "h") {
        event.preventDefault();
        store.toggleGrid();
      } else if (key === "[" || key === "]") {
        const index = BRUSH_SIZES.indexOf(store.brush);
        const next = BRUSH_SIZES[index + (key === "]" ? 1 : -1)];
        if (next) store.setBrush(next);
      } else if (key === "-" || key === "=" || key === "+") {
        const index = GRID_SIZES.indexOf(store.size);
        const next = GRID_SIZES[index + (key === "-" ? -1 : 1)] as
          | GridSize
          | undefined;
        if (next) store.setSize(next);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
