import { usePixelStore } from "@/lib/pixel/store";
import { useViewportStore } from "@/lib/pixel/viewport";
import { TOOLS } from "./studio-config";

export function PixelStatus() {
  const hover = usePixelStore((s) => s.hover);
  const size = usePixelStore((s) => s.size);
  const tool = usePixelStore((s) => s.tool);
  const zoom = useViewportStore((s) => s.zoom);
  const toolLabel = TOOLS.find((item) => item.id === tool)?.label ?? tool;

  return (
    <footer className="studio-bottom flex items-center gap-4 border-t border-border bg-surface px-4 py-1.5 font-mono text-xs tabular-nums text-subtle">
      <span>{hover ? `${hover.x},${hover.y}` : "—,—"}</span>
      <span>{size}×{size}</span>
      <span>{Math.round(zoom * 100)}%</span>
      <span className="hidden sm:inline">{toolLabel}</span>
      <span className="ml-auto hidden text-xs tracking-wide md:inline">
        Clique direito captura a cor · Espaço move a tela
      </span>
    </footer>
  );
}
