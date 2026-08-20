export const boxClasses = {
  base: 'box-border',
};

export type BoxPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BoxRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type BoxShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type BoxBackground = 'transparent' | 'white' | 'slate' | 'primary' | 'secondary';
export type BoxBorder = 'none' | 'default' | 'primary';

export const paddingMap: Record<BoxPadding, string> = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const radiusMap: Record<BoxRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export const shadowMap: Record<BoxShadow, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

export const backgroundMap: Record<BoxBackground, string> = {
  transparent: 'bg-transparent',
  white: 'bg-white',
  slate: 'bg-slate-50',
  primary: 'bg-primary/10',
  secondary: 'bg-secondary/10',
};

export const borderMap: Record<BoxBorder, string> = {
  none: 'border-0',
  default: 'border border-slate-200',
  primary: 'border border-primary/30',
};
