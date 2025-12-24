"use client"

import { TabsContent } from "@/components/ui/tabs"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { useState, useEffect } from "react"
import { fetchWeatherData, generateMockLoadData } from "@/lib/api/weather"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "@/components/charts/forecast-chart"
import { AlertCircle, Zap, TrendingUp } from "lucide-react"

export function ForecastTab() {
  const [forecastData, setForecastData] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [confidence, setConfidence] = useState(0.92)

  useEffect(() => {
    let mounted = true
    const buildForecast = async () => {
      try {
        const weather = await fetchWeatherData(40.7128, -74.006)
        const loads = generateMockLoadData()
        const data = loads.map((l) => {
          const conf = 0.88 + Math.random() * 0.1
          return {
            time: l.hour,
            forecast: l.load,
            confidence: conf,
            lowerBound: Math.round(l.load * (1 - (1 - conf) * 0.5)),
            upperBound: Math.round(l.load * (1 + (1 - conf) * 0.5)),
          }
        })
        if (mounted) setForecastData(data)

        // Alerts (derive simple peak alert from loads)
        const peak = data.some((d) => d.forecast > 3000)
        if (mounted)
          setAlerts([
            peak
              ? {
                  type: "warning",
                  title: "Peak Load Expected",
                  description: "High demand forecasted in upcoming hours",
                  severity: "medium",
                }
              : {
                  type: "info",
                  title: "Favorable Conditions",
                  description: "No significant peaks expected in next 24 hours",
                  severity: "low",
                },
          ])
      } catch (e) {
        console.warn("[v0] Failed to build forecast", e)
      }
    }

    buildForecast()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forecast">24-Hour Forecast</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Forecast (Next 24 Hours)</CardTitle>
              <CardDescription>
                Predicted electricity demand with confidence intervals (avg confidence: {(confidence * 100).toFixed(1)}
                %)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForecastChart data={forecastData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Accuracy Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 border-l-2 border-chart-1 pl-4">
                  <p className="text-sm text-muted-foreground">Mean Absolute % Error (MAPE)</p>
                  <p className="text-3xl font-bold">3.8%</p>
                  <p className="text-xs text-muted-foreground">Within acceptable range (&lt;5%)</p>
                </div>
                <div className="space-y-2 border-l-2 border-chart-2 pl-4">
                  <p className="text-sm text-muted-foreground">Root Mean Square Error</p>
                  <p className="text-3xl font-bold">98 kW</p>
                  <p className="text-xs text-muted-foreground">±2.8% of avg demand</p>
                </div>
                <div className="space-y-2 border-l-2 border-chart-3 pl-4">
                  <p className="text-sm text-muted-foreground">Prediction Interval Coverage</p>
                  <p className="text-3xl font-bold">95.2%</p>
                  <p className="text-xs text-muted-foreground">90% confidence bounds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert, i) => (
            <Card
              key={i}
              className={`border-l-4 ${alert.severity === "high" ? "border-l-destructive" : alert.severity === "medium" ? "border-l-chart-1" : "border-l-chart-2"}`}
            >
              <CardContent className="pt-6 flex gap-4">
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 mt-1 ${alert.severity === "high" ? "text-destructive" : alert.severity === "medium" ? "text-chart-1" : "text-chart-2"}`}
                />
                <div className="flex-1">
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Operational Recommendations</CardTitle>
              <CardDescription>Data-driven suggestions for grid management and energy efficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-chart-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Load Shifting Opportunity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Encourage flexible loads to shift from 18:00-20:00 to 11:00-14:00 periods
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                <Zap className="w-5 h-5 text-chart-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Energy Efficiency Audit</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current thermal elasticity indicates significant cooling demand. Review AC maintenance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
