'use client';

import { cn } from '@/lib/utils';
import { dataTableClasses } from './DataTable.styles';

export type HeaderColor = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'primary';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  /** Alineacion de la celda */
  align?: 'left' | 'center' | 'right';
  /** Ancho minimo de la columna (ej: '120px', '8rem') */
  minWidth?: string;
  /** Ancho fijo de la columna */
  width?: string;
  /** No permitir wrap del contenido */
  nowrap?: boolean;
  /** Color del header de esta columna */
  headerColor?: HeaderColor;
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
  /** Permitir scroll horizontal */
  scrollX?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyText = 'No hay registros',
  onRowClick,
  maxBodyHeight,
  className,
  scrollX = true,
}: DataTableProps<T>) {
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
      <div
        className={cn(scrollX && 'overflow-x-auto')}
        style={maxBodyHeight ? { maxHeight: maxBodyHeight, overflowY: 'auto' } : undefined}
      >
        <table className={cn(dataTableClasses.table, 'table-fixed')} style={{ minWidth: '100%' }}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{ width: col.width ?? col.minWidth ?? 'auto' }}
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    dataTableClasses.headerCell,
                    col.align === 'right' && dataTableClasses.headerCellRight,
                    col.align === 'center' && dataTableClasses.headerCellCenter,
                    col.headerColor && headerColorMap[col.headerColor],
                    col.className
                  )}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
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
                  dataTableClasses.row,
                  index % 2 === 0 ? dataTableClasses.rowEven : dataTableClasses.rowOdd,
                  onRowClick && dataTableClasses.rowInteractive
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      dataTableClasses.cell,
                      col.align === 'right' && dataTableClasses.cellRight,
                      col.align === 'center' && dataTableClasses.cellCenter,
                      col.nowrap && 'whitespace-nowrap',
                      col.className
                    )}
                  >
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Header color map ── */

const headerColorMap: Record<HeaderColor, string> = {
  default: dataTableClasses.headerDefault,
  blue: dataTableClasses.headerBlue,
  green: dataTableClasses.headerGreen,
  amber: dataTableClasses.headerAmber,
  red: dataTableClasses.headerRed,
  purple: dataTableClasses.headerPurple,
  slate: dataTableClasses.headerSlate,
  primary: dataTableClasses.headerPrimary,
};
