"use client"

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ForecastChartProps {
  data: Array<{
    time: string
    forecast: number
    lowerBound: number
    upperBound: number
    confidence: number
  }>
}

export function ForecastChart({ data }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-96 flex items-center justify-center text-muted-foreground">Loading forecast data..</div>
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBounds" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={12} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: `1px solid var(--color-border)`,
            borderRadius: "6px",
          }}
          formatter={(value: any) => {
            if (typeof value === "number") {
              return [`${Math.round(value)} kW`, value]
            }
            return value
          }}
        />
        <Area
          type="monotone"
          dataKey="upperBound"
          stroke="transparent"
          fill="url(#colorBounds)"
          fillOpacity={1}
          name="90% Confidence Bounds"
        />
        <Area
          type="monotone"
          dataKey="forecast"
          stroke="var(--color-chart-2)"
          fillOpacity={1}
          fill="url(#colorForecast)"
          name="Forecast"
          strokeWidth={2}
        />
        <Area type="monotone" dataKey="lowerBound" stroke="transparent" fill="url(#colorBounds)" fillOpacity={0} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
