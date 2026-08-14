interface Props {
  label?: string;
  /** "sm" = versión chica en línea (ej. dentro de una burbuja de chat). Default = panel completo. */
  size?: "default" | "sm";
}

/** Animación de un libro abriéndose y pasando página, para estados de carga (búsqueda, análisis IA, chat). */
export function BookLoader({ label, size = "default" }: Props) {
  const isSmall = size === "sm";

  return (
    <div
      className={
        isSmall
          ? "flex items-center gap-2"
          : "flex flex-col items-center justify-center gap-4 py-8"
      }
      role="status"
      aria-live="polite"
    >
      <div className={isSmall ? "relative h-6 w-9 shrink-0" : "relative h-14 w-20"} style={{ perspective: "400px" }}>
        {/* Tapa/lomo */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 rounded-b-sm bg-amber-900/80" />
        <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-amber-900/70" />

        {/* Página izquierda, fija */}
        <div className="absolute left-0 top-0 h-full w-1/2 rounded-l-md border border-amber-900/40 bg-parchment shadow-[inset_-4px_0_6px_-4px_rgba(124,45,18,0.25)]" />
        {/* Sombra de la página que pasa, proyectada sobre la izquierda */}
        <div className="book-loader-shadow absolute left-0 top-0 h-full w-1/2 rounded-l-md bg-gradient-to-r from-transparent to-amber-950/40 opacity-0" />

        {/* Página derecha, fija (base debajo de la que pasa) */}
        <div className="absolute right-0 top-0 h-full w-1/2 rounded-r-md border border-amber-900/40 bg-parchment shadow-[inset_4px_0_6px_-4px_rgba(124,45,18,0.25)]" />

        {/* Página que pasa: dos caras (frente/reverso) para que no "desaparezca" al girar más de 90°. */}
        <div
          className="book-loader-page absolute right-0 top-0 h-full w-1/2"
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-r-md border border-amber-900/50 bg-parchment"
            style={{ backfaceVisibility: "hidden" }}
          />
          <div
            className="absolute inset-0 rounded-l-md border border-amber-900/50 bg-amber-50"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          />
        </div>
      </div>
      {label && <p className={isSmall ? "text-xs italic text-ink/50" : "text-sm text-ink/60"}>{label}</p>}
    </div>
  );
}
