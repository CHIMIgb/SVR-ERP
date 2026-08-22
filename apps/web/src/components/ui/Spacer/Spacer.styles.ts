export const spacerClasses = {
  base: 'shrink-0',
};

export type SpacerSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export const sizeMap: Record<SpacerSize, string> = {
  none: 'w-0 h-0',
  xs: 'w-2 h-2',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12',
  '3xl': 'w-16 h-16',
};

export const verticalSizeMap: Record<SpacerSize, string> = {
  none: 'h-0',
  xs: 'h-2',
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
  '2xl': 'h-12',
  '3xl': 'h-16',
};

export const horizontalSizeMap: Record<SpacerSize, string> = {
  none: 'w-0',
  xs: 'w-2',
  sm: 'w-3',
  md: 'w-4',
  lg: 'w-6',
  xl: 'w-8',
  '2xl': 'w-12',
  '3xl': 'w-16',
};
