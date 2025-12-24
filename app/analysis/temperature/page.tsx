"use client"

import React, { useEffect, useState } from "react"
import { fetchWeatherData, generateMockLoadData } from "@/lib/api/weather"
import { calculateDegreeDays, calculateCorrelation, calculateThermalElasticity } from "@/lib/analysis/degree-days"
import { CorrelationChart } from "@/components/charts/correlation-chart"
import { LoadChart } from "@/components/charts/load-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function TemperatureImpactPage() {
  const [weather, setWeather] = useState<any | null>(null)
  const [loadData, setLoadData] = useState<any[]>([])
  const [baseTemp, setBaseTemp] = useState<number>(18.3)
  const [hdd, setHdd] = useState<number | null>(null)
  const [cdd, setCdd] = useState<number | null>(null)
  const [correlation, setCorrelation] = useState<number | null>(null)
  const [elasticity, setElasticity] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const w = await fetchWeatherData(40.7128, -74.006)
        const loads = generateMockLoadData()

        // build arrays aligned by hour
        const temps = (w.hourlyData?.temperature_2m || w.hourlyData?.temperature || []).map((t: any) => Number(t))
        const loadsArr = loads.map((l) => l.load)

        if (mounted) {
          setWeather(w)
          setLoadData(loads)
        }

        if (temps.length && loadsArr.length) {
          const r = calculateCorrelation(temps, loadsArr)
          const k = calculateThermalElasticity(temps, loadsArr)
          if (mounted) {
            setCorrelation(Number(r.toFixed(3)))
            setElasticity(Number(k.toFixed(2)))
          }
        }

        // compute HDD/CDD for next day using min/max of hourly temps
        if (w.hourlyData && Array.isArray(w.hourlyData.temperature_2m)) {
          const temps24 = w.hourlyData.temperature_2m.slice(0, 24)
          const maxT = Math.max(...temps24)
          const minT = Math.min(...temps24)
          const dd = calculateDegreeDays(maxT, minT, { baseTemperature: baseTemp, unit: "celsius" })
          if (mounted) {
            setHdd(Number(dd.hdd.toFixed(2)))
            setCdd(Number(dd.cdd.toFixed(2)))
          }
        }
      } catch (error) {
        console.warn("Failed to load temperature impact data", error)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  // recompute HDD/CDD when baseTemp changes
  useEffect(() => {
    if (!weather || !weather.hourlyData || !Array.isArray(weather.hourlyData.temperature_2m)) return
    const temps24 = weather.hourlyData.temperature_2m.slice(0, 24)
    const maxT = Math.max(...temps24)
    const minT = Math.min(...temps24)
    const dd = calculateDegreeDays(maxT, minT, { baseTemperature: baseTemp, unit: "celsius" })
    setHdd(Number(dd.hdd.toFixed(2)))
    setCdd(Number(dd.cdd.toFixed(2)))
  }, [baseTemp, weather])

  const combinedForChart = loadData.length && weather?.hourlyData?.temperature_2m
    ? loadData.slice(0, 24).map((l, i) => ({ temp: Number(weather.hourlyData.temperature_2m[i]), load: l.load }))
    : undefined

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Temperature Impact</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Degree-Day Calculator</CardTitle>
            <CardDescription>Compute HDD/CDD for the next 24 hours (based on hourly temps)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm">Base Temperature (°C)</label>
              <input
                type="number"
                value={baseTemp}
                onChange={(e) => setBaseTemp(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">HDD (next 24h)</p>
                  <p className="text-2xl font-bold">{hdd ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CDD (next 24h)</p>
                  <p className="text-2xl font-bold">{cdd ?? "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correlation</CardTitle>
            <CardDescription>Temperature vs. Load (Pearson r)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pearson correlation</p>
              <p className="text-3xl font-bold">{correlation ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Thermal elasticity: {elasticity ?? "—"} kW/°C</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Snapshot</CardTitle>
            <CardDescription>Latest weather and load</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">Temperature: <strong>{weather?.temperature ?? "—"} °C</strong></p>
              <p className="text-sm">Load (est): <strong>{weather?.load ?? "—"} kW</strong></p>
              <p className="text-sm">Source: <span className="text-xs text-muted-foreground">Tomorrow.io / mock loads</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temperature vs. Load Scatter</CardTitle>
          </CardHeader>
          <CardContent>
            <CorrelationChart data={combinedForChart} />
          </CardContent>
        </Card>

        <div>
          <LoadChart data={loadData} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Methodology</h2>
        <p className="text-sm text-muted-foreground">This analysis uses hourly temperature forecasts combined with synthetic load profiles to estimate degree-days, correlation coefficients, and thermal elasticity. Replace synthetic loads with real telemetry for production-ready results.</p>
      </div>
    </div>
  )
}

