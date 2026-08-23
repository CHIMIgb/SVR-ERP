'use client';

import { cn } from '@/lib/utils';
import { Badge, type BadgeVariant, type BadgeSize } from '@/components/ui/Badge';
import { timelineCardClasses } from './TimelineCard.styles';

/** Metadata item displayed as icon + label + value */
export interface TimelineMeta {
  icon?: React.ReactNode;
  label?: string;
  value?: string;
}

/** Badge rendered below metadata — reuses the existing Badge component */
export interface TimelineBadge {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  dot?: boolean;
}

export interface TimelineCardProps {
  /** Date label (e.g., "27 Abr") */
  date: string;
  /** Numeric/icon indicator below the date (e.g., "8 hrs") */
  indicator?: React.ReactNode;
  /** Main title / activity */
  title: string;
  /** Metadata items (machine, worksite, operator...) */
  meta?: TimelineMeta[];
  /** Status badges */
  badges?: TimelineBadge[];
  /** Action buttons rendered at right side */
  actions?: React.ReactNode;
  /** Click handler for the whole card */
  onClick?: () => void;
  className?: string;
  /** Additional content below metadata/badges */
  children?: React.ReactNode;
}

export function TimelineCard({
  date,
  indicator,
  title,
  meta = [],
  badges = [],
  actions,
  onClick,
  className,
  children,
}: TimelineCardProps) {
  return (
    <div
      className={cn(timelineCardClasses.wrapper, onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {/* ── Sidebar: fecha + indicador ── */}
      <div className={timelineCardClasses.sidebar}>
        <span className={timelineCardClasses.dateLabel}>{date}</span>
        {indicator != null && (
          <div className={timelineCardClasses.indicator}>{indicator}</div>
        )}
      </div>

      {/* ── Contenido ── */}
      <div className={timelineCardClasses.content}>
        <h3 className={timelineCardClasses.title}>{title}</h3>

        {meta.length > 0 && (
          <div className={timelineCardClasses.metaRow}>
            {meta.map((m, i) => (
              <span key={i} className={timelineCardClasses.metaItem}>
                {m.icon && <span className={timelineCardClasses.metaIcon}>{m.icon}</span>}
                {m.label && <span>{m.label}</span>}
                {m.value && <span className={timelineCardClasses.metaValue}>{m.value}</span>}
              </span>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <div className={timelineCardClasses.badgeRow}>
            {badges.map((b, i) => (
              <Badge key={i} variant={b.variant} size={b.size ?? 'sm'} dot={b.dot}>
                {b.children}
              </Badge>
            ))}
          </div>
        )}

        {children}
      </div>

      {/* ── Actions ── */}
      {actions && <div className={timelineCardClasses.actions}>{actions}</div>}
    </div>
  );
}
