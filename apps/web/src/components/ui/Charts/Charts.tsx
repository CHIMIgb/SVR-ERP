'use client';

import { useState, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import { chartClasses } from './Charts.styles';

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface MultiSeriesData {
  name: string;
  data: number[];
  color?: string;
}

export interface ChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

export interface MultiChartProps {
  title?: string;
  subtitle?: string;
  labels: string[];
  series: MultiSeriesData[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

/* ── Default Colors ── */
const COLORS = [
  '#ed8238', '#3d9b6e', '#557fb5', '#d4963a', '#c75450',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function getColor(index: number, custom?: string): string {
  return custom || COLORS[index % COLORS.length];
}

/* ────────────────────────────────────────────────────────────────
   BarChart
   ──────────────────────────────────────────────────────────────── */

export function BarChart({
  title,
  subtitle,
  data,
  height = 250,
  showGrid = true,
  showLabels = true,
  showLegend = false,
  className,
}: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value));
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100;
  const chartHeight = 100;
  const barWidth = Math.min(80, (chartWidth - padding.left - padding.right) / data.length * 0.6);
  const gap = (chartWidth - padding.left - padding.right) / data.length;

  const getY = (value: number) => {
    const ratio = value / (maxValue * 1.1);
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
  };

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height }}>
          {/* Grid lines */}
          {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding.left}
              y1={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              className={chartClasses.gridLine}
            />
          ))}

          {/* Y-axis labels */}
          {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(maxValue * 1.1 * (1 - ratio));
            return (
              <text
                key={`y-${ratio}`}
                x={padding.left - 2}
                y={padding.top + (chartHeight - padding.top - padding.bottom) * ratio + 1}
                textAnchor="end"
                dominantBaseline="middle"
                className={chartClasses.axisLabel}
              >
                {val}
              </text>
            );
          })}

          {/* Bars */}
          {data.map((item, i) => {
            const x = padding.left + gap * i + (gap - barWidth) / 2;
            const barH = ((chartHeight - padding.top - padding.bottom) * item.value) / (maxValue * 1.1);
            const y = chartHeight - padding.bottom - barH;
            const isHovered = hoveredIndex === i;
            const color = getColor(i, item.color);

            return (
              <g key={`bar-${item.label}-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(0, barH)}
                  rx={2}
                  fill={color}
                  opacity={hoveredIndex !== null ? (isHovered ? 1 : 0.4) : 0.85}
                  className={chartClasses.barRect}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {showLabels && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - padding.bottom + 5}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    className={chartClasses.barLabel}
                  >
                    {item.label.length > 6 ? item.label.slice(0, 6) + '…' : item.label}
                  </text>
                )}
                {isHovered && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 3}
                    textAnchor="middle"
                    dominantBaseline="auto"
                    className="text-[8px] font-bold fill-slate-700"
                  >
                    {item.value.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {data.map((item, i) => (
            <span key={`legend-${item.label}-${i}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(i, item.color) }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   LineChart / AreaChart
   ──────────────────────────────────────────────────────────────── */

export function LineChart({
  title,
  subtitle,
  labels,
  series,
  height = 250,
  showGrid = true,
  showLegend = true,
  className,
}: MultiChartProps & { showArea?: boolean }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(0, Math.min(...allValues));
  const range = maxValue - minValue;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100;
  const chartHeight = 100;
  const stepX = (chartWidth - padding.left - padding.right) / Math.max(1, labels.length - 1);

  const getX = (i: number) => padding.left + stepX * i;
  const getY = (val: number) => {
    const ratio = (val - minValue) / (range * 1.1 || 1);
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
  };

  const buildPath = (data: number[]) => {
    return data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  };

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height }}>
          {/* Grid */}
          {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding.left}
              y1={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              className={chartClasses.gridLine}
            />
          ))}

          {/* X-axis labels */}
          {labels.map((label, i) => (
            <text
              key={`x-${label}-${i}`}
              x={getX(i)}
              y={chartHeight - padding.bottom + 5}
              textAnchor="middle"
              dominantBaseline="hanging"
              className={chartClasses.barLabel}
            >
              {label.length > 6 ? label.slice(0, 6) + '…' : label}
            </text>
          ))}

          {/* Lines */}
          {series.map((s, si) => {
            const color = getColor(si, s.color);
            return (
              <g key={`series-${s.name}-${si}`}>
                <path
                  d={buildPath(s.data)}
                  stroke={color}
                  strokeWidth={1.5}
                  className={chartClasses.linePath}
                />
                {s.data.map((val, i) => (
                  <circle
                    key={`dot-${s.name}-${i}`}
                    cx={getX(i)}
                    cy={getY(val)}
                    r={hoveredIndex === i ? 3 : 2}
                    fill={color}
                    opacity={hoveredIndex !== null ? (hoveredIndex === i ? 1 : 0.4) : 1}
                    className={chartClasses.lineDot}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {series.map((s, si) => (
            <span key={`legend-${s.name}-${si}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(si, s.color) }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   AreaChart
   ──────────────────────────────────────────────────────────────── */

export function AreaChart({
  title,
  subtitle,
  labels,
  series,
  height = 250,
  showGrid = true,
  showLegend = true,
  className,
}: MultiChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(0, Math.min(...allValues));
  const range = maxValue - minValue;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100;
  const chartHeight = 100;
  const stepX = (chartWidth - padding.left - padding.right) / Math.max(1, labels.length - 1);
  const baseY = chartHeight - padding.bottom;

  const getX = (i: number) => padding.left + stepX * i;
  const getY = (val: number) => {
    const ratio = (val - minValue) / (range * 1.1 || 1);
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
  };

  const buildLinePath = (data: number[]) => {
    return data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  };

  const buildAreaPath = (data: number[]) => {
    const line = data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
    return `${line} L ${getX(data.length - 1)} ${baseY} L ${getX(0)} ${baseY} Z`;
  };

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height }}>
          {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding.left}
              y1={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
              className={chartClasses.gridLine}
            />
          ))}

          {labels.map((label, i) => (
            <text
              key={`x-${label}-${i}`}
              x={getX(i)}
              y={chartHeight - padding.bottom + 5}
              textAnchor="middle"
              dominantBaseline="hanging"
              className={chartClasses.barLabel}
            >
              {label.length > 6 ? label.slice(0, 6) + '…' : label}
            </text>
          ))}

          {series.map((s, si) => {
            const color = getColor(si, s.color);
            return (
              <g key={`area-${s.name}-${si}`}>
                <path
                  d={buildAreaPath(s.data)}
                  fill={color}
                  opacity={0.15}
                  className={chartClasses.areaPath}
                />
                <path
                  d={buildLinePath(s.data)}
                  stroke={color}
                  strokeWidth={1.5}
                  className={chartClasses.linePath}
                />
                {s.data.map((val, i) => (
                  <circle
                    key={`dot-${s.name}-${i}`}
                    cx={getX(i)}
                    cy={getY(val)}
                    r={hoveredIndex === i ? 3 : 2}
                    fill={color}
                    opacity={hoveredIndex !== null ? (hoveredIndex === i ? 1 : 0.4) : 1}
                    className={chartClasses.lineDot}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {series.map((s, si) => (
            <span key={`legend-${s.name}-${si}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(si, s.color) }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PieChart
   ──────────────────────────────────────────────────────────────── */

export function PieChart({
  title,
  subtitle,
  data,
  height = 250,
  showLegend = true,
  className,
}: Omit<ChartProps, 'showGrid' | 'showLabels'>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 50;
  const cy = 50;
  const radius = 38;

  let startAngle = -90;

  const slices = data.map((item, i) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
    const labelRadius = radius * 0.65;
    const labelX = cx + labelRadius * Math.cos(midAngle);
    const labelY = cy + labelRadius * Math.sin(midAngle);

    startAngle = endAngle;

    return { path, labelX, labelY, percentage, color: getColor(i, item.color), item, i };
  });

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
          {slices.map((s) => (
            <g key={`slice-${s.item.label}-${s.i}`}>
              <path
                d={s.path}
                fill={s.color}
                opacity={hoveredIndex !== null ? (hoveredIndex === s.i ? 1 : 0.5) : 0.85}
                className={chartClasses.pieSlice}
                onMouseEnter={() => setHoveredIndex(s.i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {s.percentage > 0.08 && (
                <text
                  x={s.labelX}
                  y={s.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={chartClasses.pieLabel}
                >
                  {Math.round(s.percentage * 100)}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {data.map((item, i) => (
            <span key={`legend-${item.label}-${i}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(i, item.color) }} />
              {item.label} ({item.value})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   DoughnutChart
   ──────────────────────────────────────────────────────────────── */

export function DoughnutChart({
  title,
  subtitle,
  data,
  height = 250,
  showLegend = true,
  className,
}: Omit<ChartProps, 'showGrid' | 'showLabels'> & { innerLabel?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 50;
  const cy = 50;
  const outerRadius = 40;
  const innerRadius = 25;

  let startAngle = -90;

  const slices = data.map((item, i) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const outerX1 = cx + outerRadius * Math.cos(startRad);
    const outerY1 = cy + outerRadius * Math.sin(startRad);
    const outerX2 = cx + outerRadius * Math.cos(endRad);
    const outerY2 = cy + outerRadius * Math.sin(endRad);

    const innerX1 = cx + innerRadius * Math.cos(endRad);
    const innerY1 = cy + innerRadius * Math.sin(endRad);
    const innerX2 = cx + innerRadius * Math.cos(startRad);
    const innerY2 = cy + innerRadius * Math.sin(startRad);

    const path = `M ${outerX1} ${outerY1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerX2} ${outerY2} L ${innerX1} ${innerY1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX2} ${innerY2} Z`;

    startAngle = endAngle;

    return { path, percentage, color: getColor(i, item.color), item, i };
  });

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
          {slices.map((s) => (
            <g key={`donut-${s.item.label}-${s.i}`}>
              <path
                d={s.path}
                fill={s.color}
                opacity={hoveredIndex !== null ? (hoveredIndex === s.i ? 1 : 0.5) : 0.85}
                className={chartClasses.pieSlice}
                onMouseEnter={() => setHoveredIndex(s.i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-slate-900">
            {total.toLocaleString()}
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" className="text-[5px] fill-slate-500 font-medium">
            TOTAL
          </text>
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {data.map((item, i) => (
            <span key={`legend-${item.label}-${i}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(i, item.color) }} />
              {item.label} ({item.value})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PolarAreaChart
   ──────────────────────────────────────────────────────────────── */

export function PolarAreaChart({
  title,
  subtitle,
  data,
  height = 250,
  showLegend = true,
  className,
}: Omit<ChartProps, 'showGrid' | 'showLabels'>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value));
  const cx = 50;
  const cy = 50;
  const maxRadius = 40;
  const sliceAngle = (2 * Math.PI) / data.length;

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
          {/* Grid circles */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <circle
              key={`polar-grid-${ratio}`}
              cx={cx}
              cy={cy}
              r={maxRadius * ratio}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={0.3}
            />
          ))}

          {/* Slices */}
          {data.map((item, i) => {
            const startAngle = -Math.PI / 2 + sliceAngle * i;
            const endAngle = startAngle + sliceAngle;
            const radius = (item.value / maxValue) * maxRadius;

            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);

            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
            const color = getColor(i, item.color);

            return (
              <path
                key={`polar-${item.label}-${i}`}
                d={path}
                fill={color}
                opacity={hoveredIndex !== null ? (hoveredIndex === i ? 1 : 0.5) : 0.7}
                className={chartClasses.pieSlice}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {data.map((item, i) => (
            <span key={`legend-${item.label}-${i}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(i, item.color) }} />
              {item.label} ({item.value})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   ScatterChart
   ──────────────────────────────────────────────────────────────── */

export interface ScatterChartProps {
  title?: string;
  subtitle?: string;
  points: ScatterPoint[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function ScatterChart({
  title,
  subtitle,
  points,
  height = 250,
  showGrid = true,
  showLegend = false,
  className,
}: ScatterChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100;
  const chartHeight = 100;

  const getX = (val: number) => padding.left + ((val / (maxX * 1.1)) * (chartWidth - padding.left - padding.right));
  const getY = (val: number) => {
    const ratio = val / (maxY * 1.1);
    return padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
  };

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height }}>
          {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={`scatter-grid-${ratio}`}>
              <line
                x1={padding.left}
                y1={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
                x2={chartWidth - padding.right}
                y2={padding.top + (chartHeight - padding.top - padding.bottom) * ratio}
                className={chartClasses.gridLine}
              />
              <line
                x1={padding.left + (chartWidth - padding.left - padding.right) * ratio}
                y1={padding.top}
                x2={padding.left + (chartWidth - padding.left - padding.right) * ratio}
                y2={chartHeight - padding.bottom}
                className={chartClasses.gridLine}
              />
            </g>
          ))}

          {points.map((point, i) => {
            const color = getColor(i, point.color);
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={`scatter-${point.label || i}`}
                cx={getX(point.x)}
                cy={getY(point.y)}
                r={isHovered ? 4 : 2.5}
                fill={color}
                opacity={hoveredIndex !== null ? (isHovered ? 1 : 0.5) : 0.8}
                className={chartClasses.scatterDot}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   RadialBarChart
   ──────────────────────────────────────────────────────────────── */

export interface RadialBarProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function RadialBarChart({
  title,
  subtitle,
  data,
  height = 200,
  showLegend = true,
  className,
}: RadialBarProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const cx = 50;
  const cy = 50;
  const baseRadius = 35;
  const barHeight = 6;
  const gap = 2;

  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
          {data.map((item, i) => {
            const radius = baseRadius - i * (barHeight + gap);
            const circumference = 2 * Math.PI * radius;
            const percentage = item.value / (maxValue * 1.1);
            const dashLength = circumference * percentage;
            const color = getColor(i, item.color);

            return (
              <g key={`radial-${item.label}-${i}`}>
                {/* Background */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={barHeight}
                />
                {/* Progress */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={barHeight}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  className="transition-all duration-500"
                />
              </g>
            );
          })}
          <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-slate-900">
            {data[0]?.value ?? 0}
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" className="text-[5px] fill-slate-500 font-medium">
            {data[0]?.label ?? ''}
          </text>
        </svg>
      </div>
      {showLegend && (
        <div className={chartClasses.footer}>
          {data.map((item, i) => (
            <span key={`legend-${item.label}-${i}`} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: getColor(i, item.color) }} />
              {item.label} ({item.value})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
