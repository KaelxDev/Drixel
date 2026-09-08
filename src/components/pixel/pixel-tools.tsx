import { Grid3x3, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BRUSH_SIZES, GRID_SIZES } from "@/lib/pixel/palettes";
import { usePixelStore } from "@/lib/pixel/store";
import { cn } from "@/lib/utils";
import { BRUSH_CLASS, TOOLS } from "./studio-config";
import { ToolButton } from "./tool-button";

export function PixelTools() {
  const tool = usePixelStore((s) => s.tool);
  const brush = usePixelStore((s) => s.brush);
  const showGrid = usePixelStore((s) => s.showGrid);
  const size = usePixelStore((s) => s.size);

  const stepSize = (dir: -1 | 1) => {
    const index = GRID_SIZES.indexOf(size);
    const next = GRID_SIZES[index + dir];
    if (next) usePixelStore.getState().setSize(next);
  };

  return (
    <aside className="studio-tools flex flex-row items-center gap-1 overflow-x-auto border-t border-border bg-surface p-2 lg:flex-col lg:overflow-visible lg:border-t-0 lg:border-r lg:px-2 lg:py-3">
      {TOOLS.map(({ id, label, shortcut, icon: Icon }) => (
        <ToolButton
          key={id}
          active={tool === id}
          label={label}
          shortcut={shortcut}
          onClick={() => usePixelStore.getState().setTool(id)}
        >
          <Icon />
        </ToolButton>
      ))}

      <Separator className="mx-1 hidden lg:block" />
      <Separator orientation="vertical" className="mx-1 h-8 lg:hidden" />

      <ToolButton
        active={showGrid}
        label="Grade"
        shortcut="H"
        onClick={() => usePixelStore.getState().toggleGrid()}
      >
        <Grid3x3 />
      </ToolButton>

      <div className="flex items-center gap-1 lg:mt-2 lg:flex-col">
        <span className="hidden px-1 text-xs font-medium tracking-wide text-subtle uppercase lg:block">
          Pincel
        </span>
        <div className="flex gap-0.5 lg:flex-col">
          {BRUSH_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Espessura ${n}`}
              aria-pressed={brush === n}
              onClick={() => usePixelStore.getState().setBrush(n)}
              className={cn(
                "relative grid size-11 place-items-center rounded-md text-muted transition-colors duration-[var(--motion-quick)] hover:text-fg",
                brush === n && "bg-elevated text-fg",
              )}
            >
              <span className={cn("bg-current", BRUSH_CLASS[n])} />
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 lg:mt-auto lg:ml-0 lg:flex-col">
        <span className="hidden px-1 text-xs font-medium tracking-wide text-subtle uppercase lg:block">
          Grade
        </span>
        <div className="flex items-center gap-0.5 lg:flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Diminuir grade"
            disabled={size === GRID_SIZES[0]}
            onClick={() => stepSize(-1)}
          >
            <Minus />
          </Button>
          <span className="min-w-12 text-center font-mono text-xs tabular-nums text-fg">
            {size}×{size}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Aumentar grade"
            disabled={size === GRID_SIZES[GRID_SIZES.length - 1]}
            onClick={() => stepSize(1)}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </aside>
  );
}
