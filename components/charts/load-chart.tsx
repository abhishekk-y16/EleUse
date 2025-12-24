"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const mockData = [
  { hour: "00:00", load: 2400, temp: 12 },
  { hour: "04:00", load: 1398, temp: 9 },
  { hour: "08:00", load: 3200, temp: 8 },
  { hour: "12:00", load: 2780, temp: 18 },
  { hour: "16:00", load: 1890, temp: 22 },
  { hour: "20:00", load: 2390, temp: 16 },
  { hour: "23:59", load: 3490, temp: 13 },
]

export function LoadChart({ data }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Load Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={mockData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: `1px solid var(--color-border)`,
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="load" stroke="var(--color-chart-2)" strokeWidth={2} name="Load (kW)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
