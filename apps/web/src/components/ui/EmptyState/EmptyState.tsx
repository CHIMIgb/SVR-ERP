import { FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className={cn(emptyStateClasses.wrapper, className)}>
      <div className={emptyStateClasses.iconWrapper}>
        {icon || <FileSearch className={emptyStateClasses.icon} size={36} />}
      </div>
      <h3 className={emptyStateClasses.title}>{title}</h3>
      <p className={emptyStateClasses.subtitle}>{subtitle}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
