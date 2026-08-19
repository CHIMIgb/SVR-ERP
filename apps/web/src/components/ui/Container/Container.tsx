'use client';

import { cn } from '@/lib/utils';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg';

const maxWidthMap: Record<ContainerSize, string> = {
  sm: 'max-w-screen-sm',   /* 640px */
  md: 'max-w-screen-md',   /* 768px */
  lg: 'max-w-screen-lg',   /* 1024px */
  xl: 'max-w-screen-xl',   /* 1280px */
  full: 'max-w-full',
};

const paddingMap: Record<ContainerPadding, string> = {
  none: 'p-0',
  sm: 'p-4',     /* 16px */
  md: 'p-6',     /* 24px */
  lg: 'p-8',     /* 32px */
};

export interface ContainerProps {
  children: React.ReactNode;
  size?: ContainerSize;
  padding?: ContainerPadding;
  center?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main' | 'aside';
}

export function Container({
  children,
  size = 'xl',
  padding = 'md',
  center = true,
  className,
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        maxWidthMap[size],
        paddingMap[padding],
        center && 'mx-auto',
        'w-full',
        className
      )}
    >
      {children}
    </Tag>
  );
}
