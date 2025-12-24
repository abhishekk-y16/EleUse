"use client"

import { useEffect, useState } from "react"
import { fetchWeatherData, generateMockLoadData } from "@/lib/api/weather"
import { MetricsGrid } from "@/components/metrics-grid"
import { LoadChart } from "@/components/charts/load-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WeatherData {
  temperature?: number
  humidity?: number
  load?: number
  correlation?: number
  peakLoad?: number
  hourlyData?: any
  success?: boolean
  isFallback?: boolean
  location?: string | null
}

export function OverviewTab() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loadData, setLoadData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    async function reverseGeocode(lat: number, lon: number) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat,
        )}&lon=${encodeURIComponent(lon)}`
        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        })
        if (!res.ok) return null
        const json = await res.json()
        // Prefer city/town/village, fall back to display_name
        const addr = json.address || {}
        return addr.city || addr.town || addr.village || json.display_name || null
      } catch (e) {
        console.warn("[v0] Reverse geocode failed:", e)
        return null
      }
    }

    const fetchForCoords = async (lat: number, lon: number) => {
      try {
        setLoading(true)
        setError(null)

        const weatherData = await fetchWeatherData(lat, lon)

        if (weatherData) {
          setData({
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            load: 2500 + Math.random() * 1000,
            correlation: 0.78,
            peakLoad: 3200,
            hourlyData: weatherData.hourlyData,
            success: weatherData.success,
            isFallback: weatherData.isFallback,
            location: (weatherData as any).locationName || null,
          })

          // Generate mock load profile
          const mockLoad = generateMockLoadData()
          setLoadData(mockLoad)

          // Try reverse geocoding to get a friendly location name when API doesn't provide one
          const name = await reverseGeocode(lat, lon)
          if (name) {
            setData((prev) => (prev ? { ...prev, location: name } : prev))
          }
        } else {
          setError("Unable to load weather data")
        }
      } catch (err) {
        console.error("[v0] Error loading data:", err)
        setError("Error loading dashboard data")
      } finally {
        setLoading(false)
      }
    }

    // Try to get user's current position
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setCoords({ lat, lon })
          fetchForCoords(lat, lon)
        },
        (err) => {
          console.warn("[v0] Geolocation failed, falling back to default coords:", err.message)
          // Fallback to NYC coords
          const fallbackLat = 40.7128
          const fallbackLon = -74.006
          setCoords({ lat: fallbackLat, lon: fallbackLon })
          fetchForCoords(fallbackLat, fallbackLon)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    } else {
      // No geolocation available, use fallback
      const fallbackLat = 40.7128
      const fallbackLon = -74.006
      setCoords({ lat: fallbackLat, lon: fallbackLon })
      fetchForCoords(fallbackLat, fallbackLon)
    }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="inline-block">Loading analysis data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {data?.isFallback && (
        <Alert>
          <AlertDescription>Running on simulated weather data. Live weather API integration pending.</AlertDescription>
        </Alert>
      )}

      {data && <MetricsGrid data={data} />}
      <LoadChart data={loadData} />

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time analysis metrics and model performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Model R²</p>
              <p className="text-2xl font-bold">0.87</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">MAPE</p>
              <p className="text-2xl font-bold">4.2%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-mono">{new Date().toLocaleTimeString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Data Source</p>
              <p className="text-sm font-mono">{data?.isFallback ? "Fallback" : "Live"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="text-sm font-mono">
                {data?.location ? data.location : "Unknown"}
                {coords ? (
                  <span className="block text-xs text-muted-foreground">
                    {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
