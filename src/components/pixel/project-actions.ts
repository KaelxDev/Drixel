import { toast } from "sonner";
import { importPng } from "@/lib/pixel/import";
import {
  createProject,
  downloadProject,
  parseProject,
} from "@/lib/pixel/project";
import { usePixelStore } from "@/lib/pixel/store";
import { useViewportStore } from "@/lib/pixel/viewport";

export function saveCurrentProject() {
  const state = usePixelStore.getState();
  try {
    downloadProject(createProject(state));
    toast.success("Projeto .drixe salvo");
  } catch {
    toast.error("Não foi possível salvar o projeto.");
  }
}

export async function loadProjectFile(file: File) {
  try {
    const project = parseProject(await file.text());
    usePixelStore.getState().loadProject(project);
    useViewportStore.getState().resetView();
    toast.success(`Projeto carregado · ${project.size}×${project.size}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Projeto inválido.");
  }
}

export async function loadImageFile(file: File) {
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
      error instanceof Error
        ? error.message
        : "Não foi possível importar o PNG.",
    );
  }
}
