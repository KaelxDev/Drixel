import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { PixelStudio } from "@/components/pixel/studio";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <PixelStudio />
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          className:
            "!bg-elevated !text-fg !border-0 !shadow-[var(--shadow-border)] !font-sans",
        }}
      />
    </>
  );
}
