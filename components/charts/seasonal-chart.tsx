"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const seasonalData = [
  { month: "Jan", hdd: 450, cdd: 0 },
  { month: "Feb", hdd: 380, cdd: 0 },
  { month: "Mar", hdd: 300, cdd: 10 },
  { month: "Apr", hdd: 150, cdd: 50 },
  { month: "May", hdd: 20, cdd: 120 },
  { month: "Jun", hdd: 0, cdd: 220 },
  { month: "Jul", hdd: 0, cdd: 280 },
  { month: "Aug", hdd: 0, cdd: 270 },
  { month: "Sep", hdd: 0, cdd: 180 },
  { month: "Oct", hdd: 50, cdd: 80 },
  { month: "Nov", hdd: 200, cdd: 10 },
  { month: "Dec", hdd: 400, cdd: 0 },
]

export function SeasonalChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={seasonalData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
        <YAxis stroke="var(--color-muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: `1px solid var(--color-border)`,
          }}
        />
        <Legend />
        <Bar dataKey="hdd" stackId="a" fill="var(--color-chart-1)" name="Heating Degree Days" />
        <Bar dataKey="cdd" stackId="a" fill="var(--color-chart-2)" name="Cooling Degree Days" />
      </BarChart>
    </ResponsiveContainer>
  )
}
