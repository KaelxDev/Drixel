import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PixelCanvas } from "./pixel-canvas";
import { PixelHeader } from "./pixel-header";
import { PixelPalette } from "./pixel-palette";
import { PixelStatus } from "./pixel-status";
import { PixelTools } from "./pixel-tools";
import { usePixelStore } from "@/lib/pixel/store";
import { usePixelHotkeys } from "./use-pixel-hotkeys";

export function PixelStudio() {
  usePixelHotkeys();

  useEffect(() => {
    usePixelStore.getState().hydrate();
  }, []);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="studio">
        <PixelHeader />
        <PixelTools />
        <PixelCanvas />
        <PixelPalette />
        <PixelStatus />
      </div>
    </TooltipProvider>
  );
}
