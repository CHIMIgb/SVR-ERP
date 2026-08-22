export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export const showMap: Record<Breakpoint, string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
};
