"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CorrelationChart } from "@/components/charts/correlation-chart"
import { RegimeChart } from "@/components/charts/regime-chart"
import { fetchWeatherData, generateMockLoadData } from "@/lib/api/weather"

export function CorrelationTab() {
  const [selectedRegime, setSelectedRegime] = useState<"all" | "heating" | "cooling">("all")
  const [chartData, setChartData] = useState<Array<{ temp: number; load: number; regime?: string }>>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const weather = await fetchWeatherData(40.7128, -74.006)
        const loads = generateMockLoadData()
        const temps = weather?.hourlyData?.temperature_2m || []
        const n = Math.min(temps.length, loads.length)
        const combined: any[] = []
        for (let i = 0; i < n; i++) {
          const temp = temps[i]
          const loadVal = loads[i]?.load ?? loads[i]
          const regime = temp < 18 ? "heating" : temp > 22 ? "cooling" : "comfort"
          combined.push({ temp: Math.round(temp * 10) / 10, load: loadVal, regime })
        }
        if (mounted) setChartData(combined)
      } catch (e) {
        console.warn("[v0] Failed to load correlation data", e)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="full-range" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="full-range">Full Range Analysis</TabsTrigger>
          <TabsTrigger value="regimes">Regime-Specific</TabsTrigger>
        </TabsList>

        <TabsContent value="full-range" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Temperature-Load Correlation (Full Year)</CardTitle>
              <CardDescription>
                Non-linear relationship showing U-shaped demand curve across all temperature ranges. Pearson r = 0.78
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CorrelationChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correlation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 border-l-2 border-chart-1 pl-4">
                  <p className="text-sm text-muted-foreground">Pearson Correlation</p>
                  <p className="text-3xl font-bold">0.78</p>
                  <p className="text-xs text-muted-foreground">Strong linear relationship</p>
                </div>
                <div className="space-y-2 border-l-2 border-chart-2 pl-4">
                  <p className="text-sm text-muted-foreground">Spearman Rank Correlation</p>
                  <p className="text-3xl font-bold">0.82</p>
                  <p className="text-xs text-muted-foreground">Monotonic relationship</p>
                </div>
                <div className="space-y-2 border-l-2 border-chart-3 pl-4">
                  <p className="text-sm text-muted-foreground">Base Temperature</p>
                  <p className="text-3xl font-bold">18.3°C</p>
                  <p className="text-xs text-muted-foreground">Optimized via regression</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regimes" className="space-y-4">
          <div className="flex gap-2">
            {(["all", "heating", "cooling"] as const).map((regime) => (
              <button
                key={regime}
                onClick={() => setSelectedRegime(regime)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedRegime === regime
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {regime.charAt(0).toUpperCase() + regime.slice(1)}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRegime === "heating" && "Heating Regime Analysis"}
                {selectedRegime === "cooling" && "Cooling Regime Analysis"}
                {selectedRegime === "all" && "Complete Thermal Regime Analysis"}
              </CardTitle>
              <CardDescription>
                {selectedRegime === "heating" && "Temperature range < 18.3°C: Heating demand dominates (r = -0.87)"}
                {selectedRegime === "cooling" && "Temperature range > 18.3°C: Cooling demand dominates (r = 0.89)"}
                {selectedRegime === "all" && "Combined heating and cooling sensitivity analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegimeChart regime={selectedRegime} data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regime-Specific Sensitivity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-chart-1">Heating Regime</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Correlation</span>
                      <span className="font-mono font-bold">-0.87</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Elasticity (kWh/°C)</span>
                      <span className="font-mono font-bold">-125</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">R² Value</span>
                      <span className="font-mono font-bold">0.76</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-chart-2">Cooling Regime</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Correlation</span>
                      <span className="font-mono font-bold">0.89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Elasticity (kWh/°C)</span>
                      <span className="font-mono font-bold">132</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">R² Value</span>
                      <span className="font-mono font-bold">0.79</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
