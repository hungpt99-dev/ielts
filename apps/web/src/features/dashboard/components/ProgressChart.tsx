import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar,
} from 'recharts'
import type { TooltipProps } from 'recharts'

type ChartType = 'bar' | 'pie' | 'donut' | 'radial'

interface BaseDataPoint {
  name: string
  value: number
  color?: string
  [key: string]: unknown
}

interface ProgressChartProps {
  type: ChartType
  data: BaseDataPoint[]
  title?: string
  height?: number
  dataKey?: string
  nameKey?: string
  showLegend?: boolean
  showGrid?: boolean
  emptyMessage?: string
  barColor?: string
  innerRadius?: number
  outerRadius?: number
  formatter?: (value: number) => string
}

const FALLBACK_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info)',
  '#8b5cf6',
]

function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <p className="font-medium">{label ?? payload[0].name}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value as number) : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function ProgressChart({
  type,
  data,
  height = 200,
  dataKey = 'value',
  nameKey = 'name',
  showLegend = true,
  showGrid = true,
  emptyMessage = 'No data available',
  barColor,
  innerRadius,
  outerRadius,
  formatter,
}: ProgressChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height, color: 'var(--color-muted)' }}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  const colors = data.map(d => d.color ?? FALLBACK_COLORS[data.indexOf(d) % FALLBACK_COLORS.length])

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          )}
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Bar
            dataKey={dataKey}
            fill={barColor ?? 'var(--color-primary)'}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'radial') {
    const radialData = data.map((d, i) => ({
      ...d,
      fill: colors[i],
    }))
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={innerRadius ?? 40}
          outerRadius={outerRadius ?? 90}
          barSize={12}
          data={radialData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar dataKey={dataKey} cornerRadius={6} />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
        </RadialBarChart>
      </ResponsiveContainer>
    )
  }

  const pieInner = type === 'donut' ? (innerRadius ?? 50) : 0
  const pieOuter = outerRadius ?? 80

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={pieInner}
          outerRadius={pieOuter}
          paddingAngle={3}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
