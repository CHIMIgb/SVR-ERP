'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { dataTableClasses } from './DataTable.styles';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
  nowrap?: boolean;
  /** Recorta el contenido al ancho de la columna con puntos suspensivos (requiere tabla fija interna). */
  truncate?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (item: T) => void;
  maxBodyHeight?: string;
  className?: string;
  /** 'brand' (por defecto): encabezado naranja alternado. 'neutral': encabezado gris claro, alineado como cada columna. */
  headerVariant?: 'brand' | 'neutral';
  /**
   * Líneas de la tabla (review PR #17):
   * - 'bold' (default): filas con línea negra en claro y separadores verticales por celda — la más marcada.
   * - 'subtle': solo línea horizontal fina entre filas, sin verticales — para tablas densas o de baja jerarquía visual.
   */
  lines?: 'bold' | 'subtle';
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = 'No hay registros',
  onRowClick,
  maxBodyHeight = '400px',
  className,
  headerVariant = 'brand',
  lines = 'bold',
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasMore = el.scrollWidth > el.clientWidth;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setShowRightShadow(hasMore && !atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, data]);

  if (loading) {
    return (
      <div className={cn(dataTableClasses.container, className)}>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {columns.map((col) => (
                <div key={col.key} className={cn(dataTableClasses.skeleton, 'h-4 flex-1')} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn(dataTableClasses.container, className)}>
        <div className="p-12 text-center text-sm text-ui-500">{emptyText}</div>
      </div>
    );
  }

  const lineas = dataTableClasses.lines[lines];

  return (
    <div className={cn(dataTableClasses.container, className)}>
      {/* Scroll horizontal + vertical envuelven UNA SOLA tabla */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-auto scrollbar-none"
          style={{ maxHeight: maxBodyHeight }}
        >
          <table
            className="w-full text-sm border-collapse"
            // Con columnas truncate la tabla pasa a layout fijo: el ancho lo
            // dictan los minWidth de las cabeceras y el td corta con ellipsis.
            style={{ tableLayout: columns.some((c) => c.truncate) ? 'fixed' : 'auto' }}
          >
            {/* Header sticky — se queda fijo arriba al hacer scroll vertical */}
            <thead className="sticky top-0 z-20">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col.key}
                    style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                    className={cn(
                      headerVariant === 'neutral'
                        ? [
                            dataTableClasses.thNeutral,
                            col.align === 'right' && dataTableClasses.tdRight,
                            col.align === 'center' && dataTableClasses.tdCenter,
                          ]
                        : [dataTableClasses.th, index % 2 === 0 ? dataTableClasses.thOdd : dataTableClasses.thEven],
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  // Fila clicable: también se abre con teclado (Enter / Espacio).
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(item); } } : undefined}
                  className={cn(
                    lineas.tr,
                    index % 2 === 0 ? dataTableClasses.trEven : dataTableClasses.trOdd,
                    onRowClick && dataTableClasses.trInteractive
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        lineas.td,
                        col.align === 'right' && dataTableClasses.tdRight,
                        col.align === 'center' && dataTableClasses.tdCenter,
                        col.nowrap && 'whitespace-nowrap',
                        col.truncate && dataTableClasses.tdTruncate,
                        col.className
                      )}
                      style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Indicador de scroll: gradiente derecho */}
        {showRightShadow && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface/90 via-surface/60 to-transparent pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
}
