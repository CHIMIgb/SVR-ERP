import { cn } from '@/lib/utils';
import { gridClasses, type GridColumns, type GridGap, type ResponsiveColumns } from './Grid.styles';

export interface GridProps {
  children: React.ReactNode;
  columns?: GridColumns | ResponsiveColumns;
  gap?: GridGap;
  rowGap?: GridGap;
  columnGap?: GridGap;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol';
}

function columnsToClass(columns: GridColumns | ResponsiveColumns | undefined): string {
  if (columns === undefined) return '';

  if (typeof columns === 'object') {
    const classes: string[] = [];
    const map: Record<string, string> = {
      sm: 'sm:grid-cols-',
      md: 'md:grid-cols-',
      lg: 'lg:grid-cols-',
      xl: 'xl:grid-cols-',
    };

    (Object.keys(columns) as Array<keyof ResponsiveColumns>).forEach((breakpoint) => {
      const value = columns[breakpoint];
      if (value !== undefined) {
        classes.push(`${map[breakpoint]}${value}`);
      }
    });

    return classes.join(' ');
  }

  return `grid-cols-${columns}`;
}

const alignItemsMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyItemsMap = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};

export function Grid({
  children,
  columns = 1,
  gap = 'md',
  rowGap,
  columnGap,
  alignItems,
  justifyItems,
  className,
  as: Component = 'div',
}: GridProps) {
  return (
    <Component
      className={cn(
        gridClasses.base,
        columnsToClass(columns),
        rowGap ? rowGapMap[rowGap] : gapMap[gap],
        columnGap && columnGapMap[columnGap],
        alignItems && alignItemsMap[alignItems],
        justifyItems && justifyItemsMap[justifyItems],
        className
      )}
    >
      {children}
    </Component>
  );
}

const gapMap: Record<GridGap, string> = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const rowGapMap: Record<GridGap, string> = {
  none: 'gap-y-0',
  xs: 'gap-y-2',
  sm: 'gap-y-3',
  md: 'gap-y-4',
  lg: 'gap-y-6',
  xl: 'gap-y-8',
};

const columnGapMap: Record<GridGap, string> = {
  none: 'gap-x-0',
  xs: 'gap-x-2',
  sm: 'gap-x-3',
  md: 'gap-x-4',
  lg: 'gap-x-6',
  xl: 'gap-x-8',
};
