import {
  Eraser,
  PaintBucket,
  Pencil,
  Pipette,
  type LucideIcon,
} from "lucide-react";
import type { BrushSize } from "@/lib/pixel/palettes";
import type { Tool } from "@/lib/pixel/store";

export const TOOLS: Array<{
  id: Tool;
  label: string;
  shortcut: string;
  icon: LucideIcon;
}> = [
  { id: "pencil", label: "Lápis", shortcut: "B", icon: Pencil },
  { id: "eraser", label: "Borracha", shortcut: "E", icon: Eraser },
  { id: "fill", label: "Preencher", shortcut: "G", icon: PaintBucket },
  { id: "eyedropper", label: "Conta-gotas", shortcut: "I", icon: Pipette },
];

export const BRUSH_CLASS: Record<BrushSize, string> = {
  1: "size-1",
  2: "size-1.5",
  3: "size-2.5",
  4: "size-3.5",
};
