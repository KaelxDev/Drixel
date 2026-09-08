import {
  Download,
  Eraser,
  FolderOpen,
  Grid3x3,
  HelpCircle,
  Maximize2,
  Minus,
  PaintBucket,
  Pencil,
  Pipette,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadBlob, exportPng } from "@/lib/pixel/draw";
import { importPng } from "@/lib/pixel/import";
import {
  BRUSH_SIZES,
  EXPORT_SCALES,
  GRID_SIZES,
  PALETTES,
  paletteById,
  type BrushSize,
  type ExportScale,
  type GridSize,
} from "@/lib/pixel/palettes";
import {
  createProject,
  downloadProject,
  parseProject,
} from "@/lib/pixel/project";
import { usePixelStore, type Tool } from "@/lib/pixel/store";
import { useViewportStore } from "@/lib/pixel/viewport";
import { cn } from "@/lib/utils";
import { PixelCanvas } from "./pixel-canvas";

const TOOLS: Array<{
  id: Tool;
  label: string;
  shortcut: string;
  icon: typeof Pencil;
}> = [
  { id: "pencil", label: "Lápis", shortcut: "B", icon: Pencil },
  { id: "eraser", label: "Borracha", shortcut: "E", icon: Eraser },
  { id: "fill", label: "Preencher", shortcut: "G", icon: PaintBucket },
  { id: "eyedropper", label: "Conta-gotas", shortcut: "I", icon: Pipette },
];

const BRUSH_CLASS: Record<BrushSize, string> = {
  1: "size-1",
  2: "size-1.5",
  3: "size-2.5",
  4: "size-3.5",
};

function LogoMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-7"
      aria-hidden="true"
      fill="none"
    >
      <rect x="1" y="1" width="4" height="4" className="fill-fg" />
      <rect x="6" y="1" width="4" height="4" className="fill-accent" />
      <rect x="11" y="1" width="4" height="4" className="fill-fg/40" />
      <rect x="1" y="6" width="4" height="4" className="fill-fg/40" />
      <rect x="6" y="6" width="4" height="4" className="fill-fg" />
      <rect x="11" y="6" width="4" height="4" className="fill-accent/70" />
      <rect x="1" y="11" width="4" height="4" className="fill-accent" />
      <rect x="6" y="11" width="4" height="4" className="fill-fg/40" />
      <rect x="11" y="11" width="4" height="4" className="fill-fg" />
    </svg>
  );
}

