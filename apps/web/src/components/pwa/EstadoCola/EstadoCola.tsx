'use client';

/**
 * Resumen de la cola offline dentro de la pantalla de captura. Los estados
 * `pendiente` y `error` se reintentan solos; CONFLICTO (409) y RECHAZADO
 * (4xx ≠ 409, bloqueante 5 PR #23) esperan la decisión humana con
 * Descartar/Reintentar — nunca se reenvían solos. Se oculta con la cola
 * vacía. Cambios de la cola: evento online, cada 30 s y el prop
 * `refreshKey` que el padre incrementa tras encolar.
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  descartar,
  pendientes,
  reencolar,
  usuarioSesionId,
  type ElementoCola,
} from '@/lib/pwa/offline';
import { estadoColaClasses } from './EstadoCola.styles';

const ETIQUETAS: Record<
  ElementoCola['estado'],
  { texto: string; variante: 'warning' | 'info' | 'error' }
> = {
  pendiente: { texto: 'Pendiente', variante: 'warning' },
  error: { texto: 'Error de red', variante: 'info' },
  conflicto: { texto: 'Conflicto', variante: 'error' },
  rechazado: { texto: 'Rechazado', variante: 'error' },
};

export interface EstadoColaProps {
  /** El padre lo incrementa para pedir un refresco inmediato (tras encolar). */
  refreshKey?: number;
}

export function EstadoCola({ refreshKey = 0 }: EstadoColaProps) {
  const [items, setItems] = useState<ElementoCola[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);

  const refrescar = useCallback(() => {
    // Solo lo del usuario de la sesión (tercera revisión): la cola de otro
    // usuario queda dormida — no se muestra ni se envía con su token.
    const usuario = usuarioSesionId();
    pendientes()
      .then((todos) => setItems(todos.filter((i) => i.usuarioId === usuario)))
      .catch(() => undefined);
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
  // conflicto y rechazado esperan decisión humana: no están "enviando ahora"
  const enviandoAhora = items.some((i) => i.estado !== 'conflicto' && i.estado !== 'rechazado');
  /** Conflicto (409) y Rechazado (4xx ≠ 409): Descartar/Reintentar manuales. */
  const esperaDecision = (item: ElementoCola) =>
    item.estado === 'conflicto' || item.estado === 'rechazado';

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
          const faltanFotos =
            item.estado !== 'conflicto' &&
            item.estado !== 'rechazado' &&
            (item.adjuntosPendientes?.length ?? 0) > 0;
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
              {esperaDecision(item) && (
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
