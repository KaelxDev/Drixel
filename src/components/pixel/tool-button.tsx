import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolButton({
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
  children: ReactNode;
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
