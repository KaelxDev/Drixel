import {
  Download,
  FolderOpen,
  HelpCircle,
  Maximize2,
  Redo2,
  Save,
  Trash2,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRef, type ChangeEvent } from "react";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadBlob, exportPng } from "@/lib/pixel/draw";
import { EXPORT_SCALES, type ExportScale } from "@/lib/pixel/palettes";
import { usePixelStore } from "@/lib/pixel/store";
import { useViewportStore } from "@/lib/pixel/viewport";
import { cn } from "@/lib/utils";
import { loadImageFile, loadProjectFile, saveCurrentProject } from "./project-actions";
import { ToolButton } from "./tool-button";

function LogoMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-7" aria-hidden="true" fill="none">
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

function ClearButton() {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Limpar tela">
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
            <Button type="button" variant="ghost" size="icon" aria-label="Atalhos" className="hidden sm:inline-flex">
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
            Desenhe com o ponteiro, use o scroll para aproximar e segure Espaço para mover a tela.
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

export function PixelHeader() {
  const size = usePixelStore((s) => s.size);
  const history = usePixelStore((s) => s.history);
  const future = usePixelStore((s) => s.future);
  const zoom = useViewportStore((s) => s.zoom);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const exportAt = async (scale: ExportScale) => {
    const state = usePixelStore.getState();
    try {
      const blob = await exportPng(state.pixels, state.size, scale);
      downloadBlob(blob, `drixel-${state.size}x${state.size}-${scale}x.png`);
      toast.success(`PNG exportado · ${state.size * scale}×${state.size * scale}`);
    } catch {
      toast.error("Não foi possível exportar o PNG.");
    }
  };

  const onProjectChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await loadProjectFile(file);
  };

  const onImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await loadImageFile(file);
  };

  return (
    <header className="studio-top flex items-center gap-3 border-b border-border bg-surface px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark />
        <div className="min-w-0">
          <p className="font-display text-lg leading-none tracking-tight text-fg">Drixel</p>
          <p className="hidden text-xs text-muted sm:block">Estúdio de pixel art</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <ToolButton label="Desfazer" shortcut="Ctrl/Cmd+Z" disabled={!history.length} onClick={() => usePixelStore.getState().undo()}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Refazer" shortcut="Ctrl/Cmd+Shift+Z" disabled={!future.length} onClick={() => usePixelStore.getState().redo()}>
          <Redo2 />
        </ToolButton>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <ClearButton />

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
            <DropdownMenuItem onSelect={saveCurrentProject}>
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

        <input ref={projectInputRef} type="file" accept=".drixe,application/json" className="hidden" onChange={onProjectChange} />
        <input ref={imageInputRef} type="file" accept="image/png" className="hidden" onChange={onImageChange} />

        <div className="hidden items-center gap-0.5 sm:flex">
          <ToolButton label="Diminuir zoom" onClick={() => useViewportStore.getState().zoomOut()}>
            <ZoomOut />
          </ToolButton>
          <button
            type="button"
            className={cn("min-w-14 rounded-md px-2 text-center font-mono text-xs tabular-nums text-fg hover:bg-elevated")}
            onClick={() => useViewportStore.getState().resetView()}
            aria-label="Redefinir zoom e posição"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton label="Aumentar zoom" onClick={() => useViewportStore.getState().zoomIn()}>
            <ZoomIn />
          </ToolButton>
          <ToolButton label="Centralizar tela" onClick={() => useViewportStore.getState().resetView()}>
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
              <DropdownMenuItem key={scale} onSelect={() => void exportAt(scale)}>
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
