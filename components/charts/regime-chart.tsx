"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RegimeChartProps {
  regime: "all" | "heating" | "cooling"
  data?: Array<{ temp: number; load: number; regime?: string }>
}

const allData = [
  { temp: -10, load: 4200, regime: "heating" },
  { temp: -8, load: 3950, regime: "heating" },
  { temp: -5, load: 3700, regime: "heating" },
  { temp: 0, load: 3200, regime: "heating" },
  { temp: 5, load: 2800, regime: "heating" },
  { temp: 10, load: 2400, regime: "heating" },
  { temp: 15, load: 2100, regime: "heating" },
  { temp: 18, load: 2050, regime: "comfort" },
  { temp: 20, load: 2100, regime: "comfort" },
  { temp: 22, load: 2300, regime: "cooling" },
  { temp: 25, load: 2800, regime: "cooling" },
  { temp: 28, load: 3400, regime: "cooling" },
  { temp: 30, load: 3900, regime: "cooling" },
  { temp: 32, load: 4400, regime: "cooling" },
]

export function RegimeChart({ regime }: RegimeChartProps) {
  const source = data && data.length > 0 ? data : allData
  const getFilteredData = () => {
    if (regime === "heating") {
      return source.filter((d) => d.temp < 18)
    }
    if (regime === "cooling") {
      return source.filter((d) => d.temp > 22)
    }
    return source
  }

  const filtered = getFilteredData()
  const getColor = (d: any) => {
    if (d.regime === "heating") return "var(--color-chart-1)"
    if (d.regime === "cooling") return "var(--color-chart-2)"
    return "var(--color-muted)"
  }

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
        <Legend />
        {/* Render points from filtered data; color by regime if available */}
        <Scatter name="Observations" data={filtered} fill="var(--color-chart-1)" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
