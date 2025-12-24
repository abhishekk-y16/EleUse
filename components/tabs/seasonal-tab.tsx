"use client"

import { useState, useEffect } from "react"
import { fetchWeatherData } from "@/lib/api/weather"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SeasonalChart } from "@/components/charts/seasonal-chart"
import { HeatmapChart } from "@/components/charts/heatmap-chart"

export function SeasonalTab() {
  const [year, setYear] = useState(2024)
  const [nextHDD, setNextHDD] = useState<number | null>(null)
  const [nextCDD, setNextCDD] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const weather = await fetchWeatherData(40.7128, -74.006)
        const temps = weather?.hourlyData?.temperature_2m || []
        const base = 18.3
        let hdd = 0
        let cdd = 0
        for (let t of temps.slice(0, 24)) {
          if (typeof t !== "number") continue
          if (t < base) hdd += base - t
          if (t > base) cdd += t - base
        }
        if (mounted) {
          setNextHDD(Math.round(hdd * 10) / 10)
          setNextCDD(Math.round(cdd * 10) / 10)
        }
      } catch (e) {
        console.warn("[v0] Failed to compute degree days", e)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Heating & Cooling Degree Days</CardTitle>
          <CardDescription>
            Cumulative degree-day data (base temperature 18.3°C) showing seasonal thermal load distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeasonalChart />
        </CardContent>
      </Card>

      {/* compute next 24-hour HDD/CDD and show in summary */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Degree Day Summary (next 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Next 24h HDD</p>
                <p className="text-2xl font-bold">{nextHDD !== null ? nextHDD.toFixed(1) : "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Next 24h CDD</p>
                <p className="text-2xl font-bold">{nextCDD !== null ? nextCDD.toFixed(1) : "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Base Temperature</p>
                <p className="text-2xl font-bold">18.3°C</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Data Window</p>
                <p className="text-2xl font-bold">24 hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          <TabsTrigger value="heatmap">Daily Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { month: "Jan", hdd: 450, cdd: 0, demand: 3400 },
              { month: "Feb", hdd: 380, cdd: 0, demand: 3200 },
              { month: "Mar", hdd: 300, cdd: 10, demand: 2800 },
              { month: "Apr", hdd: 150, cdd: 50, demand: 2300 },
              { month: "May", hdd: 20, cdd: 120, demand: 2100 },
              { month: "Jun", hdd: 0, cdd: 220, demand: 2400 },
              { month: "Jul", hdd: 0, cdd: 280, demand: 2800 },
              { month: "Aug", hdd: 0, cdd: 270, demand: 2750 },
              { month: "Sep", hdd: 0, cdd: 180, demand: 2200 },
              { month: "Oct", hdd: 50, cdd: 80, demand: 2100 },
              { month: "Nov", hdd: 200, cdd: 10, demand: 2600 },
              { month: "Dec", hdd: 400, cdd: 0, demand: 3300 },
            ].map((m) => (
              <Card key={m.month} className="bg-card/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-center">{m.month}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">HDD:</span>
                      <span className="font-mono font-bold">{m.hdd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CDD:</span>
                      <span className="font-mono font-bold">{m.cdd}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Load:</span>
                      <span className="font-mono font-bold text-chart-2">{m.demand} kW</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Peak Load Heatmap</CardTitle>
              <CardDescription>Hour vs Day of Week: Identify peak demand periods throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Seasonal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total HDD (Sample)</p>
                <p className="text-2xl font-bold">3,000</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total CDD (Sample)</p>
                <p className="text-2xl font-bold">1,800</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Peak Month</p>
                <p className="text-2xl font-bold">July</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Max Load</p>
                <p className="text-2xl font-bold">4.2 MW</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
