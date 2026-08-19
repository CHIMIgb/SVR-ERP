export const centerClasses = {
  base: 'flex',
  inline: 'inline-flex',
};

export type CenterAxis = 'both' | 'vertical' | 'horizontal';

export const axisMap: Record<CenterAxis, string> = {
  both: 'items-center justify-center',
  vertical: 'items-center',
  horizontal: 'justify-center',
};