function ToolButton({
  active,
  label,
  shortcut,
  disabled,
  children,
  onClick,
}: {
  active?: boolean;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={shortcut ? `${label} (${shortcut})` : label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "rounded-md",
            active &&
              "bg-accent text-accent-fg hover:bg-accent hover:text-accent-fg",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut ? <span className="ml-2 text-subtle">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

async function saveCurrentProject() {
  const state = usePixelStore.getState();
  try {
    downloadProject(createProject(state));
    toast.success("Projeto .drixe salvo");
  } catch {
    toast.error("Não foi possível salvar o projeto.");
  }
}

async function loadProjectFile(file: File) {
  try {
    const project = parseProject(await file.text());
    usePixelStore.getState().loadProject(project);
    useViewportStore.getState().resetView();
    toast.success(`Projeto carregado · ${project.size}×${project.size}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Projeto inválido.");
  }
}

async function loadImageFile(file: File) {
  const currentSize = usePixelStore.getState().size;
  try {
    const imported = await importPng(file, currentSize);
    usePixelStore.getState().replaceCanvas(imported.size, imported.pixels);
    useViewportStore.getState().resetView();
    const resized =
      imported.sourceWidth !== imported.size ||
      imported.sourceHeight !== imported.size;
    toast.success(
      resized
        ? `PNG importado e ajustado para ${imported.size}×${imported.size}`
        : `PNG importado · ${imported.size}×${imported.size}`,
    );
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Não foi possível importar o PNG.",
    );
  }
}

function Header() {
  const size = usePixelStore((s) => s.size);
  const history = usePixelStore((s) => s.history);
  const future = usePixelStore((s) => s.future);
  const zoom = useViewportStore((s) => s.zoom);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const exportAt = async (scale: ExportScale) => {
    const state = usePixelStore.getState();
    try {
      const blob = await exportPng(state.pixels, state.size, scale);
      downloadBlob(blob, `drixel-${state.size}x${state.size}-${scale}x.png`);
      toast.success(
        `PNG exportado · ${state.size * scale}×${state.size * scale}`,
      );
    } catch {
      toast.error("Não foi possível exportar o PNG.");
    }
  };

  const onProjectChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await loadProjectFile(file);
  };

  const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await loadImageFile(file);
  };

  return (
    <header className="studio-top flex items-center gap-3 border-b border-border bg-surface px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark />
        <div className="min-w-0">
          <p className="font-display text-lg leading-none tracking-tight text-fg">
            Drixel
          </p>
          <p className="hidden text-xs text-muted sm:block">
            Estúdio de pixel art
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <ToolButton
          label="Desfazer"
          shortcut="Ctrl/Cmd+Z"
          disabled={!canUndo}
          onClick={() => usePixelStore.getState().undo()}
        >
          <Undo2 />
        </ToolButton>
        <ToolButton
          label="Refazer"
          shortcut="Ctrl/Cmd+Shift+Z"
          disabled={!canRedo}
          onClick={() => usePixelStore.getState().redo()}
        >
          <Redo2 />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Projeto">
                  <FolderOpen />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Projeto</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuLabel>Projeto</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => projectInputRef.current?.click()}>
              <FolderOpen />
              Abrir .drixe
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void saveCurrentProject()}>
              <Save />
              Salvar .drixe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => imageInputRef.current?.click()}>
              <Upload />
              Importar PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={projectInputRef}
          type="file"
          accept=".drixe,application/json"
          className="hidden"
          onChange={onProjectChange}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/*"
          className="hidden"
          onChange={onImageChange}
        />

        <div className="hidden items-center gap-0.5 sm:flex">
          <ToolButton
            label="Diminuir zoom"
            onClick={() => useViewportStore.getState().zoomOut()}
          >
            <ZoomOut />
          </ToolButton>
          <button
            type="button"
            className="min-w-14 rounded-md px-2 text-center font-mono text-xs tabular-nums text-fg hover:bg-elevated"
            onClick={() => useViewportStore.getState().resetView()}
            aria-label="Redefinir zoom e posição"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton
            label="Aumentar zoom"
            onClick={() => useViewportStore.getState().zoomIn()}
          >
            <ZoomIn />
          </ToolButton>
          <ToolButton
            label="Centralizar tela"
            onClick={() => useViewportStore.getState().resetView()}
          >
            <Maximize2 />
          </ToolButton>
        </div>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" className="gap-1.5 px-3">
                  <Download className="size-4" />
                  <span className="hidden sm:inline">PNG</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Exportar PNG</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Escala de exportação</DropdownMenuLabel>
            {EXPORT_SCALES.map((scale) => (
              <DropdownMenuItem
                key={scale}
                onSelect={() => void exportAt(scale)}
              >
                {scale}× · {size * scale}px
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ShortcutsDialog />
      </div>
    </header>
  );
}

function ClearButton() {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Limpar tela"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Limpar tela</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar a tela?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os pixels serão apagados. Você pode desfazer em seguida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => usePixelStore.getState().clear()}>
            Limpar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ShortcutsDialog() {
  const rows = [
    ["B", "Lápis"],
    ["E", "Borracha"],
    ["G", "Preencher"],
    ["I", "Conta-gotas"],
    ["[  ]", "Espessura"],
    ["H", "Mostrar grade"],
    ["−  +", "Tamanho da grade"],
    ["Ctrl/Cmd+S", "Salvar projeto .drixe"],
    ["Ctrl/Cmd+Z", "Desfazer"],
    ["Ctrl/Cmd+Shift+Z", "Refazer"],
    ["Scroll", "Zoom"],
    ["Espaço + arrastar", "Mover tela"],
    ["Clique direito", "Capturar cor"],
  ];
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Atalhos"
              className="hidden sm:inline-flex"
            >
              <HelpCircle />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Atalhos</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atalhos</DialogTitle>
          <DialogDescription>
            Desenhe com o ponteiro, use o scroll para aproximar e segure Espaço
            para mover a tela.
          </DialogDescription>
        </DialogHeader>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([key, label]) => (
            <div key={label} className="contents">
              <dt>
                <kbd className="rounded-sm bg-elevated px-1.5 py-0.5 font-mono text-xs text-fg shadow-[var(--shadow-border)]">
                  {key}
                </kbd>
              </dt>
              <dd className="text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function ToolsRail() {
  const tool = usePixelStore((s) => s.tool);
  const brush = usePixelStore((s) => s.brush);
  const showGrid = usePixelStore((s) => s.showGrid);
  const size = usePixelStore((s) => s.size);

  const stepSize = (dir: -1 | 1) => {
    const idx = GRID_SIZES.indexOf(size);
    const next = GRID_SIZES[idx + dir];
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

function PaletteRail() {
  const paletteId = usePixelStore((s) => s.paletteId);
  const color = usePixelStore((s) => s.color);
  const palette = paletteById(paletteId);

  return (
    <aside className="studio-palette flex flex-col gap-3 border-t border-border bg-surface p-3 lg:w-56 lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">
          Paleta
        </p>
        <div
          className={cn(
            "size-6 rounded-sm shadow-[var(--shadow-border)]",
            !color && "swatch-empty",
          )}
          style={color ? { backgroundColor: color } : undefined}
          aria-label={color ? `Cor atual ${color}` : "Transparente"}
        />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-wrap">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => usePixelStore.getState().setPalette(p.id)}
            className={cn(
              "shrink-0 rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-[var(--motion-quick)]",
              p.id === paletteId
                ? "bg-elevated text-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-1 lg:grid-cols-4 lg:gap-1.5">
        <button
          type="button"
          aria-label="Transparente"
          aria-pressed={color === null}
          onClick={() => usePixelStore.getState().setColor(null)}
          className={cn(
            "swatch-empty aspect-square rounded-sm shadow-[var(--shadow-border)]",
            color === null &&
              "ring-2 ring-ring ring-offset-2 ring-offset-surface",
          )}
        />
        {palette.colors.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            aria-pressed={color === hex}
            onClick={() => usePixelStore.getState().setColor(hex)}
            className={cn(
              "aspect-square rounded-sm",
              color === hex &&
                "ring-2 ring-ring ring-offset-2 ring-offset-surface",
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </aside>
  );
}

function StatusBar() {
  const hover = usePixelStore((s) => s.hover);
  const size = usePixelStore((s) => s.size);
  const tool = usePixelStore((s) => s.tool);
  const zoom = useViewportStore((s) => s.zoom);
  const toolLabel = TOOLS.find((t) => t.id === tool)?.label ?? tool;

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

function useHotkeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) usePixelStore.getState().redo();
        else usePixelStore.getState().undo();
        return;
      }
      if (meta && key === "y") {
        event.preventDefault();
        usePixelStore.getState().redo();
        return;
      }
      if (meta && key === "s") {
        event.preventDefault();
        void saveCurrentProject();
        return;
      }

      if (key === "0") {
        event.preventDefault();
        useViewportStore.getState().resetView();
        return;
      }
      if (key === "b" || key === "p") usePixelStore.getState().setTool("pencil");
      else if (key === "e") usePixelStore.getState().setTool("eraser");
      else if (key === "g" || key === "f")
        usePixelStore.getState().setTool("fill");
      else if (key === "i") usePixelStore.getState().setTool("eyedropper");
      else if (key === "h") {
        event.preventDefault();
        usePixelStore.getState().toggleGrid();
      } else if (key === "[" || key === "]") {
        const brush = usePixelStore.getState().brush;
        const idx = BRUSH_SIZES.indexOf(brush);
        const next = BRUSH_SIZES[idx + (key === "]" ? 1 : -1)];
        if (next) usePixelStore.getState().setBrush(next);
      } else if (key === "-" || key === "=" || key === "+") {
        const size = usePixelStore.getState().size;
        const idx = GRID_SIZES.indexOf(size);
        const next = GRID_SIZES[idx + (key === "-" ? -1 : 1)] as
          | GridSize
          | undefined;
        if (next) usePixelStore.getState().setSize(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function PixelStudio() {
  useHotkeys();

  useEffect(() => {
    usePixelStore.getState().hydrate();
  }, []);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="studio">
        <Header />
        <ToolsRail />
        <PixelCanvas />
        <PaletteRail />
        <StatusBar />
      </div>
    </TooltipProvider>
  );
}
