'use client';

import { cn } from '@/lib/utils';
import { chartClasses } from './Charts.styles';
import {
  BarChart as ReBarChart,
  LineChart as ReLineChart,
  AreaChart as ReAreaChart,
  PieChart as RePieChart,
  ScatterChart as ReScatterChart,
  Bar,
  Line,
  Area,
  Pie,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart,
  Radar,
  RadialBarChart as ReRadialBarChart,
  RadialBar,
  Treemap,
} from 'recharts';

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface MultiSeriesData {
  name: string;
  data: number[];
  color?: string;
}

/* ── Default Colors ── */
const COLORS = [
  '#ed8238', '#3d9b6e', '#557fb5', '#d4963a', '#c75450',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function getColor(index: number, custom?: string): string {
  return custom || COLORS[index % COLORS.length];
}

/* ── Shared Tooltip Config ── */
const tooltipProps = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
  },
  cursor: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' },
};

/* ────────────────────────────────────────────────────────────────
   ChartWrapper
   ──────────────────────────────────────────────────────────────── */

interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  className?: string;
  children: React.ReactNode;
  legendItems?: { name: string; color: string }[];
}

function ChartWrapper({
  title,
  subtitle,
  height = 300,
  showLegend = false,
  className,
  children,
  legendItems,
}: ChartWrapperProps) {
  return (
    <div className={cn(chartClasses.container, className)}>
      {(title || subtitle) && (
        <div className={chartClasses.header}>
          {title && <h3 className={chartClasses.title}>{title}</h3>}
          {subtitle && <p className={chartClasses.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={chartClasses.body}>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>
      {showLegend && legendItems && (
        <div className={chartClasses.footer}>
          {legendItems.map((item) => (
            <span key={item.name} className={chartClasses.legendItem}>
              <span className={chartClasses.legendDot} style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   BarChart
   ──────────────────────────────────────────────────────────────── */

export interface BarChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function BarChart({
  title,
  subtitle,
  data,
  height = 300,
  showGrid = true,
  showLabels = true,
  showLegend = false,
  className,
}: BarChartProps) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
      legendItems={data.map((d, i) => ({ name: d.label, color: getColor(i, d.color) }))}
    >
      <ReBarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipProps} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={getColor(i, data[i].color)} />
          ))}
        </Bar>
      </ReBarChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   LineChart
   ──────────────────────────────────────────────────────────────── */

export interface LineChartProps {
  title?: string;
  subtitle?: string;
  labels: string[];
  series: MultiSeriesData[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function LineChart({
  title,
  subtitle,
  labels,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  className,
}: LineChartProps) {
  const chartData = labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    series.forEach((s) => {
      point[s.name] = s.data[i] ?? 0;
    });
    return point;
  });

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
      legendItems={series.map((s, i) => ({ name: s.name, color: getColor(i, s.color) }))}
    >
      <ReLineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipProps} />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={getColor(i, s.color)}
            strokeWidth={2}
            dot={{ r: 4, fill: getColor(i, s.color) }}
            activeDot={{ r: 6 }}
          />
        ))}
      </ReLineChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   AreaChart
   ──────────────────────────────────────────────────────────────── */

export interface AreaChartProps {
  title?: string;
  subtitle?: string;
  labels: string[];
  series: MultiSeriesData[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function AreaChart({
  title,
  subtitle,
  labels,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  className,
}: AreaChartProps) {
  const chartData = labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    series.forEach((s) => {
      point[s.name] = s.data[i] ?? 0;
    });
    return point;
  });

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
      legendItems={series.map((s, i) => ({ name: s.name, color: getColor(i, s.color) }))}
    >
      <ReAreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipProps} />
        {series.map((s, i) => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={getColor(i, s.color)}
            fill={getColor(i, s.color)}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </ReAreaChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   PieChart
   ──────────────────────────────────────────────────────────────── */

export interface PieChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  className?: string;
}

export function PieChart({
  title,
  subtitle,
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  className,
}: PieChartProps) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
      legendItems={data.map((d, i) => ({ name: d.label, color: getColor(i, d.color) }))}
    >
      <RePieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={getColor(i, data[i].color)} />
          ))}
        </Pie>
        <Tooltip {...tooltipProps} />
      </RePieChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   DoughnutChart
   ──────────────────────────────────────────────────────────────── */

export function DoughnutChart({
  title,
  subtitle,
  data,
  height = 300,
  showLegend = true,
  className,
}: Omit<PieChartProps, 'innerRadius'>) {
  return (
    <PieChart
      title={title}
      subtitle={subtitle}
      data={data}
      height={height}
      showLegend={showLegend}
      innerRadius={60}
      className={className}
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   RadarChart (reemplaza PolarAreaChart)
   ──────────────────────────────────────────────────────────────── */

export interface RadarChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function RadarChartComponent({
  title,
  subtitle,
  data,
  height = 300,
  showLegend = false,
  className,
}: RadarChartProps) {
  const chartData = data.map((d) => ({ subject: d.label, value: d.value, fullMark: Math.max(...data.map((x) => x.value)) * 1.2 }));

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
    >
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Radar
          name="Valor"
          dataKey="value"
          stroke="#ed8238"
          fill="#ed8238"
          fillOpacity={0.3}
        />
        <Tooltip {...tooltipProps} />
      </RadarChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   RadialBarChart
   ──────────────────────────────────────────────────────────────── */

export interface RadialBarChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export function RadialBarChartComponent({
  title,
  subtitle,
  data,
  height = 300,
  showLegend = true,
  className,
}: RadialBarChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: getColor(i, d.color),
  }));

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      showLegend={showLegend}
      className={className}
      legendItems={data.map((d, i) => ({ name: d.label, color: getColor(i, d.color) }))}
    >
      <ReRadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="90%"
        barSize={12}
        data={chartData}
      >
        <RadialBar
          background
          dataKey="value"
          cornerRadius={6}
        />
        <Tooltip {...tooltipProps} />
      </ReRadialBarChart>
    </ChartWrapper>
  );
}

/* ────────────────────────────────────────────────────────────────
   ScatterChart
   ──────────────────────────────────────────────────────────────── */

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface ScatterChartProps {
  title?: string;
  subtitle?: string;
  points: ScatterPoint[];
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export function ScatterChartComponent({
  title,
  subtitle,
  points,
  height = 300,
  showGrid = true,
  className,
}: ScatterChartProps) {
  const chartData = points.map((p) => ({ x: p.x, y: p.y, name: p.label || '' }));

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      className={className}
    >
      <ReScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          type="number"
          dataKey="x"
          name="X"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Y"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipProps} />
        <Scatter
          name="Datos"
          data={chartData}
          fill="#ed8238"
          fillOpacity={0.8}
        />
      </ReScatterChart>
    </ChartWrapper>
  );
}
