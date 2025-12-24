"use client"

import { Card } from "@/components/ui/card"
import { Thermometer, Zap, TrendingUp, Activity } from "lucide-react"

interface MetricsGridProps {
  data: any
}

export function MetricsGrid({ data }: MetricsGridProps) {
  const metrics = [
    {
      title: "Current Temperature",
      value: data?.temperature ? `${Math.round(data.temperature)}°C` : "N/A",
      icon: Thermometer,
      color: "text-chart-1",
    },
    {
      title: "Current Load",
      value: data?.load ? `${Math.round(data.load)} kW` : "N/A",
      icon: Zap,
      color: "text-chart-2",
    },
    {
      title: "Temp-Load Correlation",
      value: data?.correlation ? data.correlation.toFixed(2) : "N/A",
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      title: "Peak Load Today",
      value: data?.peakLoad ? `${Math.round(data.peakLoad)} kW` : "N/A",
      icon: Activity,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-card">
          <div className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{metric.title}</span>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
