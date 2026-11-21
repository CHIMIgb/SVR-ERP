'use client';

/**
 * Resumen de la cola offline dentro de la pantalla de captura. Los estados
 * `pendiente` y `error` se reintentan solos; el CONFLICTO (409) espera la
 * decisión humana con Descartar/Reintentar — nunca se reenvía solo. Se
 * oculta con la cola vacía. Cambios de la cola: evento online, cada 30 s y
 * el prop `refreshKey` que el padre incrementa tras encolar.
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  descartar,
  pendientes,
  reencolar,
  type ElementoCola,
} from '@/lib/pwa/offline';
import { estadoColaClasses } from './EstadoCola.styles';

const ETIQUETAS: Record<ElementoCola['estado'], { texto: string; variante: 'warning' | 'info' | 'error' }> = {
  pendiente: { texto: 'Pendiente', variante: 'warning' },
  error: { texto: 'Error de red', variante: 'info' },
  conflicto: { texto: 'Conflicto', variante: 'error' },
};

export interface EstadoColaProps {
  /** El padre lo incrementa para pedir un refresco inmediato (tras encolar). */
  refreshKey?: number;
}

export function EstadoCola({ refreshKey = 0 }: EstadoColaProps) {
  const [items, setItems] = useState<ElementoCola[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);

  const refrescar = useCallback(() => {
    pendientes().then(setItems).catch(() => undefined);
  }, []);

  useEffect(() => {
    refrescar();
    window.addEventListener('online', refrescar);
    const id = window.setInterval(refrescar, 30_000);
    return () => {
      window.removeEventListener('online', refrescar);
      window.clearInterval(id);
    };
  }, [refrescar, refreshKey]);

  const alDescartar = async (id: string) => {
    setProcesando(id);
    try {
      await descartar(id);
    } finally {
      setProcesando(null);
      refrescar();
    }
  };

  const alReintentar = async (id: string) => {
    setProcesando(id);
    try {
      await reencolar(id);
    } finally {
      setProcesando(null);
      refrescar();
    }
  };

  if (items.length === 0) return null;

  const c = estadoColaClasses;
  const enviandoAhora = items.some((i) => i.estado !== 'conflicto');

  return (
    <section className={c.root} aria-live="polite">
      <header className={c.header}>
        <span className={c.titulo}>{items.length} pendiente(s) por enviar</span>
        {enviandoAhora && <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden />}
      </header>
      <div className={c.lista}>
        {items.map((item) => {
          // Conflicto manda; si el reporte ya se registró y solo faltan fotos
          // por subir, la etiqueta lo dice (no es un "Error de red" genérico).
          const faltanFotos = item.estado !== 'conflicto' && (item.adjuntosPendientes?.length ?? 0) > 0;
          const etiqueta = faltanFotos
            ? { texto: `Falta(n) ${item.adjuntosPendientes!.length} foto(s)`, variante: 'warning' as const }
            : ETIQUETAS[item.estado];
          return (
            <div key={item.id} className={c.fila}>
              <div className={c.filaTexto}>
                <p className={c.filaDesc}>{String(item.payload?.descripcion ?? item.endpoint)}</p>
                <p className={c.filaEstado}>
                  <Badge variant={etiqueta.variante} size="sm">
                    {etiqueta.texto}
                  </Badge>
                  {item.intentos > 0 && <span>· {item.intentos} intento(s)</span>}
                </p>
              </div>
              {item.estado === 'conflicto' && (
                <div className={c.filaAcciones}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={c.boton}
                    onClick={() => void alDescartar(item.id)}
                    loading={procesando === item.id}
                  >
                    Descartar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className={c.boton}
                    onClick={() => void alReintentar(item.id)}
                    loading={procesando === item.id}
                  >
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
