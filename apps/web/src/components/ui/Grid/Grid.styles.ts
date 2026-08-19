export const gridClasses = {
  base: 'grid w-full',
};

export type GridColumns =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ResponsiveColumns {
  sm?: GridColumns;
  md?: GridColumns;
  lg?: GridColumns;
  xl?: GridColumns;
}
