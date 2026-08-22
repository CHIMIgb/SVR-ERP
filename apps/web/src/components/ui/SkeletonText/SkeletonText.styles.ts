export const skeletonTextClasses = {
  base: 'bg-slate-200 rounded animate-pulse',
  line: 'h-3',
  title: 'h-5',
};

export type SkeletonTextWidth = 'full' | 'random' | string[];

export function getLineWidth(
  width: SkeletonTextWidth,
  index: number,
  total: number,
  lastLineWidth?: string
): string {
  if (lastLineWidth && index === total - 1 && total > 1) {
    return lastLineWidth;
  }

  if (Array.isArray(width)) {
    return width[index % width.length];
  }

  if (width === 'random') {
    const widths = ['w-full', 'w-[92%]', 'w-[85%]', 'w-[78%]', 'w-[95%]'];
    return widths[index % widths.length];
  }

  return 'w-full';
}
