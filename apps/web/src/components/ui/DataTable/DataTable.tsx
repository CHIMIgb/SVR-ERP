'use client';

import { cn } from '@/lib/utils';
import { dataTableClasses } from './DataTable.styles';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  /** Si es true, la celda se alinea a la derecha (para acciones) */
  align?: 'left' | 'center' | 'right';
  /** Ancho fijo de la columna (ej: '120px', '8rem') */
  width?: string;
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
  /** Texto fijo para la columna de acciones en el header */
  actionHeader?: string;
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
        className={dataTableClasses.scrollWrapper}
        style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
      >
        <table className={dataTableClasses.table}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
          <thead className={dataTableClasses.headerGroup}>
            <tr className={dataTableClasses.headerRow}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.align === 'right'
                      ? dataTableClasses.headerCellAction
                      : dataTableClasses.headerCell,
                    col.className
                  )}
                  style={col.width ? { minWidth: col.width } : undefined}
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
                      col.align === 'right'
                        ? dataTableClasses.cellAction
                        : dataTableClasses.cell,
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
