import { cn } from '@/lib/utils';
import { pageHeaderClasses } from './PageHeader.styles';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderClasses.wrapper, className)}>
      <div>
        <h1 className={pageHeaderClasses.title}>{title}</h1>
        {subtitle && <p className={pageHeaderClasses.subtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
