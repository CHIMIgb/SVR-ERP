export const separatorClasses = {
  base: 'shrink-0 bg-slate-200',
  horizontal: 'h-px w-full',
  vertical: 'w-px h-full',
};

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorSize = 'thin' | 'medium' | 'thick';

export const horizontalThicknessMap: Record<SeparatorSize, string> = {
  thin: 'h-px',
  medium: 'h-[2px]',
  thick: 'h-1',
};

export const verticalThicknessMap: Record<SeparatorSize, string> = {
  thin: 'w-px',
  medium: 'w-[2px]',
  thick: 'w-1',
};
