import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statsCardClasses } from './StatsCard.styles';

export type StatsColor = keyof typeof statsCardClasses.iconVariants;
export type StatsTrend = 'up' | 'down' | 'neutral';

export interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: StatsColor;
  trend?: StatsTrend;
  trendValue?: string;
  onClick?: () => void;
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatsCard({
  icon,
  value,
  label,
  color = 'primary',
  trend,
  trendValue,
  onClick,
  className,
}: StatsCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        statsCardClasses.base,
        onClick && statsCardClasses.interactive,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn(statsCardClasses.iconWrapper, statsCardClasses.iconVariants[color])}>
          {icon}
        </div>
        {trend && TrendIcon && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
              statsCardClasses.trend[trend]
            )}
          >
            <TrendIcon size={12} />
            {trendValue}
          </span>
        )}
      </div>
      <p className={statsCardClasses.value}>{value}</p>
      <p className={statsCardClasses.label}>{label}</p>
    </div>
  );
}
