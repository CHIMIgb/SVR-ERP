import { cn } from '@/lib/utils';
import { Center } from '@/components/ui/Center';
import { avatarClasses } from './Avatar.styles';

export type AvatarSize = keyof typeof avatarClasses.sizes;
export type AvatarColor = keyof typeof avatarClasses.colors;

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const colorPool: AvatarColor[] = ['primary', 'success', 'warning', 'info', 'error'];

function getColorFromName(name: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPool[Math.abs(hash) % colorPool.length];
}

export function Avatar({
  name = '',
  src,
  size = 'md',
  color,
  className,
}: AvatarProps) {
  const resolvedColor = color || getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(avatarClasses.base, avatarClasses.sizes[size], avatarClasses.image, className)}
      />
    );
  }

  return (
    <Center
      inline
      className={cn(
        avatarClasses.base,
        avatarClasses.sizes[size],
        avatarClasses.colors[resolvedColor],
        className
      )}
    >
      {getInitials(name)}
    </Center>
  );
}
