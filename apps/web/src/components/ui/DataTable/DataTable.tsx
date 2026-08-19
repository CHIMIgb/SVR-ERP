'use client';

import { cn } from '@/lib/utils';
import { dataTableClasses } from './DataTable.styles';

export type HeaderColor = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'primary';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  nowrap?: boolean;
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
      {/* Scroll horizontal SOLO dentro de este componente */}
      <div className="overflow-x-auto max-w-full">
        {/* Header table */}
        <table className="w-full text-sm border-collapse">
          <thead className={dataTableClasses.thead}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    dataTableClasses.th,
                    col.align === 'right' && dataTableClasses.thRight,
                    col.align === 'center' && dataTableClasses.thCenter,
                    col.headerColor && headerColorMap[col.headerColor],
                    col.className
                  )}
                  style={{ minWidth: col.minWidth ?? col.width ?? '120px' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Body scroll vertical */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: maxBodyHeight }}
        >
          <table className="w-full text-sm border-collapse">
            <colgroup>
              {columns.map((col) => (
                <col
                  key={col.key}
                  style={{ width: col.width ?? col.minWidth ?? '120px' }}
                />
              ))}
            </colgroup>
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
                      style={{ minWidth: col.minWidth ?? col.width ?? '120px' }}
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
      </div>
    </div>
  );
}

const headerColorMap: Record<HeaderColor, string> = {
  default: dataTableClasses.thDefault,
  blue: dataTableClasses.thBlue,
  green: dataTableClasses.thGreen,
  amber: dataTableClasses.thAmber,
  red: dataTableClasses.thRed,
  purple: dataTableClasses.thPurple,
  slate: dataTableClasses.thSlate,
  primary: dataTableClasses.thPrimary,
};
