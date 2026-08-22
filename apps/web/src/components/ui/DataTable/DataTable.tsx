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
        <div className="p-12 text-center text-sm text-slate-500">{emptyText}</div>
      </div>
    );
  }

  return (
    <div className={cn(dataTableClasses.container, className)}>
      {/* Scroll horizontal + vertical envuelven UNA SOLA tabla */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-auto scrollbar-none"
          style={{ maxHeight: maxBodyHeight }}
        >
          <table className="w-full text-sm border-collapse" style={{ tableLayout: 'auto' }}>
            {/* Header sticky — se queda fijo arriba al hacer scroll vertical */}
            <thead className="sticky top-0 z-20">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col.key}
                    className={cn(
                      dataTableClasses.th,
                      index % 2 === 0 ? dataTableClasses.thOdd : dataTableClasses.thEven,
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
                  className={cn(
                    dataTableClasses.tr,
                    index % 2 === 0 ? dataTableClasses.trEven : dataTableClasses.trOdd,
                    onRowClick && dataTableClasses.trInteractive
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        dataTableClasses.td,
                        col.align === 'right' && dataTableClasses.tdRight,
                        col.align === 'center' && dataTableClasses.tdCenter,
                        col.nowrap && 'whitespace-nowrap',
                        col.className
                      )}
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
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 via-white/60 to-transparent pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
}
