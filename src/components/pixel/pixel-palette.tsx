import { PALETTES, paletteById } from "@/lib/pixel/palettes";
import { usePixelStore } from "@/lib/pixel/store";
import { cn } from "@/lib/utils";

export function PixelPalette() {
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
        {PALETTES.map((paletteOption) => (
          <button
            key={paletteOption.id}
            type="button"
            onClick={() => usePixelStore.getState().setPalette(paletteOption.id)}
            className={cn(
              "shrink-0 rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-[var(--motion-quick)]",
              paletteOption.id === paletteId
                ? "bg-elevated text-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {paletteOption.name}
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
