"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mockCorrelationData = [
  { temp: -10, load: 4200 },
  { temp: -8, load: 3950 },
  { temp: -5, load: 3700 },
  { temp: 0, load: 3200 },
  { temp: 5, load: 2800 },
  { temp: 10, load: 2400 },
  { temp: 15, load: 2100 },
  { temp: 18, load: 2050 },
  { temp: 20, load: 2100 },
  { temp: 22, load: 2300 },
  { temp: 25, load: 2800 },
  { temp: 28, load: 3400 },
  { temp: 30, load: 3900 },
  { temp: 32, load: 4400 },
]

interface CorrelationChartProps {
  data?: Array<{ temp: number; load: number }>
}

export function CorrelationChart({ data }: CorrelationChartProps) {
  const chartData = data && data.length > 0 ? data : mockCorrelationData
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="temp" name="Temperature (°C)" stroke="var(--color-muted-foreground)" />
        <YAxis dataKey="load" name="Load (kW)" stroke="var(--color-muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: `1px solid var(--color-border)`,
          }}
        />
        <Scatter name="Observations" data={chartData} fill="var(--color-chart-1)" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
