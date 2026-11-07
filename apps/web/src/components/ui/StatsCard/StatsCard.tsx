import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statsCardClasses } from './StatsCard.styles';

export type StatsColor = keyof typeof statsCardClasses.iconVariants;
export type StatsTrend = 'up' | 'down' | 'neutral';

export interface StatsCardProps {
  /** Opcional: sin icono la tarjeta usa el diseño limpio (etiqueta arriba, valor abajo). */
  icon?: React.ReactNode;
  value: string | number;
  label: React.ReactNode;
  /** Linea de apoyo bajo el valor (p. ej. el monto de las horas extra). */
  hint?: React.ReactNode;
  color?: StatsColor;
  trend?: StatsTrend;
  trendValue?: string;
  onClick?: () => void;
  /** Mostrar skeleton mientras el dato carga (primera impresión, nunca 0 falso). */
  loading?: boolean;
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
  hint,
  color = 'primary',
  trend,
  trendValue,
  onClick,
  loading = false,
  className,
}: StatsCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  if (loading) {
    // Spinner SOLO en el espacio del valor: icono y etiqueta se muestran reales.
    const valueSpinner = <Loader2 className="w-6 h-6 text-primary animate-spin" />;
    return (
      <div className={cn(statsCardClasses.base, className)} aria-busy="true">
        {icon ? (
          <>
            <div className="flex items-start justify-between">
              <div className={cn(statsCardClasses.iconWrapper, statsCardClasses.iconVariants[color])}>
                {icon}
              </div>
            </div>
            <p className={statsCardClasses.value}>{valueSpinner}</p>
            <p className={statsCardClasses.label}>{label}</p>
          </>
        ) : (
          <>
            <div className={statsCardClasses.plainHeader}>
              <p className={statsCardClasses.plainLabel}>{label}</p>
            </div>
            <p className={statsCardClasses.plainValue}>{valueSpinner}</p>
          </>
        )}
      </div>
    );
  }

  const trendBadge = trend && TrendIcon && (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        statsCardClasses.trend[trend]
      )}
    >
      <TrendIcon size={12} />
      {trendValue}
    </span>
  );

  return (
    <div
      onClick={onClick}
      // Clicable: también se usa con teclado (Enter / Espacio) y se anuncia como botón.
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        statsCardClasses.base,
        onClick && statsCardClasses.interactive,
        className
      )}
    >
      {icon ? (
        <>
          <div className="flex items-start justify-between">
            <div className={cn(statsCardClasses.iconWrapper, statsCardClasses.iconVariants[color])}>
              {icon}
            </div>
            {trendBadge}
          </div>
          <p className={statsCardClasses.value}>{value}</p>
          <p className={statsCardClasses.label}>{label}</p>
        </>
      ) : (
        <>
          <div className={statsCardClasses.plainHeader}>
            <p className={statsCardClasses.plainLabel}>{label}</p>
            {trendBadge && <span className="shrink-0">{trendBadge}</span>}
          </div>
          <p className={statsCardClasses.plainValue}>{value}</p>
        </>
      )}
      {hint && <p className={statsCardClasses.hint}>{hint}</p>}
    </div>
  );
}
