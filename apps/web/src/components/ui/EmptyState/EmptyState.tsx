import { FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Center } from '@/components/ui/Center';
import { Stack } from '@/components/ui/Stack';
import { emptyStateClasses } from './EmptyState.styles';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No hay registros',
  subtitle = 'No se encontraron resultados para tu busqueda.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <Center axis="both" className={cn('py-10 sm:py-16 px-4 overflow-hidden', className)}>
      <Stack gap="sm" align="center">
        <Center className={emptyStateClasses.iconWrapper}>
          {icon || <FileSearch className={emptyStateClasses.icon} size={36} />}
        </Center>
        <h3 className={emptyStateClasses.title}>{title}</h3>
        <p className={emptyStateClasses.subtitle}>{subtitle}</p>
        {action && <div className="mt-5">{action}</div>}
      </Stack>
    </Center>
  );
}
