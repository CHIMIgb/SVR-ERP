export const scrollAreaClasses = {
  base: 'overflow-auto',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  vertical: 'overflow-y-auto overflow-x-hidden',
  both: 'overflow-auto',
  hiddenScrollbar: 'scrollbar-none',
};

export type ScrollAreaOrientation = 'horizontal' | 'vertical' | 'both';

export type ScrollAreaSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const paddingMap: Record<ScrollAreaSize, string> = {
  none: '',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
};
