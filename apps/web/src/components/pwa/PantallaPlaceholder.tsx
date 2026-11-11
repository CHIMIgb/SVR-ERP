"use client";

/**
 * Placeholder de pantalla de la BASE (plan §8.5): solo título + subtítulo.
 * Único componente nuevo de la base — documentado en COMPONENTS.md.
 */
interface PantallaPlaceholderProps {
  titulo: string;
  subtitulo?: string;
  icono?: React.ReactNode;
}

export default function PantallaPlaceholder({ titulo, subtitulo, icono }: PantallaPlaceholderProps) {
  return (
    <section className="flex flex-col items-center justify-center text-center py-16 gap-4">
      {icono && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icono}
        </div>
      )}
      <h1 className="text-2xl font-black text-white">{titulo}</h1>
      {subtitulo && <p className="text-sm text-slate-400 max-w-xs">{subtitulo}</p>}
    </section>
  );
}
